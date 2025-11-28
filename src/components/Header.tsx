import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLM_MODELS, type LLMModel } from "@/types";

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSettingsClick: () => void;
}

export function Header({ selectedModel, onModelChange, onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 pb-4 border-b border-[hsl(var(--divider))] mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-[hsl(var(--text-main))]">Explain My Automation</h1>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[240px] bg-[hsl(var(--select-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]">
            <SelectValue placeholder="Select LLM Model" />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--select-menu-bg))] border-[hsl(var(--border-subtle))] z-50">
            {LLM_MODELS.map((model: LLMModel) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-[hsl(var(--text-main))] hover:bg-[hsl(var(--select-item-hover-bg))]"
              >
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onSettingsClick}
        className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </header>
  );
}
