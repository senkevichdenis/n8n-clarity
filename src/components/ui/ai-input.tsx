"use client";

import { CornerRightUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputProps {
  id?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onSubmit?: (value: string) => void
  className?: string
  disabled?: boolean
}

export function AIInput({
  id = "ai-input",
  placeholder = "Type your message...",
  minHeight = 52,
  maxHeight = 200,
  onSubmit,
  className,
  disabled = false
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [inputValue, setInputValue] = useState("");

  const handleReset = () => {
    if (!inputValue.trim() || disabled) return;
    onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full">
        <Textarea
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-[hsl(var(--bg-input))] rounded-3xl pl-4 pr-12",
            "placeholder:text-[hsl(var(--text-muted))]",
            "border border-[hsl(var(--border-subtle))]",
            "text-[hsl(var(--text-main))] text-wrap",
            "overflow-y-auto resize-none",
            "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "transition-[height] duration-100 ease-out",
            "leading-[1.3] py-3",
            `min-h-[${minHeight}px]`,
            `max-h-[${maxHeight}px]`,
            "[&::-webkit-resizer]:hidden"
          )}
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleReset();
            }
          }}
        />

        <button
          onClick={handleReset}
          type="button"
          disabled={disabled || !inputValue.trim()}
          className={cn(
            "absolute top-1/2 right-3",
            "rounded-full bg-[hsl(var(--btn-bg))] border border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] p-2",
            "transition-all duration-300 ease-in-out",
            "disabled:cursor-not-allowed",
            inputValue.trim() && !disabled
              ? "opacity-100 scale-100 -translate-y-1/2"
              : "opacity-0 scale-90 -translate-y-1/2 translate-y-1 pointer-events-none"
          )}
        >
          <CornerRightUp className="w-4 h-4 text-[hsl(var(--text-main))]" />
        </button>
      </div>
    </div>
  );
}
