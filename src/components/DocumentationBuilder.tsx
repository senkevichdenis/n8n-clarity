import { useState } from "react";
import { WorkflowControls } from "./WorkflowControls";
import { DocumentationEditor } from "./DocumentationEditor";
import { DocumentationChat } from "./DocumentationChat";
import { useToast } from "@/hooks/use-toast";
import { getApiKey, getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { generateDocumentation, type DocumentationType } from "@/lib/openrouter";
import type { Workflow, WorkflowDetails, ChatMessage } from "@/types";

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
      // Fetch workflow details
      const endpoint = `/api/v1/workflows/${selectedWorkflowId}`;
      
      console.log("[Docs] request to n8n-api", {
        endpoint,
        docType,
        hasBaseUrl: !!n8nBaseUrl,
        hasApiKey: !!n8nApiKey
      });

      const detailsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            n8nBaseUrl,
            n8nApiKey,
            endpoint,
          }),
        }
      );

      const detailsData = await detailsResponse.json();

      console.log("[Docs] n8n-api response", {
        status: detailsResponse.status,
        hasData: !!detailsData?.data,
        preview: JSON.stringify(detailsData).slice(0, 300)
      });

      if (!detailsResponse.ok || !detailsData.data) {
        console.error("[Docs] workflow load failure", detailsData);
        throw new Error("Failed to fetch workflow data from n8n");
      }

      const currentWorkflowDetails = detailsData.data;

      // Fetch executions if needed
      let executionsData;
      if (docType === "Ops Runbook" || docType === "Extended Tech Doc" || docType === "QA Checklist") {
        const executionsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-api`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              n8nBaseUrl,
              n8nApiKey,
              endpoint: `/api/v1/executions?workflowId=${selectedWorkflowId}&limit=50`,
            }),
          }
        );

        if (executionsResponse.ok) {
          const execData = await executionsResponse.json();
          executionsData = execData.data;
        }
      }

      const result = await generateDocumentation(
        apiKey,
        selectedModel,
        docType,
        currentWorkflowDetails,
        executionsData
      );

      setMarkdown(result);
      setWorkflowDetails(currentWorkflowDetails);
      toast({
        title: "Documentation Generated",
        description: "The workflow documentation has been completed successfully.",
      });
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
          />
        </div>
      </div>
    </div>
  );
}
