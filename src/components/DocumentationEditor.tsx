import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Code, FileText, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiKey } from "@/lib/storage";
import { generateStickyNotes } from "@/lib/openrouter";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypingIndicator } from "./TypingAnimation";
import { useTextStream } from "@/components/ui/response-stream";

interface DocumentationEditorProps {
  markdown: string;
  onMarkdownChange: (value: string) => void;
  isGenerating: boolean;
  selectedModel: string;
}

export function DocumentationEditor({
  markdown,
  onMarkdownChange,
  isGenerating,
  selectedModel,
}: DocumentationEditorProps) {
  const { toast } = useToast();
  const [isGeneratingStickyNotes, setIsGeneratingStickyNotes] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Ensure markdown is always a string to prevent runtime errors
  const safeMarkdown = typeof markdown === 'string' ? markdown : String(markdown || '');

  const { displayedText } = useTextStream({
    textStream: safeMarkdown,
    speed: 80,
    mode: "typewriter",
  });

  // Auto-scroll to bottom when new content is displayed in preview mode
  useEffect(() => {
    if (viewMode === "preview") {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedText, viewMode]);

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
    const plainText = markdownToPlainText(markdown);
    navigator.clipboard.writeText(plainText);
    toast({
      title: "Copied to Clipboard",
      description: "Plain text (without markdown) has been copied.",
    });
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to Clipboard",
      description: "Markdown text has been copied.",
    });
  };

  const handleCopyCode = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      return;
    }

    if (!safeMarkdown.trim()) {
      toast({
        title: "No Documentation",
        description: "Generate documentation first before creating Sticky Notes.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingStickyNotes(true);
    try {
      const stickyNotesJson = await generateStickyNotes(apiKey, selectedModel, markdown);
      
      // Validate JSON
      try {
        JSON.parse(stickyNotesJson);
      } catch {
        throw new Error("Generated content is not valid JSON");
      }

      await navigator.clipboard.writeText(stickyNotesJson);
      toast({
        title: "Sticky Notes JSON Copied",
        description: "You can now paste this into n8n (Ctrl+V / Cmd+V on the canvas).",
      });
    } catch (error) {
      console.error("Sticky notes generation error:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not generate valid Sticky Notes JSON. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStickyNotes(false);
    }
  };

  return (
    <div className="bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded-lg h-full flex flex-col">
      <div className="border-b border-[hsl(var(--border-subtle))] px-4 py-3 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[hsl(var(--text-main))]">
            Documentation Editor
          </h2>
          {safeMarkdown.trim() && (
            <div className="flex gap-1 bg-[hsl(var(--bg-panel-alt))] rounded-md p-1">
              <Button
                variant={viewMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className={viewMode === "preview"
                  ? "bg-[hsl(var(--btn-bg))] hover:bg-[hsl(var(--btn-bg-hover))]"
                  : "hover:bg-[hsl(var(--bg-panel))]"}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
                className={viewMode === "edit"
                  ? "bg-[hsl(var(--btn-bg))] hover:bg-[hsl(var(--btn-bg-hover))]"
                  : "hover:bg-[hsl(var(--bg-panel))]"}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            disabled={!safeMarkdown.trim()}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] h-8 px-2.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            disabled={!safeMarkdown.trim()}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] h-8 px-2.5 text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            disabled={!safeMarkdown.trim() || isGeneratingStickyNotes}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))] h-8 px-2.5 text-xs"
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            {isGeneratingStickyNotes ? "..." : "n8n Notes"}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        {isGenerating ? (
          <div className="flex items-center justify-center h-32">
            <TypingIndicator variant="generation" />
          </div>
        ) : !safeMarkdown.trim() ? (
          <p className="text-[hsl(var(--text-muted))] text-sm">
            Select workflow and click Generate Docs to begin.
          </p>
        ) : viewMode === "preview" ? (
          <ScrollArea className="h-full">
            <div className="prose prose-invert max-w-none text-[hsl(var(--text-main))]">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  h1: ({ children }) => <h1 className="mb-4 mt-6 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-3 mt-6 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 mt-4 first:mt-0">{children}</h3>,
                  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {displayedText}
              </ReactMarkdown>
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <Textarea
            value={safeMarkdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="h-full resize-none bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] font-mono text-sm"
            placeholder="Documentation will appear here..."
          />
        )}
      </div>
    </div>
  );
}
