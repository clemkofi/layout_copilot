import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBoxProps {
  messages?: Message[];
  onSend?: (message: string) => void;
}

const MOCK_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Hello! How can I help you with your layout today?",
  },
  { role: "user", content: "I need to optimize the cell layout." },
];

export function ChatBox({ messages = MOCK_MESSAGES, onSend }: ChatBoxProps) {
  return (
    <Card className="h-full border-0 shadow-none flex flex-col bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Chat box</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-1.5">
        <div className="flex-1 min-h-0 rounded-md border bg-muted/30 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-2.5">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex items-center gap-1.5">
          <Input placeholder="Send a message..." className="flex-1" />
          <Button size="icon" onClick={() => onSend?.("test")}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
