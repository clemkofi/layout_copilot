import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function IconSidebar({
  isCollapsed,
  onToggleCollapse,
}: IconSidebarProps) {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: BarChart3, label: "Analytics" },
    // { icon: Layers, label: "Layers" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-[60px] border-r flex flex-col items-center py-4 gap-4 bg-muted/10">
      <TooltipProvider delay={0}>
        {items.map((item, index) => (
          <Tooltip key={index}>
            <TooltipTrigger>
              <Button variant="ghost" size="icon-lg" className="size-8">
                <item.icon className="size-6" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      <div className="mt-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-10 w-10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
