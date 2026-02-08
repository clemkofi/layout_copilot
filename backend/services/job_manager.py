from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..models import GenerateRequest, Job, JobStatus


# data class to store job context
@dataclass
class JobContext:
    job: Job
    output_path: Path
    status_path: Path


class JobManager:
    def __init__(self, jobs_dir: Path, generator_script: Path) -> None:
        self.jobs_dir = jobs_dir
        self.generator_script = generator_script
        self.jobs: dict[str, JobContext] = {}
        self.processes: dict[str, asyncio.subprocess.Process] = {}
        self.subscribers: dict[str, set[asyncio.Queue[str | None]]] = {}
        self.log_history: dict[str, list[str]] = {}
        self._lock = asyncio.Lock()

    async def create_job(self, request: GenerateRequest) -> Job:
        async with self._lock:
            job_id = str(uuid.uuid4())
            job_dir = self.jobs_dir / job_id
            job_dir.mkdir(parents=True, exist_ok=True)
            output_path = job_dir / "layout.yaml"
            status_path = job_dir / "status.json"

            # create job and context and set status to pending
            job = Job(
                job_id=job_id,
                status=JobStatus.PENDING,
                created_at=datetime.now(timezone.utc),
            )
            self.jobs[job_id] = JobContext(
                job=job, output_path=output_path, status_path=status_path
            )
            self.log_history[job_id] = []
            self.subscribers[job_id] = set()
            await self._write_status(job_id)
            return job

    async def start_job(self, job_id: str, request: GenerateRequest) -> None:
        asyncio.create_task(self._run_job(job_id, request))

    # get job context by job id
    def get_job(self, job_id: str) -> Job | None:
        context = self.jobs.get(job_id)
        return context.job if context else None

    def get_output_path(self, job_id: str) -> Path | None:
        context = self.jobs.get(job_id)
        return context.output_path if context else None

    def get_history(self, job_id: str) -> list[str]:
        return list(self.log_history.get(job_id, []))

    def add_subscriber(self, job_id: str) -> asyncio.Queue[str | None]:
        queue: asyncio.Queue[str | None] = asyncio.Queue()
        self.subscribers.setdefault(job_id, set()).add(queue)
        return queue

    def remove_subscriber(self, job_id: str, queue: asyncio.Queue[str | None]) -> None:
        self.subscribers.get(job_id, set()).discard(queue)

    async def _run_job(self, job_id: str, request: GenerateRequest) -> None:
        context = self.jobs.get(job_id)
        if not context:
            return

        if not self.generator_script.exists():
            await self._fail_job(
                job_id, f"Generator script not found: {self.generator_script}"
            )
            return

        context.job.status = JobStatus.RUNNING
        await self._write_status(job_id)

        # construct generator script arguments and run it as a subprocess
        args = [
            "python",
            str(self.generator_script),
            "--output",
            str(context.output_path),
        ]
        if request.cell_name:
            args.extend(["--cell-name", request.cell_name])
        if request.config:
            config_path = context.output_path.parent / "config.json"
            config_path.write_text(json.dumps(request.config))
            args.extend(["--config", str(config_path)])

        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        self.processes[job_id] = process

        # check if the generator script is writing to stdout and working correctly
        assert process.stdout is not None

        # stream stdout from the generator script to the subscribers to be sent to the frontend
        async for raw_line in process.stdout:
            line = raw_line.decode(errors="replace").rstrip()
            await self._broadcast(job_id, line)

        # wait for the generator script to finish
        await process.wait()
        if process.returncode == 0:
            context.job.status = JobStatus.COMPLETED
            context.job.completed_at = datetime.now(timezone.utc)
        else:
            await self._fail_job(
                job_id, f"Generator exited with code {process.returncode}"
            )
            return

        await self._write_status(job_id)
        await self._broadcast(job_id, None)

    async def _broadcast(self, job_id: str, message: str | None) -> None:
        # add message to log history and broadcast to subscribers
        if message is not None:
            self.log_history.setdefault(job_id, []).append(message)
        for queue in list(self.subscribers.get(job_id, set())):
            await queue.put(message)

    async def _fail_job(self, job_id: str, error: str) -> None:
        context = self.jobs.get(job_id)
        if not context:
            return
        context.job.status = JobStatus.FAILED
        context.job.error = error
        context.job.completed_at = datetime.now(timezone.utc)

        # write status to file and broadcast failure message to subscribers
        await self._write_status(job_id)
        await self._broadcast(job_id, error)
        await self._broadcast(job_id, None)

    async def _write_status(self, job_id: str) -> None:
        context = self.jobs.get(job_id)
        if not context:
            return
        payload: dict[str, Any] = context.job.model_dump()
        context.status_path.write_text(json.dumps(payload, default=str, indent=2))
