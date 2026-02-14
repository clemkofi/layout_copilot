export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  job_id: string;
  status: JobStatus;
  created_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface Polygon {
  layer: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface Label {
  layer: string;
  x: number;
  y: number;
  text: string;
}

export interface LayoutData {
  canvas_width: number;
  canvas_height: number;
  start_x: number;
  start_y: number;
  layer_maps: Record<string, string>;
  polygons: Polygon[];
  labels: Label[];
}

export interface LayerConfig {
  color: string;
  facecolor: string;
  edgecolor: string;
  alpha: number;
  linewidth: number;
  zorder: number;
}

export type DisplayConfig = Record<string, Record<string, LayerConfig>>;

export interface GenerateRequest {
  cell_name?: string;
  config?: Record<string, unknown>;
}
