"""
Tests for utils/language.py
"""

import pytest
from utils.language import (
    extract_languages_from_filename,
    extract_language_from_subtitle_parts,
    normalize_language_code,
    is_cjk_language,
)


class TestExtractLanguagesFromFilename:
    """Tests for extract_languages_from_filename function."""

    def test_english_codes(self):
        """Test English language code detection."""
        assert "en" in extract_languages_from_filename("ShowName.S01E01.en.srt")
        assert "en" in extract_languages_from_filename("ShowName.S01E01.eng.srt")
        assert "en" in extract_languages_from_filename("ShowName.S01E01.english.srt")

    def test_japanese_codes(self):
        """Test Japanese language code detection."""
        assert "ja" in extract_languages_from_filename("ShowName.S01E01.ja.srt")
        assert "ja" in extract_languages_from_filename("ShowName.S01E01.jpn.srt")
        assert "ja" in extract_languages_from_filename("ShowName.S01E01.japanese.srt")

    def test_chinese_codes(self):
        """Test Chinese language code detection."""
        assert "zh" in extract_languages_from_filename("ShowName.S01E01.zh.srt")
        assert "zh" in extract_languages_from_filename("ShowName.S01E01.chi.srt")
        assert "zh" in extract_languages_from_filename("ShowName.S01E01.chinese.srt")

    def test_chinese_traditional_codes(self):
        """Test Traditional Chinese variant detection."""
        assert "zh-hant" in extract_languages_from_filename("ShowName.S01E01.zh-tw.srt")
        assert "zh-hant" in extract_languages_from_filename("ShowName.S01E01.zht.srt")
        assert "zh-hant" in extract_languages_from_filename("ShowName.S01E01.traditional.srt")

    def test_multiple_languages(self):
        """Test detection of multiple languages in filename."""
        result = extract_languages_from_filename("ShowName.S01E01.en.ja.dual.srt")
        assert "en" in result
        assert "ja" in result

    def test_no_language_code(self):
        """Test files without language codes."""
        result = extract_languages_from_filename("ShowName.S01E01.srt")
        assert result == []

    def test_case_insensitive(self):
        """Test case-insensitive matching."""
        assert "en" in extract_languages_from_filename("ShowName.S01E01.EN.srt")
        assert "en" in extract_languages_from_filename("ShowName.S01E01.ENGLISH.srt")

    def test_various_subtitle_formats(self):
        """Test various subtitle file extensions."""
        assert "en" in extract_languages_from_filename("ShowName.S01E01.en.ass")
        assert "en" in extract_languages_from_filename("ShowName.S01E01.en.ssa")
        assert "en" in extract_languages_from_filename("ShowName.S01E01.en.vtt")


class TestExtractLanguageFromSubtitleParts:
    """Tests for extract_language_from_subtitle_parts function."""

    def test_standard_pattern(self):
        """Test standard language code extraction."""
        parts = ["ShowName", "S01E01", "en"]
        result = extract_language_from_subtitle_parts(parts, "ShowName.S01E01")
        assert result == "en"

    def test_chinese_variant_combined(self):
        """Test Chinese variant extraction (combined format like zh-tw)."""
        parts = ["ShowName", "S01E01", "zh-tw"]
        result = extract_language_from_subtitle_parts(parts, "ShowName.S01E01")
        assert result == "zh-TW"

    def test_chinese_variant_separate(self):
        """Test Chinese variant extraction (separate parts)."""
        parts = ["ShowName", "S01E01", "zh", "TW"]
        result = extract_language_from_subtitle_parts(parts, "ShowName.S01E01")
        assert result == "zh-TW"

    def test_no_language_code(self):
        """Test when no language code is present."""
        parts = ["ShowName", "S01E01"]
        result = extract_language_from_subtitle_parts(parts, "ShowName.S01E01")
        assert result is None

    def test_excludes_subtitle_variants(self):
        """Test that subtitle variants are not detected as languages."""
        parts = ["ShowName", "S01E01", "hi"]  # hearing impaired
        result = extract_language_from_subtitle_parts(parts, "ShowName.S01E01")
        assert result is None


class TestNormalizeLanguageCode:
    """Tests for normalize_language_code function."""

    def test_three_to_two_letter(self):
        """Test conversion of 3-letter to 2-letter codes."""
        assert normalize_language_code("eng") == "en"
        assert normalize_language_code("jpn") == "ja"
        assert normalize_language_code("chi") == "zh"
        assert normalize_language_code("zho") == "zh"
        assert normalize_language_code("spa") == "es"
        assert normalize_language_code("fra") == "fr"
        assert normalize_language_code("fre") == "fr"
        assert normalize_language_code("deu") == "de"
        assert normalize_language_code("ger") == "de"

    def test_already_normalized(self):
        """Test codes that are already 2-letter."""
        assert normalize_language_code("en") == "en"
        assert normalize_language_code("ja") == "ja"
        assert normalize_language_code("zh") == "zh"

    def test_case_insensitive(self):
        """Test case-insensitive normalization."""
        assert normalize_language_code("ENG") == "en"
        assert normalize_language_code("JPN") == "ja"

    def test_whitespace_handling(self):
        """Test whitespace is stripped."""
        assert normalize_language_code("  en  ") == "en"
        assert normalize_language_code("\teng\n") == "en"


class TestIsCjkLanguage:
    """Tests for is_cjk_language function."""

    def test_cjk_languages(self):
        """Test CJK language detection."""
        assert is_cjk_language("zh") is True
        assert is_cjk_language("ja") is True
        assert is_cjk_language("ko") is True

    def test_chinese_variants(self):
        """Test Chinese variant detection."""
        assert is_cjk_language("zh-TW") is True
        assert is_cjk_language("zh-CN") is True
        assert is_cjk_language("zh-HK") is True

    def test_non_cjk_languages(self):
        """Test non-CJK languages."""
        assert is_cjk_language("en") is False
        assert is_cjk_language("es") is False
        assert is_cjk_language("fr") is False

    def test_three_letter_codes(self):
        """Test 3-letter codes are normalized."""
        assert is_cjk_language("jpn") is True
        assert is_cjk_language("chi") is True
        assert is_cjk_language("kor") is True
