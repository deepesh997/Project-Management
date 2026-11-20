"""WorkSphere Analytics Domain Models & Schemas."""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class TaskStatus(str, Enum):
    BACKLOG = "BACKLOG"
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"
    BLOCKED = "BLOCKED"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskActivityRecord(BaseModel):
    task_id: str
    project_id: str
    org_id: str
    title: str
    status: TaskStatus
    priority: TaskPriority
    assignee_id: str
    assignee_name: str
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_hours: float = Field(default=0.0, ge=0.0)
    actual_hours: float = Field(default=0.0, ge=0.0)
    story_points: int = Field(default=1, ge=0)

    @field_validator("actual_hours", "estimated_hours", mode="before")
    @classmethod
    def parse_float(cls, v):
        if v is None or v == "":
            return 0.0
        return float(v)

    @field_validator("story_points", mode="before")
    @classmethod
    def parse_int(cls, v):
        if v is None or v == "":
            return 1
        return int(v)


class AssigneeWorkload(BaseModel):
    assignee_id: str
    assignee_name: str
    total_assigned: int
    in_progress: int
    completed: int
    overdue: int
    total_estimated_hours: float
    total_actual_hours: float


class MetricSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    overdue_tasks: int
    overdue_rate: float
    avg_cycle_time_hours: float
    avg_lead_time_hours: float
    total_estimated_hours: float
    total_actual_hours: float
    estimation_accuracy_ratio: float
    health_score: float  # Scale 0 - 100
    status_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    workload_by_assignee: List[AssigneeWorkload]
