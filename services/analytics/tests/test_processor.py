"""Tests for streaming task processor and accumulator."""
import io
from datetime import datetime, timezone, timedelta
from worksphere_analytics.models import TaskActivityRecord, TaskStatus, TaskPriority
from worksphere_analytics.processor import StreamingMetricsAccumulator, stream_csv_records, stream_json_lines


def test_streaming_csv_records():
    csv_data = """task_id,project_id,org_id,title,status,priority,assignee_id,assignee_name,created_at,due_date,completed_at,estimated_hours,actual_hours,story_points
t-1,p-1,org-1,Task 1,DONE,HIGH,u-1,Alice,2026-01-01T00:00:00Z,2026-01-05T00:00:00Z,2026-01-04T00:00:00Z,10,8,5
t-2,p-1,org-1,Task 2,TODO,LOW,u-2,Bob,2026-01-02T00:00:00Z,2026-01-10T00:00:00Z,,5,0,2
"""
    stream = io.StringIO(csv_data)
    records = list(stream_csv_records(stream))
    assert len(records) == 2
    assert records[0].task_id == "t-1"
    assert records[0].status == TaskStatus.DONE
    assert records[0].priority == TaskPriority.HIGH
    assert records[0].actual_hours == 8.0
    assert records[1].assignee_name == "Bob"


def test_streaming_accumulator_and_health():
    now = datetime(2026, 2, 1, tzinfo=timezone.utc)
    acc = StreamingMetricsAccumulator(reference_time=now)

    # 1. Completed task on time
    rec1 = TaskActivityRecord(
        task_id="t-1", project_id="p-1", org_id="org-1", title="Task 1",
        status=TaskStatus.DONE, priority=TaskPriority.HIGH,
        assignee_id="u-1", assignee_name="Alice",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 5, tzinfo=timezone.utc),
        due_date=datetime(2026, 1, 10, tzinfo=timezone.utc),
        completed_at=datetime(2026, 1, 5, tzinfo=timezone.utc),
        estimated_hours=10.0, actual_hours=10.0, story_points=3
    )

    # 2. Overdue task
    rec2 = TaskActivityRecord(
        task_id="t-2", project_id="p-1", org_id="org-1", title="Task 2",
        status=TaskStatus.IN_PROGRESS, priority=TaskPriority.URGENT,
        assignee_id="u-2", assignee_name="Bob",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 15, tzinfo=timezone.utc),
        due_date=datetime(2026, 1, 20, tzinfo=timezone.utc), # passed ref_time Feb 1
        completed_at=None,
        estimated_hours=20.0, actual_hours=25.0, story_points=5
    )

    acc.process_record(rec1)
    acc.process_record(rec2)

    summary = acc.summarize()
    assert summary.total_tasks == 2
    assert summary.completed_tasks == 1
    assert summary.overdue_tasks == 1
    assert summary.completion_rate == 0.5
    assert summary.total_estimated_hours == 30.0
    assert summary.total_actual_hours == 35.0
    assert len(summary.workload_by_assignee) == 2
    assert 0.0 <= summary.health_score <= 100.0


def test_malformed_csv_rows_graceful_skipping():
    corrupted_csv = """task_id,project_id,org_id,title,status,priority,assignee_id,assignee_name,created_at,due_date,completed_at,estimated_hours,actual_hours,story_points
t-good,p-1,org-1,Good Task,DONE,MEDIUM,u-1,Alice,2026-01-01T00:00:00Z,,,5,5,1
t-bad,,,,,BAD_STATUS,,,,not-a-number,not-a-number,bad
"""
    stream = io.StringIO(corrupted_csv)
    records = list(stream_csv_records(stream))
    # Should at least process the valid record without crashing
    assert len(records) >= 1
    assert records[0].task_id == "t-good"
