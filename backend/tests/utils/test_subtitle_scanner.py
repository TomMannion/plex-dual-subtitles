"""
Tests for utils/subtitle_scanner.py
"""

import pytest
import tempfile
from pathlib import Path

from utils.subtitle_scanner import (
    scan_directory_for_subtitles,
    parse_subtitle_filename,
    detect_dual_subtitle,
    SubtitleFileInfo,
    SUBTITLE_EXTENSIONS,
)


class TestSubtitleExtensions:
    """Tests for SUBTITLE_EXTENSIONS constant."""

    def test_common_formats_supported(self):
        """Test that common subtitle formats are supported."""
        assert '.srt' in SUBTITLE_EXTENSIONS
        assert '.ass' in SUBTITLE_EXTENSIONS
        assert '.ssa' in SUBTITLE_EXTENSIONS
        assert '.vtt' in SUBTITLE_EXTENSIONS
        assert '.sub' in SUBTITLE_EXTENSIONS


class TestDetectDualSubtitle:
    """Tests for detect_dual_subtitle function."""

    def test_dual_subtitle_with_languages(self):
        """Test detecting dual subtitle with language codes."""
        parts = ["ShowName", "S01E01", "dual", "ja", "en"]
        is_dual, languages = detect_dual_subtitle(parts)

        assert is_dual is True
        assert languages == ["ja", "en"]

    def test_dual_subtitle_without_languages(self):
        """Test detecting dual subtitle without extractable languages."""
        parts = ["ShowName", "S01E01", "dual"]
        is_dual, languages = detect_dual_subtitle(parts)

        assert is_dual is True
        assert languages is None

    def test_not_dual_subtitle(self):
        """Test non-dual subtitle detection."""
        parts = ["ShowName", "S01E01", "en"]
        is_dual, languages = detect_dual_subtitle(parts)

        assert is_dual is False
        assert languages is None

    def test_dual_case_insensitive(self):
        """Test that 'dual' detection is case insensitive."""
        parts = ["ShowName", "S01E01", "DUAL", "ja", "en"]
        is_dual, languages = detect_dual_subtitle(parts)

        assert is_dual is True
        assert languages == ["ja", "en"]


