from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Job(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    completed_at: datetime | None = None
    error: str | None = None


class GenerateRequest(BaseModel):
    cell_name: str | None = None
    config: dict[str, Any] | None = None


class Polygon(BaseModel):
    layer: str
    x0: float
    y0: float
    x1: float
    y1: float
    width: float
    height: float


class Label(BaseModel):
    layer: str
    x: float
    y: float
    text: str


class LayoutData(BaseModel):
    canvas_width: float
    canvas_height: float
    start_x: float
    start_y: float
    layer_maps: dict[str, str]
    polygons: list[Polygon]
    labels: list[Label]


class LayerConfig(BaseModel):
    color: str
    facecolor: str
    edgecolor: str
    alpha: float
    linewidth: float
    zorder: int
