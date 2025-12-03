import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { useTextStream } from "@/components/ui/response-stream";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatPanel({ messages, onSendMessage, isLoading, disabled }: ChatPanelProps) {
  const [input, setInput] = useState("");

  // Get the last assistant message for typing animation
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const { displayedText } = useTextStream({
    textStream: lastMessage?.role === "assistant" ? lastMessage.content : "",
    speed: 30,
    mode: "typewriter",
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading || disabled) return;

    const message = input;
    setInput("");
    await onSendMessage(message);
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
        <h2 className="text-base font-semibold text-[hsl(var(--text-main))]">Chat</h2>
        <p className="text-xs text-[hsl(var(--text-muted))]">Ask questions about the workflow</p>
      </div>

      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[hsl(var(--text-muted))] text-center text-sm">
              {disabled
                ? "Select workflow and configure settings"
                : "Start a conversation about the workflow"}
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
          className="relative rounded-lg border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-input))] focus-within:ring-1 focus-within:ring-[hsl(var(--ring))] p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Configure settings first..." : "Ask a question..."}
            disabled={disabled || isLoading}
            className="min-h-12 resize-none rounded-lg bg-[hsl(var(--bg-input))] border-0 p-3 shadow-none focus-visible:ring-0 text-[hsl(var(--text-main))]"
          />
          <div className="flex items-center p-3 pt-0 justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading || disabled}
              className="ml-auto gap-1.5 bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))]"
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