class TestParseSubtitleFilename:
    """Tests for parse_subtitle_filename function."""

    def test_simple_language_code(self):
        """Test parsing simple language code."""
        with tempfile.TemporaryDirectory() as tmpdir:
            subtitle_path = Path(tmpdir) / "ShowName.S01E01.en.srt"
            subtitle_path.touch()

            result = parse_subtitle_filename(subtitle_path, "ShowName.S01E01")

            assert result is not None
            assert result.language_code == "en"
            assert result.format == "SRT"
            assert result.is_dual_subtitle is False

    def test_dual_subtitle_file(self):
        """Test parsing dual subtitle file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            subtitle_path = Path(tmpdir) / "ShowName.S01E01.dual.ja.en.ass"
            subtitle_path.touch()

            result = parse_subtitle_filename(subtitle_path, "ShowName.S01E01")

            assert result is not None
            assert result.is_dual_subtitle is True
            assert result.dual_languages == ["ja", "en"]
            assert result.format == "ASS"

    def test_chinese_variant(self):
        """Test parsing Chinese variant language code."""
        with tempfile.TemporaryDirectory() as tmpdir:
            subtitle_path = Path(tmpdir) / "ShowName.S01E01.zh-tw.srt"
            subtitle_path.touch()

            result = parse_subtitle_filename(subtitle_path, "ShowName.S01E01")

            assert result is not None
            assert result.language_code == "zh-TW"

    def test_no_language_code(self):
        """Test parsing file without language code."""
        with tempfile.TemporaryDirectory() as tmpdir:
            subtitle_path = Path(tmpdir) / "ShowName.S01E01.srt"
            subtitle_path.touch()

            result = parse_subtitle_filename(subtitle_path, "ShowName.S01E01")

            assert result is not None
            assert result.language_code is None


class TestScanDirectoryForSubtitles:
    """Tests for scan_directory_for_subtitles function."""

    def test_finds_matching_subtitles(self):
        """Test that matching subtitles are found."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test files
            (Path(tmpdir) / "ShowName.S01E01.mkv").touch()  # Video
            (Path(tmpdir) / "ShowName.S01E01.en.srt").touch()
            (Path(tmpdir) / "ShowName.S01E01.ja.srt").touch()

            results = scan_directory_for_subtitles(tmpdir, "ShowName.S01E01")

            assert len(results) == 2
            filenames = [r.file_name for r in results]
            assert "ShowName.S01E01.en.srt" in filenames
            assert "ShowName.S01E01.ja.srt" in filenames

    def test_ignores_non_matching_subtitles(self):
        """Test that non-matching subtitles are ignored."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test files
            (Path(tmpdir) / "ShowName.S01E01.en.srt").touch()  # Match
            (Path(tmpdir) / "ShowName.S01E02.en.srt").touch()  # Different episode
            (Path(tmpdir) / "OtherShow.S01E01.en.srt").touch()  # Different show

            results = scan_directory_for_subtitles(tmpdir, "ShowName.S01E01")

            assert len(results) == 1
            assert results[0].file_name == "ShowName.S01E01.en.srt"

    def test_ignores_non_subtitle_files(self):
        """Test that non-subtitle files are ignored."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test files
            (Path(tmpdir) / "ShowName.S01E01.en.srt").touch()  # Subtitle
            (Path(tmpdir) / "ShowName.S01E01.en.txt").touch()  # Not subtitle
            (Path(tmpdir) / "ShowName.S01E01.nfo").touch()  # Not subtitle

            results = scan_directory_for_subtitles(tmpdir, "ShowName.S01E01")

            assert len(results) == 1
            assert results[0].file_name == "ShowName.S01E01.en.srt"

    def test_handles_nonexistent_directory(self):
        """Test handling of nonexistent directory."""
        results = scan_directory_for_subtitles("/nonexistent/path", "ShowName.S01E01")
        assert results == []

    def test_finds_all_subtitle_formats(self):
        """Test that all supported formats are found."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test files for each format
            for ext in ['.srt', '.ass', '.ssa', '.vtt', '.sub']:
                (Path(tmpdir) / f"ShowName.S01E01.en{ext}").touch()

            results = scan_directory_for_subtitles(tmpdir, "ShowName.S01E01")

            assert len(results) == 5
            formats = {r.format for r in results}
            assert formats == {"SRT", "ASS", "SSA", "VTT", "SUB"}


class TestSubtitleFileInfo:
    """Tests for SubtitleFileInfo dataclass."""

    def test_to_dict(self):
        """Test to_dict conversion."""
        info = SubtitleFileInfo(
            file_path="/path/to/subtitle.srt",
            file_name="subtitle.srt",
            language_code="en",
            format="SRT",
            is_dual_subtitle=False,
            dual_languages=None,
        )

        result = info.to_dict()

        assert result['file_path'] == "/path/to/subtitle.srt"
        assert result['file_name'] == "subtitle.srt"
        assert result['language_code'] == "en"
        assert result['format'] == "SRT"
        assert result['is_dual_subtitle'] is False
        assert result['dual_languages'] is None

    def test_to_dict_dual_subtitle(self):
        """Test to_dict for dual subtitle."""
        info = SubtitleFileInfo(
            file_path="/path/to/subtitle.ass",
            file_name="subtitle.ass",
            language_code=None,
            format="ASS",
            is_dual_subtitle=True,
            dual_languages=["ja", "en"],
        )

        result = info.to_dict()

        assert result['is_dual_subtitle'] is True
        assert result['dual_languages'] == ["ja", "en"]
        assert result['language_code'] is None
