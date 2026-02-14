import { LibraryView } from "./LibraryView";
import { CellView } from "./CellView";
import { LayoutView } from "./LayoutView";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function SidePanel() {
  const {
    libraries,
    cells,
    layouts,
    selectedLibrary,
    selectedCell,
    selectedLayout,
    setSelectedLibrary,
    setSelectedCell,
    setSelectedLayout,
    generateLayout,
    isGenerating,
  } = useWorkspace();

  return (
    <div className="w-full border-r flex flex-col h-full bg-background">
      <LibraryView
        libraries={libraries}
        selectedLibrary={selectedLibrary}
        onSelectLibrary={setSelectedLibrary}
        onCreateLibrary={() => {}}
        onDeleteLibrary={() => {}}
      />
      <CellView
        cells={cells}
        selectedCell={selectedCell}
        onSelectCell={setSelectedCell}
      />
      <LayoutView
        layouts={layouts}
        selectedLayout={selectedLayout}
        onSelectLayout={setSelectedLayout}
        onGenerateLayout={generateLayout}
        isGenerating={isGenerating}
      />
    </div>
  );
}
