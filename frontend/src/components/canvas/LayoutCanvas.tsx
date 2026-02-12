import { useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Placeholder types for future plan B
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface LayoutData {
  canvas_width: number;
  canvas_height: number;
  start_x: number;
  start_y: number;
}
interface LayerConfig {
  color: string;
}

interface LayoutCanvasProps {
  layoutData?: LayoutData | null;
  layerConfig?: Record<string, Record<string, LayerConfig>>;
  layerVisibility?: Record<string, boolean>;
}

export function LayoutCanvas({ layoutData }: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Match container size
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawPlaceholder(canvas);
    });

    resizeObserver.observe(container);

    // Initial draw
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawPlaceholder(canvas);

    return () => resizeObserver.disconnect();
  }, [layoutData]); // Re-run if props change? For now static placeholder.

  const drawPlaceholder = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = "#e5e5e5"; // light gray
    ctx.lineWidth = 1;

    const step = 40;

    ctx.beginPath();
    for (let x = 0; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Canvas Area (Placeholder)", w / 2, h / 2);
  };

  return (
    <Card className="h-full border-0 shadow-none flex flex-col bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Canvas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 pb-3 min-h-0">
        <div
          className="h-full min-h-0 relative border rounded-md bg-white overflow-hidden"
          ref={containerRef}
        >
          <canvas ref={canvasRef} className="block" />
        </div>
      </CardContent>
    </Card>
  );
}
