import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Mode } from "@/types";
import ReactMarkdown from "react-markdown";
import { TypingIndicator } from "./TypingAnimation";

interface SummaryPanelProps {
  mode: Mode;
  content: string | null;
  isLoading: boolean;
}

export function SummaryPanel({ mode, content, isLoading }: SummaryPanelProps) {
  const { toast } = useToast();

  // Convert markdown to plain text (strip markdown syntax)
  const markdownToPlainText = (md: string): string => {
    return md
      .replace(/^#{1,6}\s+/gm, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\_\_(.+?)\_\_/g, '$1') // Remove bold (underscore)
      .replace(/\_(.+?)\_/g, '$1') // Remove italic (underscore)
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert lists to bullets
      .replace(/^\s*\d+\.\s+/gm, '• '); // Convert numbered lists to bullets
  };

  const handleCopyText = () => {
    if (!content) return;
    const plainText = markdownToPlainText(content);
    navigator.clipboard.writeText(plainText);
    toast({
      title: "Copied to Clipboard",
      description: "Plain text (without markdown) has been copied.",
    });
  };

  const handleCopyMarkdown = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Markdown text has been copied.",
    });
  };

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
    <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded-lg h-full flex flex-col">
      <div className="border-b border-[hsl(var(--border-subtle))] p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[hsl(var(--text-main))]">{mode}</h2>
        {content && !isLoading && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Copy Markdown
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 p-8 overflow-hidden">
        <ScrollArea className="h-full">
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
    </div>
  );
}
