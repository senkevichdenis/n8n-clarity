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
    const url = new URL(req.url);
    const path = url.pathname;

    // List all workflows
    if (path === "/n8n-workflows" || path === "/n8n-workflows/") {
      const mcpResponse = await callMCP("search_workflows", {
        limit: 200,
      });

      return new Response(
        JSON.stringify({
          workflows: mcpResponse.workflows || [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get specific workflow details
    const workflowMatch = path.match(/\/n8n-workflows\/([^\/]+)$/);
    if (workflowMatch) {
      const workflowId = workflowMatch[1];
      const mcpResponse = await callMCP("get_workflow_details", {
        workflowId,
      });

      return new Response(
        JSON.stringify({
          workflow: mcpResponse.workflow,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get workflow executions summary
    const executionsMatch = path.match(/\/n8n-workflows\/([^\/]+)\/executions$/);
    if (executionsMatch) {
      const workflowId = executionsMatch[1];
      
      // For now, return a mock summary since n8n MCP doesn't have execution summary endpoint
      // In production, you would call n8n API directly or extend MCP
      return new Response(
        JSON.stringify({
          summary: {
            total: 0,
            successful: 0,
            failed: 0,
            avgDuration: 0,
            longestDuration: 0,
            shortestDuration: 0,
            timeRange: "Last 7 days",
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      }
    );
  } catch (error) {
    console.error("Error:", error);
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

async function callMCP(tool: string, params: any): Promise<any> {
  // This is a placeholder - MCP tools are called through Lovable's MCP infrastructure
  // In production, this would be handled by the platform
  throw new Error("MCP calls must be implemented through Lovable platform");
}
