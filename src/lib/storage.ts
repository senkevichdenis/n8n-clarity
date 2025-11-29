const API_KEY_STORAGE_KEY = "openrouter_api_key";
const N8N_BASE_URL_KEY = "n8n_base_url";
const N8N_API_KEY_KEY = "n8n_api_key";

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
