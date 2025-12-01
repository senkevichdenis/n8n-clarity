import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { n8nBaseUrl, n8nApiKey, endpoint, method = "GET" } = await req.json();

    if (!n8nBaseUrl || !n8nApiKey) {
      return new Response(
        JSON.stringify({ error: "n8n credentials not provided" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const url = `${n8nBaseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
    console.log("[n8n-api] request", { endpoint, method, url });

    const n8nResponse = await fetch(url, {
      method,
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        "Content-Type": "application/json",
      },
    });

    const text = await n8nResponse.text();
    
    console.log("[n8n-api] n8n response", {
      endpoint,
      status: n8nResponse.status,
      ok: n8nResponse.ok,
      preview: text.slice(0, 500)
    });

    if (!n8nResponse.ok) {
      console.error("[n8n-api] n8n error response", {
        endpoint,
        status: n8nResponse.status,
        errorText: text
      });
      return new Response(
        JSON.stringify({ 
          error: `n8n API error: ${n8nResponse.status}`,
          details: text
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: n8nResponse.status,
        }
      );
    }

    const data = JSON.parse(text);

    // Filter workflows by tag if this is a workflows list request
    if (endpoint === "/api/v1/workflows") {
      const TAG_FILTER = "explain my automation";
      const filteredData = {
        data: data.data.filter((workflow: any) => 
          workflow.tags?.some((tag: any) => 
            tag.name?.toLowerCase() === TAG_FILTER.toLowerCase()
          )
        )
      };
      return new Response(
        JSON.stringify(filteredData),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // For single workflow endpoint, normalize response
    if (endpoint.startsWith("/api/v1/workflows/")) {
      console.log("[n8n-api] normalizing single workflow response", {
        hasData: !!data.data,
        fallbackToRoot: !data.data && !!data.id
      });
      return new Response(
        JSON.stringify({ data: data.data || data }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // For other endpoints (executions, etc.), normalize response
    return new Response(
      JSON.stringify({ data: data.data || data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[n8n-api] error", {
      endpoint: await req.json().then(j => j.endpoint).catch(() => "unknown"),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
