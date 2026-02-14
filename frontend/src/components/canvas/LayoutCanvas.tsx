import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { LayerConfig } from "@/lib/types";

const GRID_COLOR = "#e5e7eb";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 30;
const ZOOM_SENSITIVITY = 0.002;

export function LayoutCanvas() {
  const {
    layoutData,
    layerConfig,
    layerVisibility,
    isLayoutLoading,
    isGenerating,
  } = useWorkspace();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);

  // ---- Zoom / pan state (refs to avoid re-renders on every mouse event) ----
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const layerConfigByName = useMemo(() => {
    const map = new Map<string, LayerConfig>();
    if (!layerConfig) {
      return map;
    }
    for (const layers of Object.values(layerConfig)) {
      for (const [layerName, config] of Object.entries(layers)) {
        map.set(layerName, config);
      }
    }
    return map;
  }, [layerConfig]);

  // ---- Queue a repaint via requestAnimationFrame ----
  const queueDraw = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas(
        canvasRef.current,
        containerRef.current,
        layoutData,
        layerConfigByName,
        layerVisibility,
        zoomRef.current,
        panRef.current,
      );
    });
  }, [layoutData, layerConfigByName, layerVisibility]);

  // ---- Reset zoom / pan whenever new layout data arrives ----
  useEffect(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomPercent(100);
  }, [layoutData]);

  // ---- Drawing + event listeners ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // --- Wheel → zoom (anchored to cursor) ---
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldZoom = zoomRef.current;
      // Use a smooth multiplicative factor based on scroll delta
      const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
      const newZoom = Math.min(Math.max(oldZoom * factor, MIN_ZOOM), MAX_ZOOM);

      // Adjust pan so the point under the cursor stays fixed
      panRef.current = {
        x: mouseX - (mouseX - panRef.current.x) * (newZoom / oldZoom),
        y: mouseY - (mouseY - panRef.current.y) * (newZoom / oldZoom),
      };
      zoomRef.current = newZoom;
      setZoomPercent(Math.round(newZoom * 100));
      queueDraw();
    };

    // --- Left-click drag → pan ---
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left-click only
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      panRef.current = {
        x: panRef.current.x + dx,
        y: panRef.current.y + dy,
      };
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      queueDraw();
    };

    const onMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvas.style.cursor = "grab";
    };

    // Set initial cursor
    canvas.style.cursor = "grab";

    // Attach listeners
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    const resizeObserver = new ResizeObserver(queueDraw);
    resizeObserver.observe(container);
    queueDraw();

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      resizeObserver.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [queueDraw]);

  // ---- Reset handler exposed via the button ----
  const handleResetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomPercent(100);
    queueDraw();
  }, [queueDraw]);

  return (
    <Card className="h-full border-0 shadow-none flex flex-col bg-transparent">
      <CardHeader className="px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Canvas</CardTitle>
        {layoutData && (
          <button
            onClick={handleResetView}
            className="text-xs px-2 py-0.5 rounded border bg-white hover:bg-gray-50 text-muted-foreground"
          >
            Reset view
          </button>
        )}
      </CardHeader>
      <CardContent className="flex-1 px-3 pb-3 min-h-0">
        <div
          className="h-full min-h-0 relative border rounded-md bg-white overflow-hidden"
          ref={containerRef}
        >
          <canvas ref={canvasRef} className="block" />
          {/* Zoom indicator */}
          {layoutData && (
            <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/60 pointer-events-none select-none">
              {zoomPercent}%
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isLayoutLoading ? (
              <span className="rounded-md bg-white/90 px-2 py-1 text-sm text-muted-foreground">
                Loading layout...
              </span>
            ) : isGenerating && !layoutData ? (
              <span className="rounded-md bg-white/90 px-2 py-1 text-sm text-muted-foreground">
                Generating...
              </span>
            ) : !layoutData ? (
              <span className="rounded-md bg-white/90 px-2 py-1 text-sm text-muted-foreground">
                No layout loaded yet.
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pure drawing function (no hooks, no side-effects beyond the canvas)
// ---------------------------------------------------------------------------

function drawCanvas(
  canvas: HTMLCanvasElement | null,
  container: HTMLDivElement | null,
  layoutData: ReturnType<typeof useWorkspace>["layoutData"],
  layerConfigByName: Map<string, LayerConfig>,
  layerVisibility: Record<string, boolean>,
  zoom: number,
  pan: { x: number; y: number },
) {
  if (!canvas || !container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  if (!layoutData) {
    drawPlaceholderGrid(ctx, width, height);
    return;
  }

  // ---- Compute base model-to-pixel mapping ----
  const modelWidth = Math.max(layoutData.canvas_width, 1);
  const modelHeight = Math.max(layoutData.canvas_height, 1);
  const padding = 16;
  const availableWidth = Math.max(width - padding * 2, 1);
  const availableHeight = Math.max(height - padding * 2, 1);
  const baseScale = Math.min(
    availableWidth / modelWidth,
    availableHeight / modelHeight,
  );
  const baseOffsetX = (width - modelWidth * baseScale) / 2;
  const baseOffsetY = (height - modelHeight * baseScale) / 2;

  // ---- Apply zoom + pan transform ----
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const toCanvasX = (x: number) =>
    baseOffsetX + (x - layoutData.start_x) * baseScale;
  // Flip Y so that y=0 is at the bottom (layout data uses cartesian coords,
  // but HTML Canvas y=0 is at the top).
  const toCanvasY = (y: number) =>
    baseOffsetY + (modelHeight - (y - layoutData.start_y)) * baseScale;

  // ---- Draw polygons sorted by z-order ----
  const polygons = layoutData.polygons
    .filter((polygon) => layerVisibility[polygon.layer] !== false)
    .map((polygon) => {
      const config = layerConfigByName.get(polygon.layer);
      return { polygon, config, zorder: config?.zorder ?? 0 };
    })
    .sort((a, b) => a.zorder - b.zorder);

  for (const { polygon, config } of polygons) {
    const x0 = toCanvasX(polygon.x0);
    const y0 = toCanvasY(polygon.y0);
    const x1 = toCanvasX(polygon.x1);
    const y1 = toCanvasY(polygon.y1);
    const left = Math.min(x0, x1);
    const top = Math.min(y0, y1);
    const rectWidth = Math.abs(x1 - x0);
    const rectHeight = Math.abs(y1 - y0);

    const fillColor = config?.facecolor ?? config?.color ?? "transparent";
    const edgeColor = config?.edgecolor ?? config?.color ?? "#111827";
    const alpha = config?.alpha ?? 1;
    // Scale linewidth inversely with zoom so strokes stay ~constant on screen
    const lineWidth = Math.max((config?.linewidth ?? 1) / zoom, 0.5 / zoom);

    if (fillColor !== "none") {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillColor;
      ctx.fillRect(left, top, rectWidth, rectHeight);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(left, top, rectWidth, rectHeight);
    ctx.restore();
  }

  // ---- Draw labels ----
  // Font size should stay readable regardless of zoom
  const fontSize = Math.max(11 / zoom, 1);
  ctx.fillStyle = "#1f2937";
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const label of layoutData.labels) {
    if (layerVisibility[label.layer] === false) {
      continue;
    }
    ctx.fillText(label.text, toCanvasX(label.x), toCanvasY(label.y));
  }

  ctx.restore(); // pop zoom+pan transform
}

// ---------------------------------------------------------------------------
// Placeholder grid for empty state
// ---------------------------------------------------------------------------

function drawPlaceholderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  const step = 40;

  ctx.beginPath();
  for (let x = 0; x <= width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}
