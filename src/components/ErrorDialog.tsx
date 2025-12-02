import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  details?: string;
}

export function ErrorDialog({ open, onOpenChange, title, message, details }: ErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--bg-panel))] border-[hsl(var(--border-subtle))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--text-main))]">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--text-secondary))]">
            {message}
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between bg-[hsl(var(--bg-panel-alt))] border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--bg-panel))] text-[hsl(var(--text-main))]"
            >
              <span>Error Details</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showDetails && (
              <ScrollArea className="mt-3 h-[300px] w-full rounded-md border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-code))] p-4">
                <pre className="text-xs text-[hsl(var(--text-secondary))] whitespace-pre-wrap break-words font-mono">
                  {details}
                </pre>
              </ScrollArea>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[hsl(var(--btn-bg))] hover:bg-[hsl(var(--btn-bg-hover))] text-[hsl(var(--text-main))]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
