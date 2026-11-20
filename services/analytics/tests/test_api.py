"""Tests for FastAPI Analytics Endpoints."""
import pytest
from fastapi.testclient import TestClient
from api.main import app, API_KEY_SECRET

client = TestClient(app)


def test_healthz_and_readyz():
    res1 = client.get("/healthz")
    assert res1.status_code == 200
    assert res1.json()["status"] == "ok"

    res2 = client.get("/readyz")
    assert res2.status_code == 200
    assert res2.json()["service"] == "worksphere-analytics"


def test_get_project_analytics_unauthorized():
    res = client.get("/api/v1/analytics/projects/proj-101?org_id=org-alpha")
    assert res.status_code == 401


def test_get_project_analytics_authorized():
    headers = {"X-API-Key": API_KEY_SECRET}
    res = client.get("/api/v1/analytics/projects/proj-101?org_id=org-alpha", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "health_score" in data
    assert "total_tasks" in data
    assert data["total_tasks"] > 0
    assert "workload_by_assignee" in data


def test_process_export_csv():
    headers = {"X-API-Key": API_KEY_SECRET}
    csv_bytes = b"""task_id,project_id,org_id,title,status,priority,assignee_id,assignee_name,created_at,due_date,completed_at,estimated_hours,actual_hours,story_points
t-1,p-1,org-1,Task 1,DONE,HIGH,u-1,Alice,2026-01-01T00:00:00Z,2026-01-05T00:00:00Z,2026-01-04T00:00:00Z,10,8,5
"""
    files = {"file": ("export.csv", csv_bytes, "text/csv")}
    res = client.post("/api/v1/analytics/process-export", headers=headers, files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["total_tasks"] == 1
    assert data["completed_tasks"] == 1
