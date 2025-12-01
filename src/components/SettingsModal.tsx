import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  saveApiKey, getApiKey, maskApiKey, 
  saveN8nBaseUrl, getN8nBaseUrl, 
  saveN8nApiKey, getN8nApiKey,
  saveModel, getModel,
  saveOpenRouterValid, getOpenRouterValid,
  saveN8nValid, getN8nValid
} from "@/lib/storage";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Loader2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function SettingsModal({ open, onOpenChange, onSave, selectedModel, onModelChange }: SettingsModalProps) {
  const { toast } = useToast();
  
  // OpenRouter state
  const [apiKey, setApiKey] = useState("");
  const [originalApiKey, setOriginalApiKey] = useState("");
  const [isEditingOpenRouter, setIsEditingOpenRouter] = useState(false);
  const [openRouterValid, setOpenRouterValid] = useState(false);
  
  // n8n state
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
  const [originalN8nBaseUrl, setOriginalN8nBaseUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [originalN8nApiKey, setOriginalN8nApiKey] = useState("");
  const [isEditingN8n, setIsEditingN8n] = useState(false);
  const [n8nValid, setN8nValid] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ openRouter?: string; n8n?: string }>({});

  useEffect(() => {
    if (open) {
      // Load OpenRouter config
      const storedKey = getApiKey();
      const storedModel = getModel();
      const storedOpenRouterValid = getOpenRouterValid();
      
      if (storedKey) {
        setOriginalApiKey(storedKey);
        setApiKey(maskApiKey(storedKey));
        setOpenRouterValid(storedOpenRouterValid);
        setIsEditingOpenRouter(false);
      } else {
        setOriginalApiKey("");
        setApiKey("");
        setOpenRouterValid(false);
        setIsEditingOpenRouter(true);
      }
      
      if (storedModel) {
        onModelChange(storedModel);
      }
      
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
      
      setValidationErrors({});
    }
  }, [open]);

  const handleEditOpenRouter = () => {
    setIsEditingOpenRouter(true);
    setApiKey(originalApiKey);
  };

  const handleEditN8n = () => {
    setIsEditingN8n(true);
    setN8nBaseUrl(originalN8nBaseUrl);
    setN8nApiKey(originalN8nApiKey);
  };

  const handleSave = async () => {
    setIsValidating(true);
    setValidationErrors({});

    const errors: { openRouter?: string; n8n?: string } = {};
    let openRouterSuccess = !isEditingOpenRouter;
    let n8nSuccess = !isEditingN8n;

    try {
      // Validate OpenRouter if edited
      if (isEditingOpenRouter && apiKey && !apiKey.includes("•")) {
        console.log("[Settings] Validating OpenRouter key");
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
                openRouterKey: apiKey,
                model: selectedModel,
              }),
            }
          );

          const result = await response.json();
          
          if (result.openRouter?.valid) {
            saveApiKey(apiKey);
            saveModel(selectedModel);
            saveOpenRouterValid(true);
            setOriginalApiKey(apiKey);
            setOpenRouterValid(true);
            setIsEditingOpenRouter(false);
            openRouterSuccess = true;
            console.log("[Settings] OpenRouter validation successful");
          } else {
            errors.openRouter = result.openRouter?.error || "Validation failed";
            console.error("[Settings] OpenRouter validation failed:", errors.openRouter);
          }
        } catch (error) {
          errors.openRouter = "Network error during validation";
          console.error("[Settings] OpenRouter validation error:", error);
        }
      }

      // Validate n8n if edited
      if (isEditingN8n && n8nBaseUrl && n8nApiKey && !n8nBaseUrl.includes("•") && !n8nApiKey.includes("•")) {
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
            n8nSuccess = true;
            console.log("[Settings] n8n validation successful");
          } else {
            errors.n8n = result.n8n?.error || "Validation failed";
            console.error("[Settings] n8n validation failed:", errors.n8n);
          }
        } catch (error) {
          errors.n8n = "Network error during validation";
          console.error("[Settings] n8n validation error:", error);
        }
      }

      setValidationErrors(errors);

      if (openRouterSuccess && n8nSuccess) {
        toast({
          title: "Settings Saved",
          description: "All configurations validated and saved successfully.",
        });
        onSave();
        onOpenChange(false);
      } else {
        // Revert failed validations
        if (!openRouterSuccess && originalApiKey) {
          setApiKey(maskApiKey(originalApiKey));
          setIsEditingOpenRouter(false);
        }
        if (!n8nSuccess && originalN8nBaseUrl && originalN8nApiKey) {
          setN8nBaseUrl(maskApiKey(originalN8nBaseUrl));
          setN8nApiKey(maskApiKey(originalN8nApiKey));
          setIsEditingN8n(false);
        }
        
        toast({
          title: "Validation Failed",
          description: Object.values(errors).join("; "),
          variant: "destructive",
        });
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

  const hasChanges = isEditingOpenRouter || isEditingN8n;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--bg-panel-alt))] border-[hsl(var(--border-subtle))] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--text-main))]">API Settings</DialogTitle>
          <DialogDescription className="text-[hsl(var(--text-muted))]">
            Configure your API keys and connection settings. Valid configurations are stored securely and persist across sessions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* OpenRouter Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[hsl(var(--text-main))]">OpenRouter Configuration</h3>
              {openRouterValid && !isEditingOpenRouter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditOpenRouter}
                  className="h-8 gap-2"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-[hsl(var(--text-secondary))] flex items-center gap-2">
                OpenRouter API Key
                {openRouterValid && !isEditingOpenRouter && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {validationErrors.openRouter && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <Input
                id="apiKey"
                type={isEditingOpenRouter ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                disabled={!isEditingOpenRouter}
                className="bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] disabled:opacity-70"
              />
              {validationErrors.openRouter && (
                <p className="text-xs text-red-500">{validationErrors.openRouter}</p>
              )}
            </div>
          </div>

          <Separator className="bg-[hsl(var(--border-subtle))]" />

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
                {validationErrors.n8n && (
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
              {validationErrors.n8n && (
                <p className="text-xs text-red-500">{validationErrors.n8n}</p>
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
            disabled={isValidating || !hasChanges}
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
