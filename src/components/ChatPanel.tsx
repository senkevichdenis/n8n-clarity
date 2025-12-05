import { useState } from "react";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { AIInput } from "@/components/ui/ai-input";
import { useTextStream } from "@/components/ui/response-stream";
import { ShiningText } from "@/components/ui/shining-text";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatPanel({ messages, onSendMessage, isLoading, disabled }: ChatPanelProps) {
  // Get the last assistant message for typing animation
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const { displayedText } = useTextStream({
    textStream: lastMessage?.role === "assistant" ? lastMessage.content : "",
    speed: 35,
    mode: "typewriter",
  });

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading || disabled) return;
    await onSendMessage(message);
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
                <ChatBubbleMessage variant="received">
                  <ShiningText text="Думаю..." />
                </ChatBubbleMessage>
              </ChatBubble>
            )}
          </ChatMessageList>
        )}
      </div>

      <div className="p-4 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-panel-alt))]">
        <AIInput
          placeholder={disabled ? "Configure settings first..." : "Ask a question..."}
          disabled={disabled || isLoading}
          onSubmit={handleSend}
          minHeight={44}
          maxHeight={150}
        />
      </div>
    </div>
  );
}
