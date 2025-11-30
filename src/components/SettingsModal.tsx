import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveApiKey, getApiKey, maskApiKey, saveN8nBaseUrl, getN8nBaseUrl, saveN8nApiKey, getN8nApiKey } from "@/lib/storage";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  selectedModel: string;
}

export function SettingsModal({ open, onOpenChange, onSave, selectedModel }: SettingsModalProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [isEditingN8nUrl, setIsEditingN8nUrl] = useState(false);
  const [isEditingN8nKey, setIsEditingN8nKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    openRouter: { valid: boolean; error: string } | null;
    n8n: { valid: boolean; error: string } | null;
  }>({ openRouter: null, n8n: null });

  useEffect(() => {
    if (open) {
      const existingKey = getApiKey();
      if (existingKey) {
        setApiKey(maskApiKey(existingKey));
        setIsEditing(false);
      } else {
        setApiKey("");
        setIsEditing(true);
      }

      const existingN8nUrl = getN8nBaseUrl();
      if (existingN8nUrl) {
        setN8nBaseUrl(maskApiKey(existingN8nUrl));
        setIsEditingN8nUrl(false);
      } else {
        setN8nBaseUrl("");
        setIsEditingN8nUrl(true);
      }

      const existingN8nKey = getN8nApiKey();
      if (existingN8nKey) {
        setN8nApiKey(maskApiKey(existingN8nKey));
        setIsEditingN8nKey(false);
      } else {
        setN8nApiKey("");
        setIsEditingN8nKey(true);
      }
    }
  }, [open]);

  const handleSave = async () => {
    setIsValidating(true);
    setValidationStatus({ openRouter: null, n8n: null });

    const openRouterKeyToValidate = (isEditing && apiKey && !apiKey.includes("•")) ? apiKey : null;
    const n8nUrlToValidate = (isEditingN8nUrl && n8nBaseUrl && !n8nBaseUrl.includes("•")) ? n8nBaseUrl : null;
    const n8nKeyToValidate = (isEditingN8nKey && n8nApiKey && !n8nApiKey.includes("•")) ? n8nApiKey : null;

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
            openRouterKey: openRouterKeyToValidate,
            n8nBaseUrl: n8nUrlToValidate,
            n8nApiKey: n8nKeyToValidate,
            model: selectedModel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Validation request failed");
      }

      const results = await response.json();
      setValidationStatus(results);

      const openRouterValid = !openRouterKeyToValidate || results.openRouter?.valid;
      const n8nValid = (!n8nUrlToValidate && !n8nKeyToValidate) || (results.n8n?.valid);

      if (openRouterValid && n8nValid) {
        if (openRouterKeyToValidate) saveApiKey(openRouterKeyToValidate);
        if (n8nUrlToValidate) saveN8nBaseUrl(n8nUrlToValidate);
        if (n8nKeyToValidate) saveN8nApiKey(n8nKeyToValidate);

        toast({
          title: "Settings Saved",
          description: "All configurations validated and saved successfully.",
        });

        onSave();
        onOpenChange(false);
      } else {
        const errors = [];
        if (!openRouterValid) errors.push(`OpenRouter: ${results.openRouter?.error}`);
        if (!n8nValid) errors.push(`n8n: ${results.n8n?.error}`);
        
        toast({
          title: "Validation Failed",
          description: errors.join("; "),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Could not validate configuration.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputFocus = () => {
    if (!isEditing) {
      setApiKey("");
      setIsEditing(true);
    }
  };

  const handleN8nUrlFocus = () => {
    if (!isEditingN8nUrl) {
      setN8nBaseUrl("");
      setIsEditingN8nUrl(true);
    }
  };

  const handleN8nKeyFocus = () => {
    if (!isEditingN8nKey) {
      setN8nApiKey("");
      setIsEditingN8nKey(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--bg-panel-alt))] border-[hsl(var(--border-subtle))] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--text-main))]">API Settings</DialogTitle>
          <DialogDescription className="text-[hsl(var(--text-muted))]">
            Configure your API keys and connection settings. All keys are stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[hsl(var(--text-main))]">OpenRouter Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-[hsl(var(--text-secondary))] flex items-center gap-2">
                OpenRouter API Key
                {validationStatus.openRouter !== null && (
                  validationStatus.openRouter.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )
                )}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="sk-or-..."
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
              />
              {validationStatus.openRouter && !validationStatus.openRouter.valid && (
                <p className="text-xs text-red-500">{validationStatus.openRouter.error}</p>
              )}
            </div>
          </div>

          <Separator className="bg-[hsl(var(--border-subtle))]" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[hsl(var(--text-main))]">n8n Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="n8nBaseUrl" className="text-[hsl(var(--text-secondary))] flex items-center gap-2">
                N8N Base URL
                {validationStatus.n8n !== null && (
                  validationStatus.n8n.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )
                )}
              </Label>
              <Input
                id="n8nBaseUrl"
                type="password"
                value={n8nBaseUrl}
                onChange={(e) => setN8nBaseUrl(e.target.value)}
                onFocus={handleN8nUrlFocus}
                placeholder="https://n8n.example.com"
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n8nApiKey" className="text-[hsl(var(--text-secondary))]">
                N8N API Key
              </Label>
              <Input
                id="n8nApiKey"
                type="password"
                value={n8nApiKey}
                onChange={(e) => setN8nApiKey(e.target.value)}
                onFocus={handleN8nKeyFocus}
                placeholder="n8n_api_..."
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
              />
              {validationStatus.n8n && !validationStatus.n8n.valid && (
                <p className="text-xs text-red-500">{validationStatus.n8n.error}</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isValidating ||
              ((!isEditing || !apiKey || apiKey.includes("•")) &&
              (!isEditingN8nUrl || !n8nBaseUrl || n8nBaseUrl.includes("•")) &&
              (!isEditingN8nKey || !n8nApiKey || n8nApiKey.includes("•")))
            }
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
