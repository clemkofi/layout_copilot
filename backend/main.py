from __future__ import annotations

import importlib
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sse_starlette.sse import EventSourceResponse

from .config import ALLOWED_ORIGINS, DATA_DIR, GENERATOR_SCRIPT, JOBS_DIR
from .models import GenerateRequest, JobStatus
from .services import JobManager, LayoutParser

app = FastAPI()

# middleware to compress responses
app.add_middleware(GZipMiddleware, minimum_size=1000)
# middleware to allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in ALLOWED_ORIGINS else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create jobs directory if it doesn't exist
JOBS_DIR.mkdir(parents=True, exist_ok=True)

# singleton instances of job manager and layout parser
job_manager = JobManager(JOBS_DIR, GENERATOR_SCRIPT)
layout_parser = LayoutParser()


# helper function to load display config
def _load_display_config() -> dict:
    try:
        module = importlib.import_module("backend.display_config")
    except ImportError as exc:
        raise HTTPException(
            status_code=404, detail="display_config.py not found"
        ) from exc
    module = importlib.reload(module)
    return getattr(module, "display_colors", {})


@app.get("/")
async def root():
    return {"message": "Layout Copilot API"}


@app.post("/api/generate")
async def generate_layout(request: GenerateRequest):
    job = await job_manager.create_job(request)
    await job_manager.start_job(job.job_id, request)
    return job


@app.get("/api/generate/{job_id}/status")
async def job_status(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/generate/{job_id}/stream")
async def stream_job_logs(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        queue = job_manager.add_subscriber(job_id)
        try:
            # stream all logs from the job history that occurred before the subscriber connected
            for line in job_manager.get_history(job_id):
                yield {"event": "log", "data": line}

            # stream new logs as they occur
            while True:
                log_line = await queue.get()
                # trigger when the job is complete or failed
                if log_line is None:
                    current = job_manager.get_job(job_id)
                    status = current.status.value if current else "unknown"
                    yield {"event": "complete", "data": status}
                    break
                yield {"event": "log", "data": log_line}
        finally:
            job_manager.remove_subscriber(job_id, queue)

    return EventSourceResponse(event_generator())


@app.get("/api/layouts/{job_id}")
async def get_layout(job_id: str):
    # Can only be called after the job is completed to get the layout data
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=409, detail=f"Job not completed: {job.status}")

    output_path = job_manager.get_output_path(job_id)
    if not output_path or not output_path.exists():
        raise HTTPException(status_code=404, detail="Layout file not found")

    # parse the layout file and return the layout data
    parsed_layout = await layout_parser.parse_layout_file(Path(output_path))
    return parsed_layout


@app.get("/api/layout/config")
async def get_layout_config():
    # load the display config from the display_config.py file
    return _load_display_config()
