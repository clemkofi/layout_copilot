import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function Console() {
  const { logs, isGenerating } = useWorkspace();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  return (
    <Card className="h-full border-0 shadow-none flex flex-col bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Console</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-hidden rounded-md border bg-muted/30">
          <ScrollArea className="h-full w-full">
            <div className="p-2.5 font-mono text-xs leading-relaxed space-y-1">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">
                  {isGenerating
                    ? "Generating layout..."
                    : "No output yet. Generate a layout to see logs here."}
                </div>
              ) : (
                logs.map((log, i) => <div key={`${log}-${i}`}>{log}</div>)
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
