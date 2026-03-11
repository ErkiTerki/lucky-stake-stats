import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const systemPrompt = `You are a feedback classifier for a casino resort. Given a customer conversation transcript, extract structured feedback entries.

The available groups are:
- "Se divertir et socialiser" (Entertainment & Socializing — gaming, shows, ambiance)
- "Se restaurer" (Dining — restaurants, bars, food quality)
- "Être reconnu et récompensé" (Loyalty & Rewards — VIP programs, promotions)
- "Être bien accueilli et accompagné" (Service & Hospitality — staff, reception)
- "Séjourner et se détendre" (Stay & Relaxation — hotel, spa, pool)
- "Accéder facilement au site" (Access & Logistics — parking, location, transport)

The available types are:
- "Élément apprécié / Coup de coeur" (for positive feedback)
- "Irritant / Point de douleur" (for negative feedback)

Extract one or more feedback entries from the transcript. Each entry should have:
- type: one of the two types above
- group: one of the groups above
- tag: a short theme label in French (e.g. "Qualité de la nourriture", "Ambiance générale", "Personnel accueillant")
- count: always 1 for individual feedback
- long_description: a French summary of what the customer said about this topic`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the customer conversation transcript:\n\n${transcript}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_feedback_entries",
            description: "Submit extracted feedback entries from the customer conversation",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["Élément apprécié / Coup de coeur", "Irritant / Point de douleur"] },
                      group: { type: "string", enum: [
                        "Se divertir et socialiser",
                        "Se restaurer",
                        "Être reconnu et récompensé",
                        "Être bien accueilli et accompagné",
                        "Séjourner et se détendre",
                        "Accéder facilement au site"
                      ]},
                      tag: { type: "string" },
                      long_description: { type: "string" },
                    },
                    required: ["type", "group", "tag", "long_description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["entries"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_feedback_entries" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { entries } = JSON.parse(toolCall.function.arguments);
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error("No entries extracted");
    }

    // Insert into database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rows = entries.map((e: any) => ({
      type: e.type,
      group: e.group,
      tag: e.tag,
      count: 1,
      long_description: e.long_description,
      children: JSON.stringify([{ count: 1, long_description: e.long_description }]),
      source: "voice",
    }));

    const { data, error } = await supabase.from("feedback_entries").insert(rows).select();
    if (error) {
      console.error("DB insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, entries: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
