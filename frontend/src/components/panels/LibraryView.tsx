import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryViewProps {
  libraries: string[];
  selectedLibrary: string | null;
  onSelectLibrary: (name: string) => void;
  onCreateLibrary: () => void;
  onDeleteLibrary: (name: string) => void;
}

export function LibraryView({
  libraries,
  selectedLibrary,
  onSelectLibrary,
  onCreateLibrary,
  onDeleteLibrary,
}: LibraryViewProps) {
  return (
    <div className="flex flex-col h-1/3 min-h-0">
      <div className="p-4 font-semibold text-sm shrink-0">Library View</div>
      <ScrollArea className="flex-1">
        <div className="px-4 pb-2 space-y-1">
          {libraries.map((lib) => (
            <div
              key={lib}
              onClick={() => onSelectLibrary(lib)}
              className={cn(
                "group flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                selectedLibrary === lib && "bg-muted font-medium",
              )}
            >
              <span>{lib}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLibrary(lib);
                }}
                title="Delete Library"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={onCreateLibrary}
        >
          Create Library
        </Button>
      </div>
      <Separator />
    </div>
  );
}
