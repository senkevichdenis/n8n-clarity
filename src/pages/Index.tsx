import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { WorkflowControls } from "@/components/WorkflowControls";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { useToast } from "@/hooks/use-toast";
import { getApiKey } from "@/lib/storage";
import { generateAnalysis, sendChatMessage } from "@/lib/openrouter";
import type { Workflow, WorkflowDetails, Audience, Mode, ChatMessage, ExecutionsSummary } from "@/types";
import { LLM_MODELS } from "@/types";

const Index = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0].id);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [audience, setAudience] = useState<Audience>("Engineer");
  const [mode, setMode] = useState<Mode>("Explanation");
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings to use the application.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load workflows - trigger on component mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoadingWorkflows(true);
    try {
      // This would use the MCP n8n integration
      // For now, showing mock data structure
      const mockWorkflows: Workflow[] = [
        { id: "1", name: "Example Workflow 1", active: true },
        { id: "2", name: "Example Workflow 2", active: false },
      ];
      setWorkflows(mockWorkflows);
    } catch (error) {
      toast({
        title: "Failed to Load Workflows",
        description: "Could not fetch workflows from n8n. Please check your MCP connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const loadWorkflowDetails = async (workflowId: string) => {
    try {
      // This would use MCP n8n get_workflow_details
      // Mock data for now
      const mockDetails: WorkflowDetails = {
        id: workflowId,
        name: `Workflow ${workflowId}`,
        nodes: [],
        connections: {},
        settings: {},
        active: true,
      };
      setWorkflowDetails(mockDetails);
      setChatMessages([]); // Clear chat when switching workflows
      setSummaryContent(null); // Clear summary
    } catch (error) {
      toast({
        title: "Failed to Load Workflow Details",
        description: "Could not fetch workflow details from n8n.",
        variant: "destructive",
      });
    }
  };

  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    loadWorkflowDetails(workflowId);
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    if (!workflowDetails) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let executionsSummary: ExecutionsSummary | undefined;
      
      if (mode === "Executions Summary") {
        // Would fetch from MCP n8n get_workflow_executions_summary
        executionsSummary = {
          total: 100,
          successful: 95,
          failed: 5,
          avgDuration: 2500,
          longestDuration: 5000,
          shortestDuration: 1000,
          timeRange: "Last 7 days",
        };
      }

      const result = await generateAnalysis(
        apiKey,
        selectedModel,
        audience,
        mode,
        workflowDetails,
        executionsSummary
      );

      setSummaryContent(result);
      toast({
        title: "Analysis Generated",
        description: "The workflow analysis has been completed successfully.",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the analysis.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChatMessage = async (message: string) => {
    const apiKey = getApiKey();
    if (!apiKey || !workflowDetails) return;

    const userMessage: ChatMessage = { role: "user", content: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await sendChatMessage(
        apiKey,
        selectedModel,
        audience,
        [...chatMessages, userMessage],
        workflowDetails
      );

      const assistantMessage: ChatMessage = { role: "assistant", content: response };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const chatDisabled = !selectedWorkflowId || !getApiKey();

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-page))] p-8">
      <div className="max-w-[1800px] mx-auto">
        <Header
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        <WorkflowControls
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowChange={handleWorkflowChange}
          audience={audience}
          onAudienceChange={setAudience}
          mode={mode}
          onModeChange={setMode}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          loadingWorkflows={loadingWorkflows}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-280px)]">
          <div className="lg:col-span-3">
            <SummaryPanel mode={mode} content={summaryContent} isLoading={isGenerating} />
          </div>
          <div className="lg:col-span-2">
            <ChatPanel
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              isLoading={isChatLoading}
              disabled={chatDisabled}
            />
          </div>
        </div>

        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onSave={() => {
            toast({
              title: "Settings Saved",
              description: "Your OpenRouter API key has been saved successfully.",
            });
          }}
        />
      </div>
    </div>
  );
};

export default Index;
