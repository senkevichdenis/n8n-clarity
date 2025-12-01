import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { TabSelector } from "@/components/TabSelector";
import { WorkflowControls } from "@/components/WorkflowControls";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentationBuilder } from "@/components/DocumentationBuilder";
import { useToast } from "@/hooks/use-toast";
import { getApiKey, getN8nBaseUrl, getN8nApiKey, getModel, saveModel } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { Workflow, WorkflowDetails, Audience, Mode, ChatMessage, ExecutionsSummary } from "@/types";
import { LLM_MODELS } from "@/types";
import { TypingIndicator } from "@/components/TypingAnimation";

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"explain" | "documentation">("explain");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getModel() || LLM_MODELS[0].id);
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
      setSettingsOpen(true);
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

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    saveModel(model);
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();

    console.log("[Explain] Generate clicked", {
      selectedWorkflowId,
      hasSelectedWorkflow: !!selectedWorkflowId,
      mode,
      model: selectedModel,
    });

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "n8n Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      setSettingsOpen(true);
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
        openRouterApiKey: apiKey,
        panelContext: {
          audience: audience.toLowerCase(),
          mode: mode.toLowerCase().replace(/ /g, "_"),
          existingExplanation: summaryContent || null,
        },
        chat: {
          input: null,
          history: chatMessages,
        },
      });

      if (result.success) {
        setSummaryContent(result.explanation);
        if (result.chatMessage) {
          const assistantMessage: ChatMessage = { role: "assistant", content: result.chatMessage };
          setChatMessages((prev) => [...prev, assistantMessage]);
        }
        toast({
          title: "Analysis Generated",
          description: "The workflow analysis has been completed successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate analysis");
      }
    } catch (error) {
      console.error("[Explain] Generation error:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not generate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  const handleSendChatMessage = async (message: string) => {
    const apiKey = getApiKey();
    if (!apiKey || !selectedWorkflowId) return;

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
        openRouterApiKey: apiKey,
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

      if (result.success) {
        const assistantMessage: ChatMessage = { role: "assistant", content: result.reply };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
      setIsTyping(false);
    }
  };

  const chatDisabled = !selectedWorkflowId || !getApiKey();

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-page))] p-8">
      <div className="max-w-[1800px] mx-auto">
        <Header
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "explain" ? (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-340px)]">
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
        ) : (
          <DocumentationBuilder
            workflows={workflows}
            loadingWorkflows={loadingWorkflows}
            selectedModel={selectedModel}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        )}

        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onSave={() => {
            toast({
              title: "Settings Saved",
              description: "Your API settings have been saved successfully.",
            });
            loadWorkflows();
          }}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
};

export default Index;
