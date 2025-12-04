const WEBHOOK_URL = "https://n8n.isendora.com/webhook/a1eeddbd-d8ff-45b3-bde0-1de5dc92ee31";

interface WebhookPayload {
  action: string;
  sourceTab: "explain" | "docs";
  workflowId: string;
  workflowName: string;
  llmModel: string;
  openRouterApiKey: string | null;
  n8nBaseUrl: string;
  n8nApiKey: string;
  workflowData?: {
    id: string;
    name: string;
    nodes: any[];
    connections: any;
    settings: any;
    active: boolean;
  };
  panelContext: any;
  chat?: {
    input: string | null;
    history: Array<{ role: string; content: string }>;
  };
  clientMeta: {
    timestamp: string;
    appVersion?: string;
  };
}

export async function callWebhook(payload: Omit<WebhookPayload, "clientMeta">): Promise<any> {
  const fullPayload: WebhookPayload = {
    ...payload,
    clientMeta: {
      timestamp: new Date().toISOString(),
      appVersion: "1.0.0",
    },
  };

  console.log(`[Webhook] Calling webhook for action: ${payload.action}`, {
    sourceTab: payload.sourceTab,
    workflowId: payload.workflowId,
    action: payload.action,
  });

  // Set timeout to 300 seconds (5 minutes) - n8n LLM processing can take time
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // First get response as text to see what we got
    const responseText = await response.text();

    console.log(`[Webhook] Raw response:`, {
      status: response.status,
      contentType: response.headers.get('content-type'),
      textPreview: responseText.slice(0, 300),
    });

    if (!response.ok) {
      console.error(`[Webhook] Error response:`, {
        status: response.status,
        error: responseText,
      });
      throw new Error(`Webhook error: ${response.status} - ${responseText}`);
    }

    // Try to parse response as JSON: expect [{ output: "..." }]
    // If parsing fails, treat the entire response as markdown/text output
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.warn(`[Webhook] Response is not JSON, treating as plain text/markdown:`, {
        error: errorMsg,
        textLength: responseText.length,
        textPreview: responseText.slice(0, 200),
      });

      // If JSON parsing fails, assume the entire response is the markdown output
      // This handles cases where n8n returns plain text instead of JSON
      return { success: true, output: responseText };
    }

    console.log(`[Webhook] Success response:`, {
      action: payload.action,
      hasResult: !!result,
      isArray: Array.isArray(result),
      isObject: typeof result === 'object',
      preview: JSON.stringify(result).slice(0, 300),
    });

    // Extract output from n8n webhook response
    // The output field is a string (markdown/text) - do NOT parse it again

    // NEW FORMAT 1: Direct object with responseType: { success, responseType, systemMessage, chatMessage }
    if (result && typeof result === 'object' && 'responseType' in result) {
      console.log(`[Webhook] New format (direct object) detected:`, {
        responseType: result.responseType,
        hasChatMessage: !!result.chatMessage,
        hasSystemMessage: !!result.systemMessage,
      });

      return {
        success: result.success ?? true,
        responseType: result.responseType,
        chatMessage: result.chatMessage,
        systemMessage: result.systemMessage,
      };
    }

    // NEW FORMAT 2: Array with output object: [{ output: { success, responseType, systemMessage, chatMessage } }]
    if (Array.isArray(result) && result.length > 0 && result[0].output && typeof result[0].output === 'object') {
      const outputData = result[0].output;

      // Check if this is the new format with responseType
      if ('responseType' in outputData) {
        console.log(`[Webhook] New format (array with output) detected:`, {
          responseType: outputData.responseType,
          hasChatMessage: !!outputData.chatMessage,
          hasSystemMessage: !!outputData.systemMessage,
        });

        return {
          success: outputData.success ?? true,
          responseType: outputData.responseType,
          chatMessage: outputData.chatMessage,
          systemMessage: outputData.systemMessage,
        };
      }

      // Legacy: old format with just output string
      if (typeof result[0].output === 'string') {
        return { success: true, output: result[0].output };
      }
    }

    // LEGACY FORMAT: Direct object format { output: "..." }
    if (result && typeof result === 'object' && 'output' in result && typeof result.output === 'string') {
      return { success: true, output: result.output };
    }

    // Case 3: Unknown format - return as-is
    console.warn(`[Webhook] Unexpected response format:`, result);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Webhook] Request timeout after 300 seconds');
      throw new Error('Request timeout: n8n processing took too long (>5 minutes). Please try again.');
    }

    // Re-throw other errors
    console.error('[Webhook] Error:', error);
    throw error;
  }
}
