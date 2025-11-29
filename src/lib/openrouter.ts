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

export type DocumentationType = "Basic Tech Doc" | "Extended Tech Doc" | "Ops Runbook" | "QA Checklist";

function getDocumentationSystemPrompt(docType: DocumentationType): string {
  const prompts = {
    "Basic Tech Doc": `You are generating a Basic Technical Documentation for an n8n workflow.

Target audience: Engineers familiar with n8n and automation.

Output MUST be valid markdown ONLY (no surrounding commentary).

Required structure:
1) Title and basic info (workflow name, ID, status)
2) Purpose & Context (based only on workflow JSON)
3) Triggers & Inputs
4) High-Level Data Flow
5) Outputs & Side Effects
6) Configuration & Dependencies (high level)
7) Error Handling Overview

CRITICAL RULES:
- Only use information from the provided workflow JSON
- Do NOT invent business processes, SLAs, or metrics
- If something is unclear, state it explicitly or stay generic
- Output must be clean markdown with no extra commentary`,

    "Extended Tech Doc": `You are generating Extended Technical Documentation for an n8n workflow.

Target audience: Senior engineers, maintainers, integrators.

Output MUST be valid markdown ONLY (no surrounding commentary).

Include everything from Basic Tech Doc PLUS:
8) Node Inventory (Technical Reference) - table of all nodes
9) Integration & API Overview - grouped by external system
10) Data Contracts (High-Level) - key fields and transformations
11) Security & Privacy Notes (Structural) - credentials and sensitive data patterns
12) Performance & Scalability Considerations (Structural Only) - loops, bottlenecks

CRITICAL RULES:
- Only use information from the provided workflow JSON and executions
- Do NOT invent throughput numbers or infrastructure details
- Do NOT assume compliance standards
- Output must be clean markdown with no extra commentary`,

    "Ops Runbook": `You are generating an Operational Runbook for an n8n workflow.

Target audience: On-call engineers and operators.

Output MUST be valid markdown ONLY (no surrounding commentary).

Required structure:
1) Overview for Operators
2) How to Run / Rerun
3) Prerequisites Checklist
4) Normal Execution Path (Short)
5) Known Failure Points (based on executions if available)
6) Troubleshooting Steps (Playbook) - 3-7 steps per common issue
7) Escalation Guidelines (Generic)

CRITICAL RULES:
- Base failure analysis on execution data when available
- If no execution data, base on structural risk analysis
- Steps must be concrete but generic (no company-specific tools)
- Output must be clean markdown with no extra commentary`,

    "QA Checklist": `You are generating a QA Testing Checklist for an n8n workflow.

Target audience: QA engineers and developers writing tests.

Output MUST be valid markdown ONLY (no surrounding commentary).

Required structure:
1) Scope and Purpose
2) Happy Path Scenarios (2-5 scenarios)
3) Negative / Error Scenarios
4) Boundary / Edge Cases
5) Regression / Integration Checks

For each scenario include:
- Short name
- Preconditions
- Steps
- Expected result

CRITICAL RULES:
- Base scenarios on workflow structure (If/Switch, loops, external calls)
- Do NOT assume specific test tools
- Do NOT invent exact payloads beyond realistic examples
- Output must be clean markdown with no extra commentary`,
  };

  return prompts[docType];
}

export async function generateDocumentation(
  apiKey: string,
  model: string,
  docType: DocumentationType,
  workflowDetails: WorkflowDetails,
  executionsData?: any
): Promise<string> {
  const systemPrompt = getDocumentationSystemPrompt(docType);
  
  let userPrompt = `Generate ${docType} for the following n8n workflow:\n\nWorkflow Name: ${workflowDetails.name}\nWorkflow ID: ${workflowDetails.id}\nStatus: ${workflowDetails.active ? "Active" : "Inactive"}\n\n`;
  
  userPrompt += `Workflow Structure:\n${JSON.stringify(
    {
      nodes: workflowDetails.nodes,
      connections: workflowDetails.connections,
      settings: workflowDetails.settings,
    },
    null,
    2
  )}\n\n`;

  if (executionsData) {
    userPrompt += `Execution Data:\n${JSON.stringify(executionsData, null, 2)}\n\n`;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No documentation generated";
}

export async function editDocumentation(
  apiKey: string,
  model: string,
  currentMarkdown: string,
  instruction: string
): Promise<string> {
  const systemPrompt = `You are a documentation editor for n8n workflows.

You receive:
- The current documentation as markdown
- An editing instruction from the user

Your job: Return the UPDATED documentation as a full markdown document.

CRITICAL RULES:
- Output ONLY the final markdown (no explanations, no comments, no diff format)
- Apply the user's instruction exactly
- Maintain the overall structure and tone
- Do NOT add commentary about what you changed`;

  const userPrompt = `Current documentation:\n\n${currentMarkdown}\n\n---\n\nInstruction: ${instruction}\n\nProvide the updated documentation:`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || currentMarkdown;
}

export async function generateStickyNotes(
  apiKey: string,
  model: string,
  markdown: string
): Promise<string> {
  const systemPrompt = `You generate n8n Sticky Note nodes JSON based on documentation markdown.

Each major documentation section must become a separate Sticky Note node.

Use the standard n8n Sticky Note node format:
- type: "n8n-nodes-base.stickyNote"
- typeVersion: 1
- parameters: { content, height, width }
- id: unique UUID
- name: descriptive name per section
- position: [x, y] coordinates (use grid layout to avoid overlap)

Section examples:
- "Sticky Note: High-Level Overview"
- "Sticky Note: Data Flow"
- "Sticky Note: Configuration"
- "Sticky Note: Error Handling"
- "Sticky Note: Ops Runbook"
- "Sticky Note: QA Checklist"

CRITICAL RULES:
- Output ONLY valid JSON (no explanations)
- Must be importable into n8n
- Create one note per major section
- Use grid positions (e.g., increments of 300 for x and y)
- Set reasonable height/width (e.g., 300x200)`;

  const userPrompt = `Convert this documentation into n8n Sticky Note nodes:\n\n${markdown}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "{}";
}
