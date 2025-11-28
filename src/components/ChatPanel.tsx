import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatPanel({ messages, onSendMessage, isLoading, disabled }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      <div className="p-4 border-b border-[hsl(var(--border-subtle))]">
        <h2 className="text-lg font-bold text-[hsl(var(--text-main))]">Chat</h2>
        <p className="text-sm text-[hsl(var(--text-muted))]">Ask questions about the workflow</p>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[hsl(var(--text-muted))] text-center">
              {disabled
                ? "Please select a workflow and configure your API key to start chatting"
                : "Start a conversation about the workflow"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded ${
                  msg.role === "user"
                    ? "bg-[hsl(var(--chat-user-bg))]"
                    : msg.role === "assistant"
                    ? "bg-[hsl(var(--chat-assistant-bg))]"
                    : "bg-transparent"
                } ${msg.role === "system" ? "italic text-[hsl(var(--chat-system-text))]" : "text-[hsl(var(--text-main))]"}`}
              >
                <div className="text-xs mb-2 opacity-70 capitalize">{msg.role}</div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-panel-alt))]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Configure settings first..." : "Ask a question..."}
            disabled={disabled || isLoading}
            className="flex-1 bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            className="bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
