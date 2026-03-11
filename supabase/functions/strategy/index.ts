import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dataSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Also fetch recent voice entries from DB for extra context
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: recentEntries } = await supabase
      .from("feedback_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    let recentContext = "";
    if (recentEntries && recentEntries.length > 0) {
      recentContext = `\n\n## Recent Voice Feedback (${recentEntries.length} entries)\n`;
      recentEntries.forEach((e: any) => {
        const typeLabel = e.type.includes("apprécié") ? "Positive" : "Negative";
        recentContext += `- [${typeLabel}] ${e.tag} (${e.group}): ${e.long_description}\n`;
      });
    }

    const systemPrompt = `You are a strategic advisor for a casino resort. Based on customer feedback data, generate actionable strategic insights.

Your analysis should cover:
1. **Critical Gaps** — Areas where customer expectations are not being met. Focus on high-frequency negative feedback and patterns.
2. **Quick Wins** — Low-effort, high-impact improvements that can be made immediately.
3. **Competitive Differentiators** — Unique strengths to double down on to stand out from competitors.
4. **Emerging Trends** — New patterns from recent feedback that need attention.
5. **Priority Actions** — Rank the top 5 actions by impact and urgency.

Be specific, cite data points, and provide concrete recommendations. Use markdown formatting.`;

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
          { role: "user", content: `Here is the complete feedback dataset:\n\n${dataSummary}${recentContext}\n\nGenerate strategic insights and actionable recommendations.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
