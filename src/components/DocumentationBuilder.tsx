import { useState } from "react";
import { WorkflowControls } from "./WorkflowControls";
import { DocumentationEditor } from "./DocumentationEditor";
import { DocumentationChat } from "./DocumentationChat";
import { useToast } from "@/hooks/use-toast";
import { getApiKey, getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { Workflow, WorkflowDetails, ChatMessage } from "@/types";
import type { DocumentationType } from "@/lib/openrouter";

interface DocumentationBuilderProps {
  workflows: Workflow[];
  loadingWorkflows: boolean;
  selectedModel: string;
  onSettingsClick: () => void;
}

export function DocumentationBuilder({
  workflows,
  loadingWorkflows,
  selectedModel,
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
    const apiKey = getApiKey();
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    console.log("[Docs] Generate clicked", {
      selectedWorkflowId,
      docType,
      model: selectedModel
    });

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      onSettingsClick();
      return;
    }

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
        openRouterApiKey: apiKey,
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
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not generate documentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
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
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-340px)]">
        <div className="lg:col-span-3">
          <DocumentationEditor
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            isGenerating={isGenerating}
            selectedModel={selectedModel}
          />
        </div>
        <div className="lg:col-span-2">
          <DocumentationChat
            messages={chatMessages}
            onMessagesChange={setChatMessages}
            markdown={markdown}
            onMarkdownChange={setMarkdown}
            disabled={!selectedWorkflowId || !getApiKey()}
            selectedModel={selectedModel}
            workflowId={selectedWorkflowId || ""}
            workflowName={selectedWorkflowName}
            docType={docType}
          />
        </div>
      </div>
    </div>
  );
}
