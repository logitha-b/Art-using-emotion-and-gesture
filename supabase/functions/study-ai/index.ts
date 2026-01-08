import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompts: Record<string, string> = {
      summary: `Summarize this study material in clear, concise bullet points. Focus on key concepts:\n\n${content}`,
      flashcards: `Create 5 flashcards from this study material. Return ONLY valid JSON array: [{"id":"1","front":"question","back":"answer"}]\n\n${content}`,
      quiz: `Create 5 multiple choice questions from this material. Return ONLY valid JSON array: [{"id":"1","question":"...","options":["a","b","c","d"],"correctIndex":0}]\n\n${content}`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompts[mode] }],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "";

    if (mode === "flashcards" || mode === "quiz") {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
