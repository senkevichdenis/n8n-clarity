import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Workflow, Audience, Mode } from "@/types";
import type { DocumentationType } from "@/lib/openrouter";
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
  isDocumentationMode?: boolean;
  docType?: DocumentationType;
  onDocTypeChange?: (docType: DocumentationType) => void;
}

const audiences: Audience[] = ["Engineer", "Manager", "Newbie"];
const modes: Mode[] = ["Explanation", "Weak Points", "Executions Summary", "Q&A Only"];
const docTypes: DocumentationType[] = ["Basic Tech Doc", "Extended Tech Doc", "Ops Runbook", "QA Checklist"];

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
  isDocumentationMode = false,
  docType,
  onDocTypeChange,
}: WorkflowControlsProps) {
  const canGenerate = selectedWorkflowId && !isGenerating && (!isDocumentationMode ? mode !== "Q&A Only" : true);

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

      {!isDocumentationMode ? (
        <>
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
        </>
      ) : (
        <div className="flex items-center border border-[hsl(var(--border-subtle))] rounded overflow-hidden">
          {docTypes.map((dt) => (
            <button
              key={dt}
              onClick={() => onDocTypeChange?.(dt)}
              className={`px-4 py-2 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors ${
                docType === dt
                  ? "bg-[hsl(var(--tab-bg-active))] text-[hsl(var(--text-main))]"
                  : "bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--tab-bg-active))]"
              }`}
            >
              {dt}
            </button>
          ))}
        </div>
      )}

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
        ) : isDocumentationMode ? (
          "Generate Documentation"
        ) : (
          "Generate"
        )}
      </Button>
    </div>
  );
}
