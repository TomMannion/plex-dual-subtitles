"""
Tests for services/subtitle_service.py

Tests the subtitle utility methods that don't require Plex integration.
"""

import pytest
import tempfile
from pathlib import Path

from services.subtitle_service import SubtitleService


@pytest.fixture
def subtitle_service():
    """Create a fresh SubtitleService instance."""
    return SubtitleService()


@pytest.fixture
def sample_srt_content():
    """Sample SRT subtitle content."""
    return """1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,000 --> 00:00:08,000
This is a test subtitle.

3
00:00:10,000 --> 00:00:15,000
Testing encoding detection.
"""


@pytest.fixture
def sample_srt_file(sample_srt_content):
    """Create a temporary SRT file."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
        f.write(sample_srt_content)
        return f.name


class TestDetectEncoding:
    """Tests for detect_encoding method."""

    def test_detects_utf8(self, subtitle_service, sample_srt_file):
        """Test detection of UTF-8 encoding."""
        encoding = subtitle_service.detect_encoding(sample_srt_file)
        # chardet may return 'ascii' for pure ASCII content
        assert encoding.lower() in ['utf-8', 'ascii']
        Path(sample_srt_file).unlink()

    def test_detects_non_ascii_utf8(self, subtitle_service):
        """Test detection of UTF-8 with non-ASCII characters."""
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.srt', delete=False) as f:
            content = "1\n00:00:01,000 --> 00:00:02,000\nこんにちは\n"
            f.write(content.encode('utf-8'))
            temp_path = f.name

        encoding = subtitle_service.detect_encoding(temp_path)
        assert encoding.lower() == 'utf-8'
        Path(temp_path).unlink()


class TestLoadSubtitle:
    """Tests for load_subtitle method."""

    def test_loads_srt_file(self, subtitle_service, sample_srt_file):
        """Test loading a valid SRT file."""
        subs = subtitle_service.load_subtitle(sample_srt_file)

        assert len(subs) == 3
        assert "Hello, world!" in subs[0].text
        Path(sample_srt_file).unlink()

    def test_loads_with_explicit_encoding(self, subtitle_service, sample_srt_file):
        """Test loading with explicit encoding."""
        subs = subtitle_service.load_subtitle(sample_srt_file, encoding='utf-8')

        assert len(subs) == 3
        Path(sample_srt_file).unlink()

    def test_loads_japanese_subtitles(self, subtitle_service):
        """Test loading subtitles with Japanese text."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:02,000\nこんにちは世界\n")
            temp_path = f.name

        subs = subtitle_service.load_subtitle(temp_path)
        assert len(subs) == 1
        assert "こんにちは" in subs[0].text
        Path(temp_path).unlink()


class TestTimesOverlap:
    """Tests for _times_overlap method."""

    def test_overlapping_times(self, subtitle_service):
        """Test detection of overlapping subtitle times."""
        class MockLine:
            def __init__(self, start, end):
                self.start = start
                self.end = end

        line1 = MockLine(1000, 3000)  # 1s - 3s
        line2 = MockLine(2000, 4000)  # 2s - 4s (overlaps)

        assert subtitle_service._times_overlap(line1, line2) is True

    def test_non_overlapping_times(self, subtitle_service):
        """Test non-overlapping subtitle times."""
        class MockLine:
            def __init__(self, start, end):
                self.start = start
                self.end = end

        line1 = MockLine(1000, 2000)  # 1s - 2s
        line2 = MockLine(3000, 4000)  # 3s - 4s (no overlap)

        assert subtitle_service._times_overlap(line1, line2) is False

    def test_adjacent_times(self, subtitle_service):
        """Test adjacent subtitle times (touching but not overlapping)."""
        class MockLine:
            def __init__(self, start, end):
                self.start = start
                self.end = end

        line1 = MockLine(1000, 2000)  # 1s - 2s
        line2 = MockLine(2000, 3000)  # 2s - 3s (touching)

        # Touching counts as overlap with this implementation
        assert subtitle_service._times_overlap(line1, line2) is True


