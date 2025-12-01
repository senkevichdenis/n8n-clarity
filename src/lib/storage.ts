const API_KEY_STORAGE_KEY = "ema_openrouter_key";
const MODEL_STORAGE_KEY = "ema_openrouter_model";
const N8N_BASE_URL_KEY = "ema_n8n_base_url";
const N8N_API_KEY_KEY = "ema_n8n_api_key";
const OPENROUTER_VALID_KEY = "ema_openrouter_valid";
const N8N_VALID_KEY = "ema_n8n_valid";

export function saveApiKey(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error("Failed to save API key:", error);
  }
}

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to retrieve API key:", error);
    return null;
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear API key:", error);
  }
}

export function saveN8nBaseUrl(url: string): void {
  try {
    localStorage.setItem(N8N_BASE_URL_KEY, url);
  } catch (error) {
    console.error("Failed to save n8n base URL:", error);
  }
}

export function getN8nBaseUrl(): string | null {
  try {
    return localStorage.getItem(N8N_BASE_URL_KEY);
  } catch (error) {
    console.error("Failed to retrieve n8n base URL:", error);
    return null;
  }
}

export function saveN8nApiKey(apiKey: string): void {
  try {
    localStorage.setItem(N8N_API_KEY_KEY, apiKey);
  } catch (error) {
    console.error("Failed to save n8n API key:", error);
  }
}

export function getN8nApiKey(): string | null {
  try {
    return localStorage.getItem(N8N_API_KEY_KEY);
  } catch (error) {
    console.error("Failed to retrieve n8n API key:", error);
    return null;
  }
}

export function maskApiKey(apiKey: string): string {
  return "••••••••••••••••";
}

export function saveModel(model: string): void {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  } catch (error) {
    console.error("Failed to save model:", error);
  }
}

export function getModel(): string | null {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to retrieve model:", error);
    return null;
  }
}

export function saveOpenRouterValid(valid: boolean): void {
  try {
    localStorage.setItem(OPENROUTER_VALID_KEY, valid.toString());
  } catch (error) {
    console.error("Failed to save OpenRouter validation state:", error);
  }
}

export function getOpenRouterValid(): boolean {
  try {
    return localStorage.getItem(OPENROUTER_VALID_KEY) === "true";
  } catch (error) {
    console.error("Failed to retrieve OpenRouter validation state:", error);
    return false;
  }
}

export function saveN8nValid(valid: boolean): void {
  try {
    localStorage.setItem(N8N_VALID_KEY, valid.toString());
  } catch (error) {
    console.error("Failed to save n8n validation state:", error);
  }
}

export function getN8nValid(): boolean {
  try {
    return localStorage.getItem(N8N_VALID_KEY) === "true";
  } catch (error) {
    console.error("Failed to retrieve n8n validation state:", error);
    return false;
  }
}
