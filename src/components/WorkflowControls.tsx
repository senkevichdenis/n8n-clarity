import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLMModelSelector } from "@/components/LLMModelSelector";
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
  selectedModel: string;
  onModelChange: (model: string) => void;
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
  selectedModel,
  onModelChange,
}: WorkflowControlsProps) {
  const canGenerate = selectedWorkflowId && !isGenerating && (!isDocumentationMode ? mode !== "Q&A Only" : true);

  return (
    <div className="flex items-center gap-2.5 mb-6 flex-wrap">
      <Select value={selectedWorkflowId || ""} onValueChange={onWorkflowChange} disabled={loadingWorkflows}>
        <SelectTrigger className="w-[220px] bg-[hsl(var(--select-bg))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] text-sm">
          <SelectValue placeholder={loadingWorkflows ? "Loading..." : "Select workflow"} />
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
                className={`px-2.5 py-1.5 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors ${
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
                className={`px-2.5 py-1.5 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors whitespace-nowrap ${
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
              className={`px-2.5 py-1.5 text-sm border-r last:border-r-0 border-[hsl(var(--border-subtle))] transition-colors whitespace-nowrap ${
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

      <LLMModelSelector value={selectedModel} onChange={onModelChange} />

      <Button
        onClick={onGenerate}
        disabled={!canGenerate}
        size="sm"
        className="bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))] disabled:opacity-50 h-9 px-3"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            <span className="text-sm">Generating...</span>
          </>
        ) : isDocumentationMode ? (
          <span className="text-sm">Generate Docs</span>
        ) : (
          <span className="text-sm">Generate</span>
        )}
      </Button>
    </div>
  );
}
