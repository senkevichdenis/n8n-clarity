import type { ChatMessage, Audience, Mode, WorkflowDetails, ExecutionsSummary } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function getSystemPrompt(audience: Audience, mode: Mode): string {
  const audienceContext = {
    Engineer: `You are explaining to a technical engineer who understands workflow automation, APIs, data structures, and error handling. Provide detailed technical explanations with architecture recommendations and optimization suggestions.`,
    Manager: `You are explaining to a business manager who needs to understand the business value, process impact, and risks. Focus on ROI, efficiency gains, and control points without technical jargon.`,
    Newbie: `You are explaining to someone new to workflow automation. Use simple language, avoid jargon, and provide step-by-step explanations of what the workflow does and how to use it.`,
  };

  const modeContext = {
    "Explanation": `Analyze the workflow and provide a structured explanation covering:
- Purpose: What problem does this workflow solve?
- Inputs & Triggers: What starts this workflow and what data it needs
- Steps & Data Flow: Detailed breakdown of each step and how data flows
- Integrations: What external services or APIs are used
- Error Handling: How errors are managed
- Recommendations: Suggestions for improvement`,
    "Weak Points": `Analyze the workflow for vulnerabilities and potential issues:
- Missing or inadequate error handling
- Security risks in API calls or data handling
- Performance bottlenecks
- Duplicate or redundant logic
- Missing validation or checks
- Scalability concerns
Provide specific recommendations for each issue found.`,
    "Executions Summary": `Analyze the workflow execution data and provide insights on:
- Overall stability and reliability
- Common failure patterns
- Performance characteristics
- Recommendations for monitoring and improvements
Focus on actionable insights from the execution data.`,
    "Q&A Only": `You are a helpful assistant that answers questions about this specific n8n workflow. Only answer based on the provided workflow JSON and execution data. If information is not available in the provided data, clearly state that.`,
  };

  return `${audienceContext[audience]}

${modeContext[mode]}

CRITICAL RULES:
- Only use information from the provided workflow JSON and execution data
- Do not invent nodes, steps, or details that don't exist in the data
- If information is missing or unclear, explicitly state this
- Structure your response clearly with headings and bullet points
- Be concise but thorough`;
}

function buildPrompt(
  mode: Mode,
  workflowDetails: WorkflowDetails,
  executionsSummary?: ExecutionsSummary
): string {
  let prompt = `Analyze the following n8n workflow:\n\nWorkflow Name: ${workflowDetails.name}\nWorkflow ID: ${workflowDetails.id}\nStatus: ${workflowDetails.active ? "Active" : "Inactive"}\n\n`;

  prompt += `Workflow Structure:\n${JSON.stringify(
    {
      nodes: workflowDetails.nodes,
      connections: workflowDetails.connections,
      settings: workflowDetails.settings,
    },
    null,
    2
  )}\n\n`;

  if (mode === "Executions Summary" && executionsSummary) {
    prompt += `Execution Statistics:\n${JSON.stringify(executionsSummary, null, 2)}\n\n`;
  }

  return prompt;
}

export async function generateAnalysis(
  apiKey: string,
  model: string,
  audience: Audience,
  mode: Mode,
  workflowDetails: WorkflowDetails,
  executionsSummary?: ExecutionsSummary
): Promise<string> {
  const systemPrompt = getSystemPrompt(audience, mode);
  const userPrompt = buildPrompt(mode, workflowDetails, executionsSummary);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response generated";
}

export async function sendChatMessage(
  apiKey: string,
  model: string,
  audience: Audience,
  messages: ChatMessage[],
  workflowDetails: WorkflowDetails,
  executionsSummary?: ExecutionsSummary
): Promise<string> {
  const systemPrompt = getSystemPrompt(audience, "Q&A Only");
  const contextPrompt = buildPrompt("Q&A Only", workflowDetails, executionsSummary);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: contextPrompt },
    ...messages,
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: fullMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response generated";
}
