import { ScrollArea } from "@/components/ui/scroll-area";
import type { Mode } from "@/types";
import ReactMarkdown from "react-markdown";
import { TypingIndicator } from "./TypingAnimation";

interface SummaryPanelProps {
  mode: Mode;
  content: string | null;
  isLoading: boolean;
}

export function SummaryPanel({ mode, content, isLoading }: SummaryPanelProps) {
  if (mode === "Q&A Only") {
    return (
      <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded p-8 h-full flex items-center justify-center">
        <p className="text-[hsl(var(--text-muted))] text-center">
          Q&A Only mode. Use the chat panel to ask questions about the workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded p-8 h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-[hsl(var(--text-main))]">{mode}</h2>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <TypingIndicator variant="generation" />
          </div>
        ) : content ? (
          <div className="prose prose-invert max-w-none text-[hsl(var(--text-main))]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[hsl(var(--text-muted))]">
            Select a workflow, choose your settings, and click Generate to see the analysis.
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
