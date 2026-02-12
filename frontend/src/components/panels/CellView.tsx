import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CellViewProps {
  cells: string[];
  selectedCell: string | null;
  onSelectCell: (name: string) => void;
}

export function CellView({ cells, selectedCell, onSelectCell }: CellViewProps) {
  return (
    <div className="flex flex-col h-1/3 min-h-0">
      <div className="px-4 py-2 font-semibold text-sm shrink-0 flex items-center justify-between">
        <span>Cell View</span>
      </div>
      <Tabs defaultValue="scells" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pb-2 shrink-0">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="scells">S-Cells</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="scells" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="px-4 pb-2 space-y-1">
              {cells.map((cell) => (
                <div
                  key={cell}
                  onClick={() => onSelectCell(cell)}
                  className={cn(
                    "px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedCell === cell && "bg-muted font-medium"
                  )}
                >
                  {cell}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="modules" className="flex-1 min-h-0 mt-0">
           <div className="p-4 text-xs text-muted-foreground text-center">
             No modules available
           </div>
        </TabsContent>
      </Tabs>
      <Separator />
    </div>
  );
}
