import { useState } from "react";
import { WorkflowControls } from "./WorkflowControls";
import { DocumentationEditor } from "./DocumentationEditor";
import { DocumentationChat } from "./DocumentationChat";
import { ErrorDialog } from "./ErrorDialog";
import { useToast } from "@/hooks/use-toast";
import { getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { Workflow, WorkflowDetails, ChatMessage } from "@/types";
import { DEFAULT_MODEL } from "@/types";
import type { DocumentationType } from "@/lib/openrouter";

interface DocumentationBuilderProps {
  workflows: Workflow[];
  loadingWorkflows: boolean;
  onSettingsClick: () => void;
}

export function DocumentationBuilder({
  workflows,
  loadingWorkflows,
  onSettingsClick,
}: DocumentationBuilderProps) {
  const { toast } = useToast();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string>("");
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [docType, setDocType] = useState<DocumentationType>("Basic Tech Doc");
  const [markdown, setMarkdown] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    details?: string;
  }>({ open: false, title: "", message: "" });

  const handleWorkflowChange = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    console.log("[Docs] workflow selected", {
      id: workflowId,
      name: workflow?.name
    });
    setSelectedWorkflowId(workflowId);
    setSelectedWorkflowName(workflow?.name || "");
    setChatMessages([]);
    setMarkdown("");
  };

  const handleGenerate = async () => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    console.log("[Docs] Generate clicked", {
      selectedWorkflowId,
      docType,
      model: selectedModel
    });

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "n8n Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      onSettingsClick();
      return;
    }

    if (!selectedWorkflowId) {
      console.warn("[Docs] Generate attempted without selected workflow", {
        selectedWorkflowId,
      });
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const docTypeMap: Record<DocumentationType, string> = {
        "Basic Tech Doc": "basic_tech_doc",
        "Extended Tech Doc": "extended_tech_doc",
        "Ops Runbook": "ops_runbook",
        "QA Checklist": "qa_checklist",
      };

      const result = await callWebhook({
        action: "generate_documentation",
        sourceTab: "docs",
        workflowId: selectedWorkflowId,
        workflowName: selectedWorkflowName,
        llmModel: selectedModel,
        openRouterApiKey: "",
        n8nBaseUrl: n8nBaseUrl,
        n8nApiKey: n8nApiKey,
        panelContext: {
          docType: docTypeMap[docType],
          existingDoc: markdown || null,
        },
      });

      if (result.success && result.output) {
        setMarkdown(result.output);
        toast({
          title: "Documentation Generated",
          description: "The workflow documentation has been completed successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate documentation");
      }
    } catch (error) {
      console.error("[Docs] Generation error:", error);

      // Check if error has details property (from webhook.ts)
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : error instanceof Error
        ? error.message
        : "Could not generate documentation. Please try again.";

      const errorDetails = error && typeof error === 'object' && 'details' in error
        ? String(error.details)
        : error instanceof Error && error.stack
        ? error.stack
        : undefined;

      setErrorDialog({
        open: true,
        title: "Generation Failed",
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WorkflowControls
        workflows={workflows}
        selectedWorkflowId={selectedWorkflowId}
        onWorkflowChange={handleWorkflowChange}
        audience="Engineer"
        onAudienceChange={() => {}}
        mode="Explanation"
        onModeChange={() => {}}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        loadingWorkflows={loadingWorkflows}
        isDocumentationMode
        docType={docType}
        onDocTypeChange={setDocType}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 mt-6 min-h-0">
        <div className="lg:col-span-3 min-h-0">
          <DocumentationEditor
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            isGenerating={isGenerating}
            selectedModel={selectedModel}
          />
        </div>
        <div className="lg:col-span-2 min-h-0">
          <DocumentationChat
            messages={chatMessages}
            onMessagesChange={setChatMessages}
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            disabled={!selectedWorkflowId || !getN8nApiKey()}
            selectedModel={selectedModel}
            workflowId={selectedWorkflowId || ""}
            workflowName={selectedWorkflowName}
            docType={docType}
          />
        </div>
      </div>

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title}
        message={errorDialog.message}
        details={errorDialog.details}
      />
    </div>
  );
}
