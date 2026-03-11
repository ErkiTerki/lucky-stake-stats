import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log(
      "Webhook received:",
      JSON.stringify(payload).slice(0, 500)
    );

    // ElevenLabs post_call_transcription webhook payload
    const data = payload.data ?? payload;
    const transcript: { role: string; message: string }[] =
      data.transcript ?? [];

    if (!transcript.length) {
      console.log("No transcript in webhook payload");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a readable transcript string
    const transcriptText = transcript
      .map(
        (t) =>
          `${t.role === "agent" ? "Agent" : "Client"}: ${t.message}`
      )
      .join("\n");

    console.log("Transcript length:", transcriptText.length);

    // ── Call AI to extract structured feedback ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a feedback classifier for a casino resort. Given a customer conversation transcript, extract structured feedback entries.

The available groups are:
- "Se divertir et socialiser" (Entertainment & Socializing)
- "Se restaurer" (Dining)
- "Être reconnu et récompensé" (Loyalty & Rewards)
- "Être bien accueilli et accompagné" (Service & Hospitality)
- "Séjourner et se détendre" (Stay & Relaxation)
- "Accéder facilement au site" (Access & Logistics)

The available types are:
- "Élément apprécié / Coup de coeur" (for positive feedback)
- "Irritant / Point de douleur" (for negative feedback)

Extract one or more feedback entries from the transcript. Each entry should have:
- type: one of the two types above
- group: one of the groups above
- tag: a short theme label in French (e.g. "Qualité de la nourriture", "Ambiance générale", "Personnel accueillant")
- long_description: a French summary of what the customer said about this topic`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Here is the customer conversation transcript:\n\n${transcriptText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_feedback_entries",
                description:
                  "Submit extracted feedback entries from the customer conversation",
                parameters: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            enum: [
                              "Élément apprécié / Coup de coeur",
                              "Irritant / Point de douleur",
                            ],
                          },
                          group: {
                            type: "string",
                            enum: [
                              "Se divertir et socialiser",
                              "Se restaurer",
                              "Être reconnu et récompensé",
                              "Être bien accueilli et accompagné",
                              "Séjourner et se détendre",
                              "Accéder facilement au site",
                            ],
                          },
                          tag: { type: "string" },
                          long_description: { type: "string" },
                        },
                        required: [
                          "type",
                          "group",
                          "tag",
                          "long_description",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submit_feedback_entries" },
          },
        }),
      }
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error(`AI error: ${aiResp.status}`);
    }

    const aiResult = await aiResp.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { entries } = JSON.parse(toolCall.function.arguments);
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error("No entries extracted");
    }

    console.log("Extracted entries:", entries.length);

    // ── Insert into database ──
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rows = entries.map((e: any) => ({
      type: e.type,
      group: e.group,
      tag: e.tag,
      count: 1,
      long_description: e.long_description,
      children: JSON.stringify([
        { count: 1, long_description: e.long_description },
      ]),
      source: "voice",
    }));

    const { data: inserted, error } = await supabase
      .from("feedback_entries")
      .insert(rows)
      .select();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("Inserted entries:", inserted?.length);

    // ElevenLabs expects 200 to confirm receipt
    return new Response(
      JSON.stringify({ success: true, entries_count: inserted?.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("elevenlabs-webhook error:", e);
    // Still return 200 so ElevenLabs doesn't retry endlessly,
    // but include error info for debugging
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
