import { useState } from "react";
import { IconSidebar } from "./IconSidebar";
import { SidePanel } from "../panels/SidePanel";
import { LayoutCanvas } from "../canvas/LayoutCanvas";
import { LayerLegend } from "../panels/LayerLegend";
import { Console } from "../panels/Console";
import { ChatBox } from "../panels/ChatBox";
import { Group, Panel, Separator } from "react-resizable-panels";

function WorkspacePanels() {
  return (
    <div className="h-full min-h-0 overflow-hidden p-3">
      <Group orientation="horizontal" className="h-full min-h-0">
        <Panel defaultSize={75} minSize={20}>
          <Group orientation="vertical" className="h-full min-h-0">
            <Panel defaultSize={68} minSize={30}>
              <Group orientation="horizontal" className="h-full min-h-0">
                <Panel defaultSize={85} minSize={30}>
                  <div className="h-full min-h-0 overflow-hidden rounded-md border bg-card">
                    <LayoutCanvas />
                  </div>
                </Panel>
                <Separator className="my-1 w-2 rounded-sm bg-border/80 transition-colors hover:bg-border" />
                <Panel defaultSize={15} minSize={15}>
                  <div className="h-full min-h-0 overflow-hidden rounded-md border bg-card">
                    <LayerLegend />
                  </div>
                </Panel>
              </Group>
            </Panel>
            <Separator className="my-1 h-2 rounded-sm bg-border/80 transition-colors hover:bg-border" />
            <Panel defaultSize={32} minSize={20}>
              <div className="h-full min-h-0 overflow-hidden rounded-md border bg-card">
                <Console />
              </div>
            </Panel>
          </Group>
        </Panel>
        <Separator className="mx-1 w-2 rounded-sm bg-border/80 transition-colors hover:bg-border" />
        <Panel defaultSize={25} minSize={20}>
          <div className="h-full min-h-0 overflow-hidden rounded-md border bg-card">
            <ChatBox />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

export function MainLayout() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // return <ComponentExample />;

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground">
      <IconSidebar
        onToggleCollapse={() => setIsSidePanelOpen(!isSidePanelOpen)}
        isCollapsed={!isSidePanelOpen}
      />
      {isSidePanelOpen ? (
        <Group orientation="horizontal" className="h-full min-h-0 flex-1">
          <Panel defaultSize={15} minSize={16}>
            <SidePanel />
          </Panel>
          <Separator className="mx-1 w-2 rounded-sm bg-border/80 transition-colors hover:bg-border" />
          <Panel defaultSize={85} minSize={40}>
            <WorkspacePanels />
          </Panel>
        </Group>
      ) : (
        <div className="h-full min-h-0 flex-1">
          <WorkspacePanels />
        </div>
      )}
    </div>
  );
}
