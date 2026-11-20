"""Streaming, memory-bounded processor for large task-activity exports."""
import csv
import io
import json
from datetime import datetime, timezone
from typing import Dict, Iterator, List, Optional
from .models import TaskActivityRecord, MetricSummary, AssigneeWorkload, TaskStatus
from .metrics import compute_health_score


def parse_datetime_safe(val: Optional[str]) -> Optional[datetime]:
    if not val or str(val).strip() == "":
        return None
    val_str = str(val).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(val_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def stream_csv_records(file_like) -> Iterator[TaskActivityRecord]:
    """Streams CSV rows as TaskActivityRecord objects without loading the whole file into memory."""
    reader = csv.DictReader(file_like)
    for row in reader:
        try:
            created_at = parse_datetime_safe(row.get("created_at")) or datetime.now(timezone.utc)
            updated_at = parse_datetime_safe(row.get("updated_at")) or created_at
            due_date = parse_datetime_safe(row.get("due_date"))
            completed_at = parse_datetime_safe(row.get("completed_at"))

            yield TaskActivityRecord(
                task_id=row.get("task_id") or row.get("id") or "unknown",
                project_id=row.get("project_id", "default"),
                org_id=row.get("org_id", "default"),
                title=row.get("title", "Untitled Task"),
                status=row.get("status", "TODO").upper(),
                priority=row.get("priority", "MEDIUM").upper(),
                assignee_id=row.get("assignee_id", "unassigned"),
                assignee_name=row.get("assignee_name", "Unassigned"),
                created_at=created_at,
                updated_at=updated_at,
                due_date=due_date,
                completed_at=completed_at,
                estimated_hours=float(row.get("estimated_hours") or 0.0),
                actual_hours=float(row.get("actual_hours") or 0.0),
                story_points=int(row.get("story_points") or 1),
            )
        except Exception:
            continue


def stream_json_lines(file_like) -> Iterator[TaskActivityRecord]:
    """Streams JSON lines without accumulating memory."""
    for line in file_like:
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            yield TaskActivityRecord(**data)
        except Exception:
            continue


class StreamingMetricsAccumulator:
    """Accumulates metrics incrementally with O(1) auxiliary memory footprint."""

    def __init__(self, reference_time: Optional[datetime] = None):
        self.ref_time = reference_time or datetime.now(timezone.utc)
        self.total_tasks = 0
        self.completed_tasks = 0
        self.overdue_tasks = 0
        self.total_cycle_time_seconds = 0.0
        self.completed_with_cycle_time = 0
        self.total_estimated_hours = 0.0
        self.total_actual_hours = 0.0
        self.status_distribution: Dict[str, int] = {}
        self.priority_distribution: Dict[str, int] = {}
        self.assignees: Dict[str, Dict] = {}

    def process_record(self, record: TaskActivityRecord):
        self.total_tasks += 1
        status_val = record.status.value
        priority_val = record.priority.value

        self.status_distribution[status_val] = self.status_distribution.get(status_val, 0) + 1
        self.priority_distribution[priority_val] = self.priority_distribution.get(priority_val, 0) + 1

        self.total_estimated_hours += record.estimated_hours
        self.total_actual_hours += record.actual_hours

        is_completed = (record.status == TaskStatus.DONE) or (record.completed_at is not None)
        if is_completed:
            self.completed_tasks += 1
            if record.completed_at:
                c_time = (record.completed_at - record.created_at).total_seconds()
                if c_time >= 0:
                    self.total_cycle_time_seconds += c_time
                    self.completed_with_cycle_time += 1

        is_overdue = False
        if not is_completed and record.due_date:
            if record.due_date < self.ref_time:
                is_overdue = True
                self.overdue_tasks += 1

        # Track per-assignee stats
        aid = record.assignee_id
        if aid not in self.assignees:
            self.assignees[aid] = {
                "name": record.assignee_name,
                "total": 0,
                "in_progress": 0,
                "completed": 0,
                "overdue": 0,
                "est": 0.0,
                "act": 0.0,
            }
        self.assignees[aid]["total"] += 1
        self.assignees[aid]["est"] += record.estimated_hours
        self.assignees[aid]["act"] += record.actual_hours
        if is_completed:
            self.assignees[aid]["completed"] += 1
        elif record.status == TaskStatus.IN_PROGRESS:
            self.assignees[aid]["in_progress"] += 1
        if is_overdue:
            self.assignees[aid]["overdue"] += 1

    def summarize(self) -> MetricSummary:
        completion_rate = (self.completed_tasks / self.total_tasks) if self.total_tasks > 0 else 0.0
        overdue_rate = (self.overdue_tasks / self.total_tasks) if self.total_tasks > 0 else 0.0
        avg_cycle_hours = (
            (self.total_cycle_time_seconds / (self.completed_with_cycle_time * 3600))
            if self.completed_with_cycle_time > 0
            else 0.0
        )
        accuracy = (
            (self.total_actual_hours / self.total_estimated_hours)
            if self.total_estimated_hours > 0
            else 1.0
        )
        health_score = compute_health_score(
            self.total_tasks,
            self.completed_tasks,
            self.overdue_tasks,
            self.total_estimated_hours,
            self.total_actual_hours,
        )

        workload_list = [
            AssigneeWorkload(
                assignee_id=aid,
                assignee_name=data["name"],
                total_assigned=data["total"],
                in_progress=data["in_progress"],
                completed=data["completed"],
                overdue=data["overdue"],
                total_estimated_hours=round(data["est"], 2),
                total_actual_hours=round(data["act"], 2),
            )
            for aid, data in self.assignees.items()
        ]

        return MetricSummary(
            total_tasks=self.total_tasks,
            completed_tasks=self.completed_tasks,
            completion_rate=round(completion_rate, 4),
            overdue_tasks=self.overdue_tasks,
            overdue_rate=round(overdue_rate, 4),
            avg_cycle_time_hours=round(avg_cycle_hours, 2),
            avg_lead_time_hours=round(avg_cycle_hours, 2),
            total_estimated_hours=round(self.total_estimated_hours, 2),
            total_actual_hours=round(self.total_actual_hours, 2),
            estimation_accuracy_ratio=round(accuracy, 2),
            health_score=health_score,
            status_distribution=self.status_distribution,
            priority_distribution=self.priority_distribution,
            workload_by_assignee=workload_list,
        )
