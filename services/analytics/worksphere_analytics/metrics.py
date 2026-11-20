"""Metrics calculation engine for project health, cycle time, and productivity."""
from datetime import datetime, timezone
from typing import Dict, List
from .models import MetricSummary, AssigneeWorkload, TaskActivityRecord, TaskStatus


def compute_health_score(
    total_tasks: int,
    completed_tasks: int,
    overdue_tasks: int,
    total_estimated: float,
    total_actual: float
) -> float:
    """
    Computes a balanced health score from 0.0 to 100.0:
    - 40% Completion rate
    - 30% Overdue penalty
    - 30% Estimation accuracy (ratio of actual to estimated)
    """
    if total_tasks == 0:
        return 100.0

    completion_ratio = completed_tasks / total_tasks
    completion_component = completion_ratio * 40.0

    overdue_ratio = overdue_tasks / total_tasks
    overdue_penalty = max(0.0, 30.0 * (1.0 - (overdue_ratio * 1.5)))

    if total_estimated > 0:
        variance_ratio = abs(total_actual - total_estimated) / total_estimated
        variance_score = max(0.0, 30.0 * (1.0 - min(variance_ratio, 1.0)))
    else:
        variance_score = 30.0

    score = completion_component + overdue_penalty + variance_score
    return round(max(0.0, min(100.0, score)), 2)
