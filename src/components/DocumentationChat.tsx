import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getApiKey } from "@/lib/storage";
import { editDocumentation } from "@/lib/openrouter";
import type { ChatMessage } from "@/types";

interface DocumentationChatProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  disabled: boolean;
  selectedModel: string;
}

export function DocumentationChat({
  messages,
  onMessagesChange,
  markdown,
  onMarkdownChange,
  disabled,
  selectedModel,
}: DocumentationChatProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading || disabled) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
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
      const updatedMarkdown = await editDocumentation(
        apiKey,
        selectedModel,
        markdown,
        input
      );

      // Validate that we got markdown back
      if (!updatedMarkdown || updatedMarkdown.trim() === "") {
        throw new Error("Received empty response from LLM");
      }

      onMarkdownChange(updatedMarkdown);
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "Documentation updated successfully.",
      };
      onMessagesChange([...messages, userMessage, assistantMessage]);
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
      <div className="p-4 border-b border-[hsl(var(--border-subtle))]">
        <h2 className="text-lg font-bold text-[hsl(var(--text-main))]">Edit Documentation</h2>
        <p className="text-sm text-[hsl(var(--text-muted))]">Give instructions to modify the documentation</p>
      </div>

      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[hsl(var(--text-muted))] text-center">
              {disabled
                ? "Generate documentation first to start editing"
                : "Use this chat to edit the documentation with natural language instructions"}
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
                <div className="prose prose-invert prose-sm max-w-none text-[hsl(var(--text-main))] whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
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
