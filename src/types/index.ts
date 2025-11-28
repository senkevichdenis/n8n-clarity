export interface LLMModel {
  id: string;
  label: string;
}

export const LLM_MODELS: LLMModel[] = [
  { id: "openai/gpt-5.1", label: "ChatGPT 5.1 (Maxi)" },
  { id: "openai/gpt-5.1-mini", label: "ChatGPT 5.1 Mini" },
  { id: "google/gemini-3-pro", label: "Gemini 3 Pro" },
  { id: "google/gemini-3-flash", label: "Gemini 3 Flash" },
  { id: "anthropic/claude-4.5-sonnet", label: "Claude 4.5 Sonnet" },
  { id: "anthropic/claude-4.5-opus", label: "Claude 4.5 Opus (Ultra)" },
];

export type Audience = "Engineer" | "Manager" | "Newbie";
export type Mode = "Explanation" | "Weak Points" | "Executions Summary" | "Q&A Only";

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
}

export interface WorkflowDetails {
  id: string;
  name: string;
  nodes: any[];
  connections: any;
  settings: any;
  active: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ExecutionsSummary {
  total: number;
  successful: number;
  failed: number;
  avgDuration: number;
  longestDuration: number;
  shortestDuration: number;
  timeRange: string;
}
