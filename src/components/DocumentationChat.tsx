import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiKey, getN8nBaseUrl, getN8nApiKey } from "@/lib/storage";
import { callWebhook } from "@/lib/webhook";
import type { ChatMessage, WorkflowDetails } from "@/types";
import type { DocumentationType } from "@/lib/openrouter";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { useTextStream } from "@/components/ui/response-stream";
import ReactMarkdown from "react-markdown";

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

  // Get the last assistant message for typing animation
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const { displayedText } = useTextStream({
    textStream: lastMessage?.role === "assistant" ? lastMessage.content : "",
    speed: 45,
    mode: "typewriter",
  });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[hsl(var(--bg-chat))] border border-[hsl(var(--border-subtle))] rounded flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[hsl(var(--border-subtle))]">
        <h2 className="text-base font-semibold text-[hsl(var(--text-main))]">Edit Documentation</h2>
        <p className="text-xs text-[hsl(var(--text-muted))]">Give instructions to modify the documentation</p>
      </div>

      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[hsl(var(--text-muted))] text-center text-sm">
              {disabled
                ? "Generate documentation first"
                : "Edit documentation with natural language"}
            </p>
          </div>
        ) : (
          <ChatMessageList smooth>
            {messages.map((msg, idx) => {
              const isLastAssistant = idx === messages.length - 1 && msg.role === "assistant";

              return (
                <ChatBubble
                  key={idx}
                  variant={msg.role === "user" ? "sent" : "received"}
                >
                  <ChatBubbleMessage variant={msg.role === "user" ? "sent" : "received"}>
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          code: ({ children }) => <code className="bg-[hsl(var(--bg-panel))] px-1 py-0.5 rounded text-xs">{children}</code>,
                        }}
                      >
                        {isLastAssistant ? displayedText : msg.content}
                      </ReactMarkdown>
                    </div>
                  </ChatBubbleMessage>
                </ChatBubble>
              );
            })}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleMessage variant="received" isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        )}
      </div>

      <div className="p-4 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-panel-alt))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative rounded-lg border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-input))] p-2"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Generate documentation first..."
                : "E.g., 'Shorten the overview' or 'Add error handling'"
            }
            disabled={disabled || isLoading}
            className="text-[hsl(var(--text-main))]"
          />
          <div className="flex items-center justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={disabled || !input.trim() || isLoading}
              className="gap-1.5 bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))]"
            >
              Send
              <Send className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
