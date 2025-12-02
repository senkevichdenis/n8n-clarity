import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface TypingAnimationProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypingAnimation({ text, speed = 20, onComplete }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
}

const THINKING_MESSAGES = [
  "Studying the workflow...",
  "Analyzing nodes and connections...",
  "Generating your response...",
  "Thinking deeply...",
  "Crafting the answer...",
  "Processing workflow data...",
  "Building the explanation...",
];

const CHAT_THINKING_MESSAGES = [
  "Thinking...",
  "Processing your question...",
  "Formulating a response...",
  "Analyzing context...",
];

interface TypingIndicatorProps {
  className?: string;
  variant?: "generation" | "chat";
}

export function TypingIndicator({ className = "", variant = "generation" }: TypingIndicatorProps) {
  const messages = variant === "chat" ? CHAT_THINKING_MESSAGES : THINKING_MESSAGES;
  
  const randomMessage = useMemo(() => {
    return messages[Math.floor(Math.random() * messages.length)];
  }, [messages]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TextShimmer className="text-sm font-medium" duration={1.5}>
        {randomMessage}
      </TextShimmer>
    </div>
  );
}
