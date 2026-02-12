import { useState } from "react";
import { LibraryView } from "./LibraryView";
import { CellView } from "./CellView";
import { LayoutView } from "./LayoutView";

// Mock Data
const MOCK_LIBRARIES = ["Standard Lib", "Analog Lib", "RF Lib"];
const MOCK_CELLS = ["INV_X1", "NAND2_X1", "NOR2_X1", "DFF_X1"];
const MOCK_LAYOUTS = ["layout_clean", "layout_opt", "layout_final"];

interface SidePanelProps {
  libraries?: string[];
  cells?: string[];
  layouts?: string[];
  selectedLibrary?: string | null;
  selectedCell?: string | null;
  selectedLayout?: string | null;
  onSelectLibrary?: (name: string) => void;
  onSelectCell?: (name: string) => void;
  onSelectLayout?: (name: string) => void;
  onCreateLibrary?: () => void;
  onDeleteLibrary?: (name: string) => void;
  onGenerateLayout?: (layoutName: string) => void;
}

export function SidePanel({
  libraries = MOCK_LIBRARIES,
  cells = MOCK_CELLS,
  layouts = MOCK_LAYOUTS,
  selectedLibrary: propSelectedLibrary,
  selectedCell: propSelectedCell,
  selectedLayout: propSelectedLayout,
  onSelectLibrary,
  onSelectCell,
  onSelectLayout,
  onCreateLibrary,
  onDeleteLibrary,
  onGenerateLayout,
}: SidePanelProps) {
  // Local state fallbacks if props are not provided
  const [localSelectedLibrary, setLocalSelectedLibrary] = useState<string | null>(null);
  const [localSelectedCell, setLocalSelectedCell] = useState<string | null>(null);
  const [localSelectedLayout, setLocalSelectedLayout] = useState<string | null>(null);

  const activeLibrary = propSelectedLibrary !== undefined ? propSelectedLibrary : localSelectedLibrary;
  const activeCell = propSelectedCell !== undefined ? propSelectedCell : localSelectedCell;
  const activeLayout = propSelectedLayout !== undefined ? propSelectedLayout : localSelectedLayout;

  const handleSelectLibrary = (name: string) => {
    setLocalSelectedLibrary(name);
    onSelectLibrary?.(name);
  };

  const handleSelectCell = (name: string) => {
    setLocalSelectedCell(name);
    onSelectCell?.(name);
  };

  const handleSelectLayout = (name: string) => {
    setLocalSelectedLayout(name);
    onSelectLayout?.(name);
  };

  return (
    <div className="w-full border-r flex flex-col h-full bg-background">
      <LibraryView
        libraries={libraries}
        selectedLibrary={activeLibrary}
        onSelectLibrary={handleSelectLibrary}
        onCreateLibrary={() => onCreateLibrary?.()}
        onDeleteLibrary={(name) => onDeleteLibrary?.(name)}
      />
      <CellView
        cells={cells}
        selectedCell={activeCell}
        onSelectCell={handleSelectCell}
      />
      <LayoutView
        layouts={layouts}
        selectedLayout={activeLayout}
        onSelectLayout={handleSelectLayout}
        onGenerateLayout={(name) => onGenerateLayout?.(name)}
      />
    </div>
  );
}
