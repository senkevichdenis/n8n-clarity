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

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullPayload),
    });

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

    // Parse response as JSON: expect [{ output: "..." }]
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error(`[Webhook] JSON parse error:`, {
        error: errorMsg,
        receivedText: responseText.slice(0, 500),
      });

      // Return detailed error info for ErrorDialog
      throw {
        message: `Invalid JSON response from webhook. Response starts with: ${responseText.slice(0, 100)}`,
        details: `Full webhook response:\n\n${responseText}\n\n---\n\nJSON Parse Error: ${errorMsg}\n\n---\n\nWebhook URL: ${WEBHOOK_URL}\nAction: ${payload.action}\nWorkflow ID: ${payload.workflowId}`,
      };
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

    // Case 1: Array format [{ output: "..." }]
    if (Array.isArray(result) && result.length > 0 && result[0].output) {
      return { success: true, output: result[0].output };
    }

    // Case 2: Direct object format { output: "..." }
    if (result && typeof result === 'object' && 'output' in result && result.output) {
      return { success: true, output: result.output };
    }

    // Case 3: Unknown format - return as-is
    console.warn(`[Webhook] Unexpected response format:`, result);
    return result;
  } catch (error) {
    // Re-throw errors with details preserved
    if (error && typeof error === 'object' && 'message' in error && 'details' in error) {
      throw error;
    }
    throw error;
  }
}
