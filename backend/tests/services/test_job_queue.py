"""
Tests for services/job_queue.py
"""

import pytest
import time
from datetime import datetime, timedelta

from services.job_queue import (
    JobQueue,
    JobStatus,
    JobType,
    Job,
    JobProgress,
)


@pytest.fixture
def job_queue():
    """Create a fresh JobQueue instance for testing."""
    return JobQueue(max_concurrent_jobs=2)


class TestJobProgress:
    """Tests for JobProgress dataclass."""

    def test_default_values(self):
        """Test default values are set correctly."""
        progress = JobProgress()

        assert progress.current_step == ""
        assert progress.current_item == ""
        assert progress.processed == 0
        assert progress.total == 0
        assert progress.percentage == 0.0
        assert progress.details == {}

    def test_auto_percentage_calculation(self):
        """Test percentage is auto-calculated from processed/total."""
        progress = JobProgress(processed=5, total=10)
        assert progress.percentage == 50.0

    def test_zero_total_no_division_error(self):
        """Test no division by zero when total is 0."""
        progress = JobProgress(processed=5, total=0)
        assert progress.percentage == 0.0


class TestJob:
    """Tests for Job dataclass."""

    def test_to_dict_serialization(self):
        """Test job can be serialized to dict."""
        job = Job(
            id="test-123",
            type=JobType.BULK_DUAL_SUBTITLE,
            title="Test Job",
            description="A test job",
            status=JobStatus.PENDING,
            created_at=datetime(2024, 1, 1, 12, 0, 0)
        )

        result = job.to_dict()

        assert result['id'] == "test-123"
        assert result['type'] == "bulk_dual_subtitle"
        assert result['title'] == "Test Job"
        assert result['status'] == "pending"
        assert result['created_at'] == "2024-01-01T12:00:00"

    def test_to_dict_with_progress(self):
        """Test job serialization includes progress."""
        job = Job(
            id="test-123",
            type=JobType.BULK_DUAL_SUBTITLE,
            title="Test Job",
            description="A test job",
            status=JobStatus.RUNNING,
            created_at=datetime.now(),
            progress=JobProgress(
                current_step="Processing",
                processed=3,
                total=10
            )
        )

        result = job.to_dict()

        assert result['progress']['current_step'] == "Processing"
        assert result['progress']['processed'] == 3
        assert result['progress']['total'] == 10
        assert result['progress']['percentage'] == 30.0


