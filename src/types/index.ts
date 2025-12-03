export interface LLMModel {
  id: string;
  label: string;
  provider: string;
}

export const LLM_MODELS: LLMModel[] = [
  // OpenAI
  { id: "openai/gpt-5", label: "GPT-5", provider: "OpenAI" },
  { id: "openai/gpt-5.1", label: "GPT-5.1", provider: "OpenAI" },
  { id: "openai/gpt-5-chat", label: "GPT-5 Chat", provider: "OpenAI" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", provider: "OpenAI" },
  { id: "openai/gpt-5.1-codex", label: "GPT-5.1 Codex", provider: "OpenAI" },
  { id: "openai/gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", provider: "OpenAI" },
  { id: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI" },

  // Anthropic Claude (4.5, 4.1, 4, 3.7+)
  { id: "anthropic/claude-opus-4.5", label: "Claude Opus 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "anthropic/claude-opus-4.1", label: "Claude Opus 4.1", provider: "Anthropic" },
  { id: "anthropic/claude-opus-4", label: "Claude Opus 4", provider: "Anthropic" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3.7-sonnet:thinking", label: "Claude 3.7 Sonnet (Thinking)", provider: "Anthropic" },
  { id: "anthropic/claude-3.7-haiku", label: "Claude 3.7 Haiku", provider: "Anthropic" },

  // Google Gemini (3 and 2.5 only)
  { id: "google/gemini-3-pro-preview", label: "Gemini 3 Pro Preview", provider: "Google" },
  { id: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image Preview", provider: "Google" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  { id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro Preview", provider: "Google" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "Google" },
  { id: "google/gemini-2.5-flash-preview-09-2025", label: "Gemini 2.5 Flash Preview (Sep 2025)", provider: "Google" },
];

export const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

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
