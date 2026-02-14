import type { DisplayConfig, GenerateRequest, Job, LayoutData } from "@/lib/types";

export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const errorBody = (await response.json()) as { detail?: string };
      detail = errorBody.detail ?? detail;
    } catch {
      const text = await response.text();
      if (text) {
        detail = text;
      }
    }

    throw new ApiError(`API request failed with status ${response.status}`, response.status, detail);
  }

  return (await response.json()) as T;
}

export function startGeneration(cellName?: string, config?: Record<string, unknown>): Promise<Job> {
  const body: GenerateRequest = {};
  if (cellName) {
    body.cell_name = cellName;
  }
  if (config) {
    body.config = config;
  }

  return requestJson<Job>("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function getJobStatus(jobId: string): Promise<Job> {
  return requestJson<Job>(`/api/generate/${jobId}/status`);
}

export function getLayout(jobId: string): Promise<LayoutData> {
  return requestJson<LayoutData>(`/api/layouts/${jobId}`);
}

export function getLayoutConfig(): Promise<DisplayConfig> {
  return requestJson<DisplayConfig>("/api/layout/config");
}