class TestJobQueue:
    """Tests for JobQueue."""

    def test_create_job(self, job_queue):
        """Test creating a new job."""
        job_id = job_queue.create_job(
            job_type=JobType.BULK_DUAL_SUBTITLE,
            title="Bulk Subtitles",
            description="Creating dual subtitles",
            parameters={'show_id': '123'}
        )

        assert job_id is not None
        assert len(job_id) == 36  # UUID format

        job = job_queue.get_job(job_id)
        assert job is not None
        assert job.title == "Bulk Subtitles"
        assert job.status == JobStatus.PENDING

    def test_get_nonexistent_job(self, job_queue):
        """Test getting a job that doesn't exist."""
        job = job_queue.get_job("nonexistent-id")
        assert job is None

    def test_get_all_jobs(self, job_queue):
        """Test getting all jobs."""
        job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Job 1", "Desc 1",
            {}
        )
        job_queue.create_job(
            JobType.SINGLE_SUBTITLE_SYNC,
            "Job 2", "Desc 2",
            {}
        )

        jobs = job_queue.get_all_jobs()
        assert len(jobs) == 2

    def test_get_all_jobs_with_status_filter(self, job_queue):
        """Test filtering jobs by status."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Job 1", "Desc 1",
            {}
        )

        # Mark one as completed directly for testing
        job_queue.jobs[job_id].status = JobStatus.COMPLETED

        job_queue.create_job(
            JobType.SINGLE_SUBTITLE_SYNC,
            "Job 2", "Desc 2",
            {}
        )

        pending_jobs = job_queue.get_all_jobs(JobStatus.PENDING)
        assert len(pending_jobs) == 1
        assert pending_jobs[0].title == "Job 2"

        completed_jobs = job_queue.get_all_jobs(JobStatus.COMPLETED)
        assert len(completed_jobs) == 1
        assert completed_jobs[0].title == "Job 1"

    def test_get_active_jobs(self, job_queue):
        """Test getting active (pending/running) jobs."""
        job_id1 = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Pending Job", "Desc",
            {}
        )
        job_id2 = job_queue.create_job(
            JobType.SINGLE_SUBTITLE_SYNC,
            "Running Job", "Desc",
            {}
        )
        job_id3 = job_queue.create_job(
            JobType.SUBTITLE_EXTRACTION,
            "Completed Job", "Desc",
            {}
        )

        # Set statuses
        job_queue.jobs[job_id2].status = JobStatus.RUNNING
        job_queue.jobs[job_id3].status = JobStatus.COMPLETED

        active = job_queue.get_active_jobs()
        assert len(active) == 2
        titles = {j.title for j in active}
        assert "Pending Job" in titles
        assert "Running Job" in titles
        assert "Completed Job" not in titles

    def test_cancel_pending_job(self, job_queue):
        """Test cancelling a pending job."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )

        result = job_queue.cancel_job(job_id)
        assert result is True

        job = job_queue.get_job(job_id)
        assert job.status == JobStatus.CANCELLED
        assert job.completed_at is not None

    def test_cancel_nonexistent_job(self, job_queue):
        """Test cancelling a job that doesn't exist."""
        result = job_queue.cancel_job("nonexistent-id")
        assert result is False

    def test_cancel_completed_job(self, job_queue):
        """Test that completed jobs cannot be cancelled."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )
        job_queue.jobs[job_id].status = JobStatus.COMPLETED

        result = job_queue.cancel_job(job_id)
        assert result is False

    def test_is_job_cancelled(self, job_queue):
        """Test checking cancellation flag."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )

        # Initially not cancelled
        assert job_queue.is_job_cancelled(job_id) is False

        # Mark running and set cancelled flag
        job_queue.jobs[job_id].status = JobStatus.RUNNING
        job_queue.jobs[job_id].metadata['cancelled'] = True

        assert job_queue.is_job_cancelled(job_id) is True

    def test_complete_job(self, job_queue):
        """Test completing a job."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )
        job_queue.jobs[job_id].status = JobStatus.RUNNING

        job_queue.complete_job(job_id, {'success': True, 'count': 5})

        job = job_queue.get_job(job_id)
        assert job.status == JobStatus.COMPLETED
        assert job.result == {'success': True, 'count': 5}
        assert job.progress.percentage == 100.0
        assert job.completed_at is not None

    def test_fail_job(self, job_queue):
        """Test failing a job."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )
        job_queue.jobs[job_id].status = JobStatus.RUNNING

        job_queue.fail_job(job_id, "Something went wrong")

        job = job_queue.get_job(job_id)
        assert job.status == JobStatus.FAILED
        assert job.error == "Something went wrong"
        assert job.completed_at is not None

    def test_update_job_progress(self, job_queue):
        """Test updating job progress."""
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Test Job", "Desc",
            {}
        )
        job_queue.jobs[job_id].status = JobStatus.RUNNING

        job_queue.update_job_progress(job_id, {
            'current_step': 'Processing',
            'current_item': 'Episode 5',
            'processed': 5,
            'total': 10,
            'estimated_time_remaining': '2m 30s'
        })

        job = job_queue.get_job(job_id)
        assert job.progress.current_step == 'Processing'
        assert job.progress.current_item == 'Episode 5'
        assert job.progress.processed == 5
        assert job.progress.total == 10
        assert job.progress.percentage == 50.0
        assert job.progress.estimated_time_remaining == '2m 30s'

    def test_cleanup_old_jobs(self, job_queue):
        """Test cleaning up old completed/failed jobs."""
        # Create and complete a job
        job_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Old Job", "Desc",
            {}
        )
        job_queue.jobs[job_id].status = JobStatus.COMPLETED
        job_queue.jobs[job_id].completed_at = datetime.now() - timedelta(hours=25)

        # Create a recent job
        recent_id = job_queue.create_job(
            JobType.BULK_DUAL_SUBTITLE,
            "Recent Job", "Desc",
            {}
        )
        job_queue.jobs[recent_id].status = JobStatus.COMPLETED
        job_queue.jobs[recent_id].completed_at = datetime.now()

        # Cleanup
        removed = job_queue.cleanup_old_jobs()

        assert removed == 1
        assert job_queue.get_job(job_id) is None
        assert job_queue.get_job(recent_id) is not None


class TestJobTypes:
    """Tests for job type enums."""

    def test_job_status_values(self):
        """Test JobStatus enum values."""
        assert JobStatus.PENDING.value == "pending"
        assert JobStatus.RUNNING.value == "running"
        assert JobStatus.COMPLETED.value == "completed"
        assert JobStatus.FAILED.value == "failed"
        assert JobStatus.CANCELLED.value == "cancelled"

    def test_job_type_values(self):
        """Test JobType enum values."""
        assert JobType.BULK_DUAL_SUBTITLE.value == "bulk_dual_subtitle"
        assert JobType.SINGLE_SUBTITLE_SYNC.value == "single_subtitle_sync"
        assert JobType.SUBTITLE_EXTRACTION.value == "subtitle_extraction"
