import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { openRouterKey, n8nBaseUrl, n8nApiKey, model } = await req.json();

    const validationResults = {
      openRouter: { valid: false, error: "" },
      n8n: { valid: false, error: "" },
    };

    // Validate OpenRouter API key
    if (openRouterKey && model) {
      try {
        console.log("[Validate] Testing OpenRouter connection with model:", model);
        
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Connection test" }],
            max_tokens: 5,
          }),
        });

        const responseData = await openRouterResponse.json().catch(() => ({}));
        
        console.log("[Validate] OpenRouter response", {
          status: openRouterResponse.status,
          bodyPreview: JSON.stringify(responseData).slice(0, 300)
        });

        if (openRouterResponse.ok) {
          validationResults.openRouter.valid = true;
        } else {
          validationResults.openRouter.error = responseData.error?.message || `HTTP ${openRouterResponse.status}`;
        }
      } catch (error) {
        console.error("[Validate] OpenRouter error:", error);
        validationResults.openRouter.error = error instanceof Error ? error.message : "Network error";
      }
    }

    // Validate n8n connection
    if (n8nBaseUrl && n8nApiKey) {
      try {
        const n8nResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows`, {
          method: "GET",
          headers: {
            "X-N8N-API-KEY": n8nApiKey,
          },
        });

        if (n8nResponse.ok) {
          const data = await n8nResponse.json();
          if (data && (Array.isArray(data.data) || Array.isArray(data))) {
            validationResults.n8n.valid = true;
          } else {
            validationResults.n8n.error = "Invalid response format from n8n";
          }
        } else {
          validationResults.n8n.error = `Authentication failed: HTTP ${n8nResponse.status}`;
        }
      } catch (error) {
        validationResults.n8n.error = error instanceof Error ? error.message : "Network error";
      }
    }

    return new Response(JSON.stringify(validationResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});