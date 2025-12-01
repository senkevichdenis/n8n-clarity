import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-[hsl(var(--text-muted))] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-[hsl(var(--text-muted))] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-[hsl(var(--text-muted))] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
