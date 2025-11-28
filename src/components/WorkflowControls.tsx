import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Workflow, Audience, Mode } from "@/types";
import { Loader2 } from "lucide-react";

interface WorkflowControlsProps {
  workflows: Workflow[];
  selectedWorkflowId: string | null;
  onWorkflowChange: (workflowId: string) => void;
  audience: Audience;
  onAudienceChange: (audience: Audience) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  loadingWorkflows: boolean;
}

const audiences: Audience[] = ["Engineer", "Manager", "Newbie"];
const modes: Mode[] = ["Explanation", "Weak Points", "Executions Summary", "Q&A Only"];

export function WorkflowControls({
  workflows,
  selectedWorkflowId,
  onWorkflowChange,
  audience,
  onAudienceChange,
  mode,
  onModeChange,
  onGenerate,
  isGenerating,
  loadingWorkflows,
}: WorkflowControlsProps) {
  const canGenerate = selectedWorkflowId && !isGenerating && mode !== "Q&A Only";

  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <Select value={selectedWorkflowId || ""} onValueChange={onWorkflowChange} disabled={loadingWorkflows}>
        <SelectTrigger className="w-[280px] bg-[hsl(var(--select-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]">
          <SelectValue placeholder={loadingWorkflows ? "Loading workflows..." : "Select workflow"} />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(var(--select-menu-bg))] border-[hsl(var(--border-subtle))] z-50">
          {workflows.map((workflow) => (
            <SelectItem
              key={workflow.id}
              value={workflow.id}
              className="text-[hsl(var(--text-main))] hover:bg-[hsl(var(--select-item-hover-bg))]"
            >
              {workflow.name} (ID: {workflow.id}) [{workflow.active ? "Active" : "Inactive"}]
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center border border-[hsl(var(--border-subtle))] rounded overflow-hidden">
        {audiences.map((aud) => (
          <button
            key={aud}
            onClick={() => onAudienceChange(aud)}
            className={`px-4 py-2 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors ${
              audience === aud
                ? "bg-[hsl(var(--tab-bg-active))] text-[hsl(var(--text-main))]"
                : "bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--tab-bg-active))]"
            }`}
          >
            {aud}
          </button>
        ))}
      </div>

      <div className="flex items-center border border-[hsl(var(--border-subtle))] rounded overflow-hidden">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-4 py-2 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors ${
              mode === m
                ? "bg-[hsl(var(--tab-bg-active))] text-[hsl(var(--text-main))]"
                : "bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--tab-bg-active))]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))] disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate"
        )}
      </Button>
    </div>
  );
}