class TestCreateDualSubtitle:
    """Tests for dual subtitle creation."""

    def test_creates_ass_dual_subtitle(self, subtitle_service):
        """Test creating ASS format dual subtitle."""
        # Create primary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nHello\n")
            primary_path = f.name

        # Create secondary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nBonjour\n")
            secondary_path = f.name

        # Create output path
        with tempfile.NamedTemporaryFile(suffix='.ass', delete=False) as f:
            output_path = f.name

        try:
            result = subtitle_service.create_dual_subtitle(
                primary_path,
                secondary_path,
                output_path,
                enable_sync=False,
                enable_language_detection=False
            )

            assert result['success'] is True
            assert result['format'] == 'ASS'
            assert result['primary_lines'] == 1
            assert result['secondary_lines'] == 1
            assert Path(output_path).exists()
        finally:
            Path(primary_path).unlink(missing_ok=True)
            Path(secondary_path).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)

    def test_creates_srt_dual_subtitle(self, subtitle_service):
        """Test creating SRT format dual subtitle."""
        # Create primary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nHello\n")
            primary_path = f.name

        # Create secondary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nBonjour\n")
            secondary_path = f.name

        # Create output path
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as f:
            output_path = f.name

        try:
            result = subtitle_service.create_dual_subtitle(
                primary_path,
                secondary_path,
                output_path,
                enable_sync=False,
                enable_language_detection=False
            )

            assert result['success'] is True
            assert result['format'] == 'SRT'
            assert result['primary_lines'] == 1
            assert result['secondary_lines'] == 1
            assert Path(output_path).exists()
        finally:
            Path(primary_path).unlink(missing_ok=True)
            Path(secondary_path).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)


class TestAdjustSubtitleTiming:
    """Tests for adjust_subtitle_timing method."""

    def test_delays_subtitles(self, subtitle_service, sample_srt_file):
        """Test delaying subtitles by positive offset."""
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as f:
            output_path = f.name

        try:
            result = subtitle_service.adjust_subtitle_timing(
                sample_srt_file,
                offset_ms=2000,  # 2 second delay
                output_path=output_path
            )

            assert result['success'] is True
            assert result['offset_applied_ms'] == 2000

            # Verify the adjustment
            adjusted = subtitle_service.load_subtitle(output_path)
            assert adjusted[0].start == 3000  # Was 1000, now 3000
        finally:
            Path(sample_srt_file).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)

    def test_advances_subtitles(self, subtitle_service, sample_srt_file):
        """Test advancing subtitles by negative offset."""
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as f:
            output_path = f.name

        try:
            result = subtitle_service.adjust_subtitle_timing(
                sample_srt_file,
                offset_ms=-500,  # 0.5 second advance
                output_path=output_path
            )

            assert result['success'] is True
            assert result['offset_applied_ms'] == -500

            # Verify the adjustment
            adjusted = subtitle_service.load_subtitle(output_path)
            assert adjusted[0].start == 500  # Was 1000, now 500
        finally:
            Path(sample_srt_file).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)

    def test_clamps_negative_times(self, subtitle_service, sample_srt_file):
        """Test that times don't go negative."""
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as f:
            output_path = f.name

        try:
            result = subtitle_service.adjust_subtitle_timing(
                sample_srt_file,
                offset_ms=-5000,  # 5 second advance (more than first subtitle)
                output_path=output_path
            )

            assert result['success'] is True

            # Verify times don't go negative
            adjusted = subtitle_service.load_subtitle(output_path)
            assert adjusted[0].start >= 0
            assert adjusted[0].end >= 0
        finally:
            Path(sample_srt_file).unlink(missing_ok=True)
            Path(output_path).unlink(missing_ok=True)


class TestPreviewDualSubtitle:
    """Tests for preview_dual_subtitle method."""

    def test_generates_preview(self, subtitle_service):
        """Test generating a dual subtitle preview."""
        # Create primary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nLine 1\n\n2\n00:00:04,000 --> 00:00:06,000\nLine 2\n")
            primary_path = f.name

        # Create secondary subtitle
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:03,000\nLinea 1\n\n2\n00:00:04,000 --> 00:00:06,000\nLinea 2\n")
            secondary_path = f.name

        try:
            preview = subtitle_service.preview_dual_subtitle(
                primary_path,
                secondary_path,
                preview_lines=2
            )

            assert 'primary' in preview
            assert 'secondary' in preview
            assert 'config' in preview
            assert len(preview['primary']) == 2
            assert len(preview['secondary']) == 2
            assert 'Line 1' in preview['primary'][0]['text']
            assert 'Linea 1' in preview['secondary'][0]['text']
        finally:
            Path(primary_path).unlink(missing_ok=True)
            Path(secondary_path).unlink(missing_ok=True)

    def test_limits_preview_lines(self, subtitle_service, sample_srt_file):
        """Test that preview respects line limit."""
        # Create secondary subtitle (reuse same content)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:02,000\nA\n\n2\n00:00:03,000 --> 00:00:04,000\nB\n")
            secondary_path = f.name

        try:
            preview = subtitle_service.preview_dual_subtitle(
                sample_srt_file,  # Has 3 lines
                secondary_path,
                preview_lines=1
            )

            assert len(preview['primary']) == 1
            assert len(preview['secondary']) == 1
        finally:
            Path(sample_srt_file).unlink(missing_ok=True)
            Path(secondary_path).unlink(missing_ok=True)
