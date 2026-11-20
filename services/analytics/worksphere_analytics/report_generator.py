"""Streaming report generators for analytics output in CSV and JSON formats."""
import csv
import io
import json
from typing import Iterator
from .models import MetricSummary


def generate_metrics_json_stream(summary: MetricSummary) -> str:
    """Serializes summary to indented JSON."""
    return summary.model_dump_json(indent=2)


def generate_workload_csv_stream(summary: MetricSummary) -> str:
    """Generates CSV text representation of assignee workload."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Assignee ID", "Assignee Name", "Total Assigned", "In Progress",
        "Completed", "Overdue", "Estimated Hours", "Actual Hours"
    ])
    for w in summary.workload_by_assignee:
        writer.writerow([
            w.assignee_id, w.assignee_name, w.total_assigned, w.in_progress,
            w.completed, w.overdue, w.total_estimated_hours, w.total_actual_hours
        ])
    return output.getvalue()
