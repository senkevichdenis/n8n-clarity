const WEBHOOK_URL = "https://n8n.isendora.com/webhook/a1eeddbd-d8ff-45b3-bde0-1de5dc92ee31";

interface WebhookPayload {
  action: string;
  sourceTab: "explain" | "docs";
  workflowId: string;
  workflowName: string;
  llmModel: string;
  openRouterApiKey: string | null;
  panelContext: any;
  chat: {
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
  });

  return result;
}
