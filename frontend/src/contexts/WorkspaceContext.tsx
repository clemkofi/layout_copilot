import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getJobStatus,
  getLayout,
  getLayoutConfig,
  startGeneration,
} from "@/lib/api";
import { useJobStream } from "@/hooks/useJobStream";
import type { DisplayConfig, LayoutData } from "@/lib/types";

interface WorkspaceContextValue {
  libraries: string[];
  cells: string[];
  layouts: string[];
  selectedLibrary: string | null;
  selectedCell: string | null;
  selectedLayout: string | null;
  activeJobId: string | null;
  layoutData: LayoutData | null;
  layerConfig: DisplayConfig | null;
  layerVisibility: Record<string, boolean>;
  logs: string[];
  isStreaming: boolean;
  isLayerConfigLoading: boolean;
  isLayoutLoading: boolean;
  isGenerating: boolean;
  setSelectedLibrary: (name: string | null) => void;
  setSelectedCell: (name: string | null) => void;
  setSelectedLayout: (name: string | null) => void;
  generateLayout: (layoutName: string) => Promise<void>;
  toggleLayerVisibility: (layerName: string) => void;
}

const MOCK_LIBRARIES = ["Standard Lib", "Analog Lib", "RF Lib"];
const MOCK_CELLS = ["INV_X1", "NAND2_X1", "NOR2_X1", "DFF_X1"];
const MOCK_LAYOUTS = ["layout_clean", "layout_opt", "layout_final"];

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

function buildInitialVisibility(
  config: DisplayConfig,
): Record<string, boolean> {
  const initialVisibility: Record<string, boolean> = {};
  for (const layers of Object.values(config)) {
    for (const layerName of Object.keys(layers)) {
      initialVisibility[layerName] = true;
    }
  }
  return initialVisibility;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(
    MOCK_LIBRARIES[0] ?? null,
  );
  const [selectedCell, setSelectedCell] = useState<string | null>(
    MOCK_CELLS[0] ?? null,
  );
  const [selectedLayout, setSelectedLayout] = useState<string | null>(
    MOCK_LAYOUTS[0] ?? null,
  );

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [layerConfig, setLayerConfig] = useState<DisplayConfig | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<
    Record<string, boolean>
  >({});

  const [isLayerConfigLoading, setIsLayerConfigLoading] = useState(true);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextLogs, setContextLogs] = useState<string[]>([]);

  const {
    logs: streamLogs,
    status: streamStatus,
    isStreaming,
  } = useJobStream(activeJobId);
  const completionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadLayerConfig() {
      setIsLayerConfigLoading(true);
      try {
        const config = await getLayoutConfig();
        if (isCancelled) {
          return;
        }
        setLayerConfig(config);
        setLayerVisibility(buildInitialVisibility(config));
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          setContextLogs((previous) => [
            ...previous,
            `Failed to load layer config: ${message}`,
          ]);
        }
      } finally {
        if (!isCancelled) {
          setIsLayerConfigLoading(false);
        }
      }
    }

    void loadLayerConfig();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    completionKeyRef.current = null;
    setContextLogs([]);
  }, [activeJobId]);

  useEffect(() => {
    if (!activeJobId || !streamStatus) {
      return;
    }

    const completionKey = `${activeJobId}:${streamStatus}`;
    if (completionKeyRef.current === completionKey) {
      return;
    }
    completionKeyRef.current = completionKey;

    if (streamStatus === "completed") {
      let isCancelled = false;

      async function loadLayout() {
        setIsLayoutLoading(true);
        try {
          const data = await getLayout(activeJobId || "");
          if (!isCancelled) {
            setLayoutData(data);
            setContextLogs((previous) => [
              ...previous,
              "Layout generation completed.",
            ]);
          }
        } catch (error) {
          if (!isCancelled) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            setContextLogs((previous) => [
              ...previous,
              `Failed to load layout: ${message}`,
            ]);
          }
        } finally {
          if (!isCancelled) {
            setIsLayoutLoading(false);
            setIsGenerating(false);
          }
        }
      }

      void loadLayout();
      return () => {
        isCancelled = true;
      };
    }

    if (streamStatus === "failed") {
      let isCancelled = false;

      async function loadFailureStatus() {
        setIsGenerating(false);
        try {
          const job = await getJobStatus(activeJobId || "");
          if (!isCancelled) {
            const errorMessage = job.error ?? "Layout generation failed.";
            setContextLogs((previous) => [
              ...previous,
              `Generation failed: ${errorMessage}`,
            ]);
          }
        } catch {
          if (!isCancelled) {
            setContextLogs((previous) => [
              ...previous,
              "Generation failed and status lookup was unavailable.",
            ]);
          }
        }
      }

      void loadFailureStatus();
      return () => {
        isCancelled = true;
      };
    }
  }, [activeJobId, streamStatus]);

  const generateLayout = useCallback(
    async (layoutName: string) => {
      const cellName = selectedCell ?? layoutName;
      setIsGenerating(true);
      setIsLayoutLoading(false);
      setContextLogs([`Starting generation for ${cellName}...`]);
      try {
        const job = await startGeneration(cellName);
        setActiveJobId(job.job_id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setContextLogs((previous) => [
          ...previous,
          `Failed to start generation: ${message}`,
        ]);
        setIsGenerating(false);
      }
    },
    [selectedCell],
  );

  const toggleLayerVisibility = useCallback((layerName: string) => {
    setLayerVisibility((previous) => ({
      ...previous,
      [layerName]: !(previous[layerName] ?? true),
    }));
  }, []);

  const logs = useMemo(
    () => [...streamLogs, ...contextLogs],
    [streamLogs, contextLogs],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      libraries: MOCK_LIBRARIES,
      cells: MOCK_CELLS,
      layouts: MOCK_LAYOUTS,
      selectedLibrary,
      selectedCell,
      selectedLayout,
      activeJobId,
      layoutData,
      layerConfig,
      layerVisibility,
      logs,
      isStreaming,
      isLayerConfigLoading,
      isLayoutLoading,
      isGenerating,
      setSelectedLibrary,
      setSelectedCell,
      setSelectedLayout,
      generateLayout,
      toggleLayerVisibility,
    }),
    [
      selectedLibrary,
      selectedCell,
      selectedLayout,
      activeJobId,
      layoutData,
      layerConfig,
      layerVisibility,
      logs,
      isStreaming,
      isLayerConfigLoading,
      isLayoutLoading,
      isGenerating,
      generateLayout,
      toggleLayerVisibility,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
}
