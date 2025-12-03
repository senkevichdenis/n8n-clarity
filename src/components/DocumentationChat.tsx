import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getApiKey, getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { ChatMessage, WorkflowDetails } from "@/types";
import type { DocumentationType } from "@/lib/openrouter";
import { TypingIndicator } from "./TypingAnimation";

interface DocumentationChatProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  disabled: boolean;
  selectedModel: string;
  workflowId: string;
  workflowName: string;
  workflowDetails: WorkflowDetails | null;
  docType: DocumentationType;
}

export function DocumentationChat({
  messages,
  onMessagesChange,
  markdown,
  onMarkdownChange,
  disabled,
  selectedModel,
  workflowId,
  workflowName,
  workflowDetails,
  docType,
}: DocumentationChatProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading || disabled) return;

    const apiKey = getApiKey();
    const n8nBaseUrl = getN8nBaseUrl();
    const n8nApiKey = getN8nApiKey();
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      return;
    }

    if (!n8nBaseUrl || !n8nApiKey) {
      toast({
        title: "n8n Configuration Required",
        description: "Please configure n8n credentials in Settings.",
        variant: "destructive",
      });
      return;
    }

    if (!markdown.trim()) {
      toast({
        title: "No Documentation",
        description: "Generate documentation first before editing via chat.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: input };
    onMessagesChange([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const docTypeMap: Record<DocumentationType, string> = {
        "Basic Tech Doc": "basic_tech_doc",
        "Extended Tech Doc": "extended_tech_doc",
        "Ops Runbook": "ops_runbook",
        "QA Checklist": "qa_checklist",
      };

      const result = await callWebhook({
        action: "edit_documentation",
        sourceTab: "docs",
        workflowId: workflowId,
        workflowName: workflowName,
        llmModel: selectedModel,
        openRouterApiKey: apiKey,
        n8nBaseUrl: n8nBaseUrl,
        n8nApiKey: n8nApiKey,
        workflowData: workflowDetails || undefined,
        panelContext: {
          docType: docTypeMap[docType],
          currentDoc: markdown,
        },
        chat: {
          input: input,
          history: messages,
        },
      });

      if (result.success && result.output) {
        onMarkdownChange(result.output);
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "Documentation updated successfully.",
        };
        onMessagesChange([...messages, userMessage, assistantMessage]);
      } else {
        throw new Error(result.error || "Failed to edit documentation");
      }
    } catch (error) {
      console.error("Documentation edit error:", error);
      toast({
        title: "Edit Failed",
        description:
          error instanceof Error ? error.message : "Failed to edit documentation.",
        variant: "destructive",
      });
      
      // Remove the user message since the edit failed
      onMessagesChange(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[hsl(var(--bg-chat))] border border-[hsl(var(--border-subtle))] rounded flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[hsl(var(--border-subtle))]">
        <h2 className="text-base font-semibold text-[hsl(var(--text-main))]">Edit Documentation</h2>
        <p className="text-xs text-[hsl(var(--text-muted))]">Give instructions to modify the documentation</p>
      </div>

      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[hsl(var(--text-muted))] text-center text-sm">
              {disabled
                ? "Generate documentation first"
                : "Edit documentation with natural language"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded ${
                  message.role === "user"
                    ? "bg-[hsl(var(--chat-user-bg))]"
                    : "bg-[hsl(var(--chat-assistant-bg))]"
                }`}
              >
                <div className="text-xs mb-2 opacity-70 capitalize">{message.role}</div>
                <div className="text-base text-[hsl(var(--text-main))] whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="p-4 rounded bg-[hsl(var(--chat-assistant-bg))] text-[hsl(var(--text-main))]">
                <div className="text-xs mb-2 opacity-70">Assistant</div>
                <TypingIndicator variant="chat" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-panel-alt))]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              disabled
                ? "Generate documentation first..."
                : "E.g., 'Shorten the overview section' or 'Add error handling details'"
            }
            disabled={disabled || isLoading}
            className="flex-1 bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isLoading}
            className="bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
