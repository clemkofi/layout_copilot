import { useEffect, useState } from "react";
import { getJobStatus } from "@/lib/api";
import type { JobStatus } from "@/lib/types";

interface UseJobStreamResult {
  logs: string[];
  status: JobStatus | null;
  isStreaming: boolean;
}

function isJobStatus(value: string): value is JobStatus {
  return value === "pending" || value === "running" || value === "completed" || value === "failed";
}

export function useJobStream(jobId: string | null): UseJobStreamResult {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    setLogs([]);
    setStatus(null);
    setIsStreaming(false);

    if (!jobId) {
      return;
    }

    let cancelled = false;
    const source = new EventSource(`/api/generate/${jobId}/stream`);
    setIsStreaming(true);

    const onLog = (event: Event) => {
      const message = event as MessageEvent<string>;
      setLogs((previous) => [...previous, String(message.data)]);
    };

    const onComplete = (event: Event) => {
      const message = event as MessageEvent<string>;
      const nextStatus = String(message.data).trim();
      if (isJobStatus(nextStatus)) {
        setStatus(nextStatus);
      } else {
        setStatus(null);
      }
      setIsStreaming(false);
      source.close();
    };

    source.addEventListener("log", onLog);
    source.addEventListener("complete", onComplete);
    source.onerror = () => {
      source.close();
      setIsStreaming(false);
      // Fallback: poll the job status when the stream errors or closes
      // without delivering a "complete" event.
      if (!cancelled) {
        getJobStatus(jobId)
          .then((job) => {
            if (!cancelled && isJobStatus(job.status)) {
              setStatus(job.status);
            }
          })
          .catch(() => {
            // Status lookup failed — nothing more we can do.
          });
      }
    };

    return () => {
      cancelled = true;
      source.removeEventListener("log", onLog);
      source.removeEventListener("complete", onComplete);
      source.close();
    };
  }, [jobId]);

  return { logs, status, isStreaming };
}
