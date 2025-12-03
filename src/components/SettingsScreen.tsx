import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  saveN8nBaseUrl, getN8nBaseUrl, 
  saveN8nApiKey, getN8nApiKey,
  maskApiKey,
  saveN8nValid, getN8nValid
} from "@/lib/storage";
import { CheckCircle2, XCircle, Loader2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsScreenProps {
  onSave: () => void;
}

export function SettingsScreen({ onSave }: SettingsScreenProps) {
  const { toast } = useToast();
  
  // n8n state
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
  const [originalN8nBaseUrl, setOriginalN8nBaseUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [originalN8nApiKey, setOriginalN8nApiKey] = useState("");
  const [isEditingN8n, setIsEditingN8n] = useState(false);
  const [n8nValid, setN8nValid] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Load n8n config
    const storedN8nUrl = getN8nBaseUrl();
    const storedN8nKey = getN8nApiKey();
    const storedN8nValid = getN8nValid();
    
    if (storedN8nUrl && storedN8nKey) {
      setOriginalN8nBaseUrl(storedN8nUrl);
      setOriginalN8nApiKey(storedN8nKey);
      setN8nBaseUrl(maskApiKey(storedN8nUrl));
      setN8nApiKey(maskApiKey(storedN8nKey));
      setN8nValid(storedN8nValid);
      setIsEditingN8n(false);
    } else {
      setOriginalN8nBaseUrl("");
      setOriginalN8nApiKey("");
      setN8nBaseUrl("");
      setN8nApiKey("");
      setN8nValid(false);
      setIsEditingN8n(true);
    }
    
    setValidationError(null);
  }, []);

  const handleEditN8n = () => {
    setIsEditingN8n(true);
    setN8nBaseUrl(originalN8nBaseUrl);
    setN8nApiKey(originalN8nApiKey);
  };

  const handleSave = async () => {
    if (!isEditingN8n) return;
    
    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate n8n if edited
      if (n8nBaseUrl && n8nApiKey && !n8nBaseUrl.includes("•") && !n8nApiKey.includes("•")) {
        console.log("[Settings] Validating n8n credentials");
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-config`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                n8nBaseUrl: n8nBaseUrl,
                n8nApiKey: n8nApiKey,
              }),
            }
          );

          const result = await response.json();
          
          if (result.n8n?.valid) {
            saveN8nBaseUrl(n8nBaseUrl);
            saveN8nApiKey(n8nApiKey);
            saveN8nValid(true);
            setOriginalN8nBaseUrl(n8nBaseUrl);
            setOriginalN8nApiKey(n8nApiKey);
            setN8nValid(true);
            setIsEditingN8n(false);
            console.log("[Settings] n8n validation successful");
            
            toast({
              title: "Settings Saved",
              description: "n8n configuration validated and saved successfully.",
            });
            onSave();
          } else {
            setValidationError(result.n8n?.error || "Validation failed");
            console.error("[Settings] n8n validation failed:", result.n8n?.error);
            
            toast({
              title: "Validation Failed",
              description: result.n8n?.error || "Could not validate n8n credentials.",
              variant: "destructive",
            });
          }
        } catch (error) {
          setValidationError("Network error during validation");
          console.error("[Settings] n8n validation error:", error);
          
          toast({
            title: "Validation Error",
            description: "Network error during validation. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("[Settings] Unexpected validation error:", error);
      toast({
        title: "Validation Error",
        description: "An unexpected error occurred during validation.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-2">Settings</h1>
      <p className="text-[hsl(var(--text-muted))] mb-8">
        Configure your n8n connection settings. Valid configurations are stored securely and persist across sessions.
      </p>

      <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded-lg p-6">
        <div className="space-y-6">
          {/* n8n Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[hsl(var(--text-main))]">n8n Configuration</h3>
              {n8nValid && !isEditingN8n && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditN8n}
                  className="h-8 gap-2"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="n8nBaseUrl" className="text-[hsl(var(--text-secondary))] flex items-center gap-2">
                N8N Base URL
                {n8nValid && !isEditingN8n && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {validationError && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <Input
                id="n8nBaseUrl"
                type={isEditingN8n ? "text" : "password"}
                value={n8nBaseUrl}
                onChange={(e) => setN8nBaseUrl(e.target.value)}
                placeholder="https://n8n.example.com"
                disabled={!isEditingN8n}
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] disabled:opacity-70"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="n8nApiKey" className="text-[hsl(var(--text-secondary))]">
                N8N API Key
              </Label>
              <Input
                id="n8nApiKey"
                type={isEditingN8n ? "text" : "password"}
                value={n8nApiKey}
                onChange={(e) => setN8nApiKey(e.target.value)}
                placeholder="n8n_api_..."
                disabled={!isEditingN8n}
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] disabled:opacity-70"
              />
              {validationError && (
                <p className="text-xs text-red-500">{validationError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isValidating || !isEditingN8n}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
