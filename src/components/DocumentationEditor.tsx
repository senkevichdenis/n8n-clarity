import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiKey } from "@/lib/storage";
import { generateStickyNotes } from "@/lib/openrouter";
import { useState } from "react";
import { TypingIndicator } from "./TypingAnimation";

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

  const handleCopyText = () => {
    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to Clipboard",
      description: "Documentation text has been copied.",
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

    if (!markdown.trim()) {
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
      <div className="border-b border-[hsl(var(--border-subtle))] p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[hsl(var(--text-main))]">
          Documentation Editor
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            disabled={!markdown.trim()}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            disabled={!markdown.trim() || isGeneratingStickyNotes}
            className="bg-[hsl(var(--btn-bg))] border-[hsl(var(--btn-border))] hover:bg-[hsl(var(--btn-bg-hover))]"
          >
            <Code className="h-4 w-4 mr-2" />
            {isGeneratingStickyNotes ? "Generating..." : "Copy Code (n8n Sticky Notes)"}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        {isGenerating ? (
          <div className="flex items-center justify-center h-32">
            <TypingIndicator variant="generation" />
          </div>
        ) : !markdown.trim() ? (
          <p className="text-[hsl(var(--text-muted))]">
            Select a workflow, choose your settings, and click Generate Documentation to begin.
          </p>
        ) : (
          <Textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="h-full resize-none bg-[hsl(var(--bg-input))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] font-mono text-sm"
            placeholder="Documentation will appear here..."
          />
        )}
      </div>
    </div>
  );
}
