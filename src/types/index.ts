export interface LLMModel {
  id: string;
  label: string;
  provider: string;
}

export const LLM_MODELS: LLMModel[] = [
  // OpenAI
  { id: "openai/gpt-5o", label: "GPT-5o", provider: "OpenAI" },
  { id: "openai/gpt-5.1", label: "GPT-5.1", provider: "OpenAI" },
  { id: "openai/gpt-5.1-mini", label: "GPT-5.1 Mini", provider: "OpenAI" },
  { id: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { id: "openai/gpt-4.0", label: "GPT-4.0", provider: "OpenAI" },
  { id: "openai/o4-mini", label: "O4 Mini", provider: "OpenAI" },
  { id: "openai/codex-mini", label: "Codex Mini", provider: "OpenAI" },
  // Anthropic
  { id: "anthropic/claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },
  { id: "anthropic/claude-3", label: "Claude 3", provider: "Anthropic" },
  { id: "anthropic/claude-2.1", label: "Claude 2.1", provider: "Anthropic" },
  { id: "anthropic/claude-instant", label: "Claude Instant", provider: "Anthropic" },
  // Gemini
  { id: "google/gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google" },
  { id: "google/gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "Google" },
  { id: "google/gemini-1.0-pro", label: "Gemini 1.0 Pro", provider: "Google" },
  { id: "google/gemini-ultra", label: "Gemini Ultra", provider: "Google" },
  { id: "google/gemini-nano", label: "Gemini Nano", provider: "Google" },
  { id: "google/gemini-flash", label: "Gemini Flash", provider: "Google" },
  { id: "google/gemini-pro", label: "Gemini Pro", provider: "Google" },
];

export const DEFAULT_MODEL = "openai/gpt-5.1";

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
