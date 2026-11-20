"""Tests for analytics metrics and health score formulas."""
from worksphere_analytics.metrics import compute_health_score


def test_health_score_perfect():
    # 100% completed, 0 overdue, exact estimation
    score = compute_health_score(
        total_tasks=10,
        completed_tasks=10,
        overdue_tasks=0,
        total_estimated=50.0,
        total_actual=50.0
    )
    assert score == 100.0


def test_health_score_poor_performance():
    # 0 completed, all overdue, heavy estimation overrun
    score = compute_health_score(
        total_tasks=10,
        completed_tasks=0,
        overdue_tasks=10,
        total_estimated=50.0,
        total_actual=150.0
    )
    assert score < 30.0


def test_health_score_empty_project():
    # Project with no tasks should default safely to 100
    score = compute_health_score(
        total_tasks=0,
        completed_tasks=0,
        overdue_tasks=0,
        total_estimated=0.0,
        total_actual=0.0
    )
    assert score == 100.0
