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

    const url = `${n8nBaseUrl}${endpoint}`;
    console.log(`Making ${method} request to n8n:`, url);

    const n8nResponse = await fetch(url, {
      method,
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n API error:", n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `n8n API error: ${n8nResponse.status}`,
          details: errorText
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: n8nResponse.status,
        }
      );
    }

    const data = await n8nResponse.json();

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

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in n8n-api function:", error);
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
