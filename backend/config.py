from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent

DATA_DIR = REPO_ROOT / "data"
JOBS_DIR = BASE_DIR / "jobs"

GENERATOR_SCRIPT = Path(
    os.getenv("GENERATOR_SCRIPT", str(DATA_DIR / "generator.py"))
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
