import { useState, useEffect } from "react";
import { AppSidebar, ActiveScreen } from "@/components/AppSidebar";
import { SettingsScreen } from "@/components/SettingsScreen";
import { WorkflowControls } from "@/components/WorkflowControls";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentationBuilder } from "@/components/DocumentationBuilder";
import { ErrorDialog } from "@/components/ErrorDialog";
import { useToast } from "@/hooks/use-toast";
import { getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { Workflow, WorkflowDetails, Audience, Mode, ChatMessage, ExecutionsSummary } from "@/types";
import { DEFAULT_MODEL } from "@/types";

const Index = () => {
  const { toast } = useToast();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("explain");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string>("");
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [audience, setAudience] = useState<Audience>("Engineer");
  const [mode, setMode] = useState<Mode>("Explanation");
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    details?: string;
  }>({ open: false, title: "", message: "" });

  // Check for n8n config on mount
  useEffect(() => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();
    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "Configuration Required",
        description: "Please configure your n8n credentials in Settings to use the application.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load workflows - trigger on component mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    console.log("[Explain] workflows list request", {
      endpoint: "/api/v1/workflows",
      hasBaseUrl: !!n8nBaseUrl,
      hasApiKey: !!n8nApiKey
    });

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "n8n Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      setWorkflows([]);
      return;
    }

    setLoadingWorkflows(true);
    try {
      const response = await fetch(
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
            endpoint: "/api/v1/workflows",
          }),
        }
      );

      const data = await response.json();
      
      console.log("[Explain] workflows list response", {
        status: response.status,
        count: data?.data?.length || 0
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workflows from n8n");
      }

      const workflowsList: Workflow[] = data.data.map((wf: any) => ({
        id: wf.id,
        name: wf.name,
        active: wf.active,
      }));
      setWorkflows(workflowsList);

      if (workflowsList.length === 0) {
        toast({
          title: "No Workflows Found",
          description: 'No workflows with tag "explain my automation" found in n8n.',
        });
      }
    } catch (error) {
      console.error("[Explain] Error loading workflows:", error);
      toast({
        title: "Failed to Load Workflows",
        description: "Could not fetch workflows from n8n. Please check your n8n configuration.",
        variant: "destructive",
      });
      setWorkflows([]);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const loadWorkflowDetails = async (workflowId: string) => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      setActiveScreen("settings");
      return;
    }

    try {
      const response = await fetch(
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
            endpoint: `/api/v1/workflows/${workflowId}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workflow details from n8n");
      }

      const data = await response.json();
      setWorkflowDetails(data.data);
      setChatMessages([]);
      setSummaryContent(null);
    } catch (error) {
      console.error("Error loading workflow details:", error);
      toast({
        title: "Failed to Load Workflow Details",
        description: "Could not fetch workflow details from n8n. Please check your connection.",
        variant: "destructive",
      });
      setWorkflowDetails(null);
    }
  };

  const handleWorkflowChange = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    console.log("[Explain] workflow selected", {
      id: workflowId,
      name: workflow?.name
    });
    setSelectedWorkflowId(workflowId);
    setSelectedWorkflowName(workflow?.name || "");
    loadWorkflowDetails(workflowId);
  };

  const handleGenerate = async () => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    console.log("[Explain] Generate clicked", {
      selectedWorkflowId,
      hasSelectedWorkflow: !!selectedWorkflowId,
      mode,
      model: selectedModel,
    });

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "n8n Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      setActiveScreen("settings");
      return;
    }

    if (!selectedWorkflowId) {
      console.warn("[Explain] Generate attempted without selected workflow", {
        selectedWorkflowId,
        workflowDetails,
      });
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsTyping(true);
    
    try {
      const result = await callWebhook({
        action: "explain_workflow",
        sourceTab: "explain",
        workflowId: selectedWorkflowId,
        workflowName: selectedWorkflowName,
        llmModel: selectedModel,
        openRouterApiKey: "",
        n8nBaseUrl: n8nBaseUrl,
        n8nApiKey: n8nApiKey,
        panelContext: {
          audience: audience.toLowerCase(),
          mode: mode.toLowerCase().replace(/ /g, "_"),
          existingExplanation: summaryContent || null,
        },
      });

      if (result.success && result.output) {
        setSummaryContent(result.output);
        toast({
          title: "Analysis Generated",
          description: "The workflow analysis has been completed successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate analysis");
      }
    } catch (error) {
      console.error("[Explain] Generation error:", error);

      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : error instanceof Error
        ? error.message
        : "Could not generate analysis. Please try again.";

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
      setIsTyping(false);
    }
  };

  const handleSendChatMessage = async (message: string) => {
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();
    
    if (!selectedWorkflowId || !n8nBaseUrl || !n8nApiKey) return;

    const userMessage: ChatMessage = { role: "user", content: message };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);
    setIsTyping(true);

    try {
      const result = await callWebhook({
        action: "explain_chat",
        sourceTab: "explain",
        workflowId: selectedWorkflowId,
        workflowName: selectedWorkflowName,
        llmModel: selectedModel,
        openRouterApiKey: "",
        n8nBaseUrl: n8nBaseUrl,
        n8nApiKey: n8nApiKey,
        panelContext: {
          currentExplanation: summaryContent || null,
          currentWeakPoints: null,
          currentExecutionsSummary: null,
        },
        chat: {
          input: message,
          history: chatMessages,
        },
      });

      if (result.success && result.output) {
        const assistantMessage: ChatMessage = { role: "assistant", content: result.output };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : error instanceof Error
        ? error.message
        : "Failed to send message.";

      const errorDetails = error && typeof error === 'object' && 'details' in error
        ? String(error.details)
        : error instanceof Error && error.stack
        ? error.stack
        : undefined;

      setErrorDialog({
        open: true,
        title: "Chat Error",
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setIsChatLoading(false);
      setIsTyping(false);
    }
  };

  const chatDisabled = !selectedWorkflowId || !getN8nApiKey();

  const handleSettingsSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
    loadWorkflows();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--bg-page))]">
      <AppSidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-[1600px] mx-auto">
            {activeScreen === "explain" && (
              <>
                <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-6">Explain My Automation</h1>
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
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
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
              </>
            )}

            {activeScreen === "documentation" && (
              <>
                <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] mb-6">Documentation Builder</h1>
                <DocumentationBuilder
                  workflows={workflows}
                  loadingWorkflows={loadingWorkflows}
                  onSettingsClick={() => setActiveScreen("settings")}
                />
              </>
            )}

            {activeScreen === "settings" && (
              <SettingsScreen onSave={handleSettingsSave} />
            )}
          </div>
        </div>
      </main>

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title}
        message={errorDialog.message}
        details={errorDialog.details}
      />
    </div>
  );
};

export default Index;
