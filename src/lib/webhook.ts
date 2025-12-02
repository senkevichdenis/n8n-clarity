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

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fullPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Webhook] Error response:`, {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Webhook error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`[Webhook] Success response:`, {
    action: payload.action,
    hasResult: !!result,
    isArray: Array.isArray(result),
    preview: JSON.stringify(result).slice(0, 300),
  });

  // Extract output from canonical n8n response: [{ output: "..." }]
  if (Array.isArray(result) && result.length > 0 && result[0].output) {
    return { success: true, output: result[0].output };
  }

  return result;
}
