import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLM_MODELS, type LLMModel } from "@/types";

interface LLMModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LLMModelSelector({ value, onChange, className }: LLMModelSelectorProps) {
  // Group models by provider
  const openaiModels = LLM_MODELS.filter(m => m.provider === "OpenAI");
  const anthropicModels = LLM_MODELS.filter(m => m.provider === "Anthropic");
  const googleModels = LLM_MODELS.filter(m => m.provider === "Google");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-[180px] bg-[hsl(var(--select-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] text-sm ${className}`}>
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent className="bg-[hsl(var(--select-menu-bg))] border-[hsl(var(--border-subtle))] z-50 max-h-[300px]">
        <SelectGroup>
          <SelectLabel className="text-[hsl(var(--text-muted))] text-xs">OpenAI</SelectLabel>
          {openaiModels.map((model: LLMModel) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="text-[hsl(var(--text-main))] hover:bg-[hsl(var(--select-item-hover-bg))]"
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-[hsl(var(--text-muted))] text-xs">Anthropic</SelectLabel>
          {anthropicModels.map((model: LLMModel) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="text-[hsl(var(--text-main))] hover:bg-[hsl(var(--select-item-hover-bg))]"
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-[hsl(var(--text-muted))] text-xs">Google</SelectLabel>
          {googleModels.map((model: LLMModel) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="text-[hsl(var(--text-main))] hover:bg-[hsl(var(--select-item-hover-bg))]"
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
