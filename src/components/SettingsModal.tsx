import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveApiKey, getApiKey, maskApiKey } from "@/lib/storage";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SettingsModal({ open, onOpenChange, onSave }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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
    }
  }, [open]);

  const handleSave = () => {
    if (isEditing && apiKey && !apiKey.includes("•")) {
      saveApiKey(apiKey);
      onSave();
      onOpenChange(false);
    }
  };

  const handleInputFocus = () => {
    if (!isEditing) {
      setApiKey("");
      setIsEditing(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--bg-panel-alt))] border-[hsl(var(--border-subtle))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--text-main))]">OpenRouter Settings</DialogTitle>
          <DialogDescription className="text-[hsl(var(--text-muted))]">
            Configure your OpenRouter API key. The key will be stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-[hsl(var(--text-secondary))]">
              OpenRouter API Key
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
            disabled={!isEditing || !apiKey || apiKey.includes("•")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
