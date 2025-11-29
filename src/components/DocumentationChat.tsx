import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
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
    <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded-lg h-full flex flex-col">
      <div className="border-b border-[hsl(var(--border-subtle))] p-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--text-main))]">
          Edit Documentation
        </h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
          Give instructions to modify the documentation
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[hsl(var(--text-muted))] text-center px-4">
            Use this chat to edit the documentation with natural language instructions
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-[hsl(var(--bg-panel-alt))] ml-8"
                    : "bg-[hsl(var(--bg-input))] mr-8"
                }`}
              >
                <div className="text-xs font-medium text-[hsl(var(--text-muted))] mb-1">
                  {message.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="text-sm text-[hsl(var(--text-main))] whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-[hsl(var(--border-subtle))] p-4">
        <div className="flex gap-2">
          <Textarea
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
                ? "Select a workflow and generate documentation first..."
                : "E.g., 'Shorten the overview section' or 'Add error handling details'"
            }
            disabled={disabled || isLoading}
            className="resize-none bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
