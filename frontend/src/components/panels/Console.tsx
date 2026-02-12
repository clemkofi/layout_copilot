import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ConsoleProps {
  logs?: string[];
}

const MOCK_LOGS = [
  "Console Output",
  "System Log install message...",
  "System Log invoke maint wx about the scoriflas (8:22:8039M)",
  "System Log dptimput message...",
  "Console Output Messaged",
  "Console Output Messaged",
  "Console Output Output Messaged",
  "Console Output Messaged",
  "Console Output Messaged",
  "Console Output Messaged",
];

export function Console({ logs = MOCK_LOGS }: ConsoleProps) {
  return (
    <Card className="h-full border-0 shadow-none flex flex-col bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Console</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-hidden rounded-md border bg-muted/30">
          <ScrollArea className="h-full w-full">
            <div className="p-2.5 font-mono text-xs leading-relaxed space-y-1">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
