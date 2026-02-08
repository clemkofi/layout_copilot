from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from backend.config import GENERATOR_SCRIPT, JOBS_DIR
from backend.models import GenerateRequest, JobStatus
from backend.services.job_manager import JobManager


async def _wait_for_completion(job_manager: JobManager, job_ids: list[str]) -> None:
    pending = set(job_ids)
    while pending:
        await asyncio.sleep(0.1)
        finished = set()
        for job_id in pending:
            job = job_manager.get_job(job_id)
            if not job:
                finished.add(job_id)
                continue
            if job.status in {JobStatus.COMPLETED, JobStatus.FAILED}:
                finished.add(job_id)
        pending -= finished


async def _stream_logs(job_manager: JobManager, job_id: str) -> None:
    queue = job_manager.add_subscriber(job_id)
    try:
        for line in job_manager.get_history(job_id):
            print(f"[{job_id}] {line}")
        while True:
            log_line = await queue.get()
            if log_line is None:
                break
            print(f"[{job_id}] {log_line}")
    finally:
        job_manager.remove_subscriber(job_id, queue)


async def main() -> None:
    parser = argparse.ArgumentParser(description="JobManager test runner.")
    parser.add_argument("--jobs", type=int, default=3, help="Number of jobs to run.")
    parser.add_argument(
        "--generator",
        type=str,
        default=str(GENERATOR_SCRIPT),
        help="Path to generator script.",
    )
    args = parser.parse_args()

    generator_path = Path(args.generator).resolve()
    job_manager = JobManager(JOBS_DIR, generator_path)

    job_ids: list[str] = []
    log_tasks: list[asyncio.Task[None]] = []
    for index in range(args.jobs):
        request = GenerateRequest(cell_name=f"test_cell_{index + 1}")
        job = await job_manager.create_job(request)
        log_tasks.append(asyncio.create_task(_stream_logs(job_manager, job.job_id)))
        await job_manager.start_job(job.job_id, request)
        job_ids.append(job.job_id)
        print(f"Started job {job.job_id}")

    await _wait_for_completion(job_manager, job_ids)
    await asyncio.gather(*log_tasks)

    print("All jobs completed.")
    for job_id in job_ids:
        job = job_manager.get_job(job_id)
        if job:
            print(f"{job_id}: {job.status}")


if __name__ == "__main__":
    asyncio.run(main())
