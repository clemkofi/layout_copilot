import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Play, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutViewProps {
  layouts: string[];
  selectedLayout: string | null;
  onSelectLayout: (name: string) => void;
  onGenerateLayout: (name: string) => void;
}

export function LayoutView({
  layouts,
  selectedLayout,
  onSelectLayout,
  onGenerateLayout,
}: LayoutViewProps) {
  return (
    <div className="flex flex-col h-1/3 min-h-0">
      <div className="p-4 font-semibold text-sm shrink-0 flex justify-between items-center">
        <span>Layout View</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 pb-2 space-y-1">
          {layouts.map((layout) => (
            <div
              key={layout}
              className={cn(
                "group flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 transition-colors",
                selectedLayout === layout && "bg-muted font-medium",
              )}
              onClick={() => onSelectLayout(layout)}
            >
              <span>{layout}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Compact actions or menu */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateLayout(layout);
                  }}
                  title="Generate"
                >
                  <Play className="h-3 w-3" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Modify
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateLayout(layout);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" /> Generate Layout
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 shrink-0">
        <Button className="w-full" size="sm">
          Create New
        </Button>
      </div>
    </div>
  );
}
