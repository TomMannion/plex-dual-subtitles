"""
Tests for services/language_detector.py
"""

import pytest
import tempfile
from pathlib import Path

from services.language_detector import (
    SimpleLanguageDetector,
    Language,
    LanguageDetectionResult,
)


@pytest.fixture
def detector():
    """Create a fresh SimpleLanguageDetector instance."""
    return SimpleLanguageDetector()


class TestLanguageEnum:
    """Tests for Language enum."""

    def test_language_values(self):
        """Test Language enum values."""
        assert Language.ENGLISH.value == "en"
        assert Language.JAPANESE.value == "ja"
        assert Language.CHINESE_SIMPLIFIED.value == "zh-CN"
        assert Language.CHINESE_TRADITIONAL.value == "zh-TW"
        assert Language.KOREAN.value == "ko"
        assert Language.UNKNOWN.value == "unknown"


class TestLanguageDetectionResult:
    """Tests for LanguageDetectionResult dataclass."""

    def test_creation(self):
        """Test creating a detection result."""
        result = LanguageDetectionResult(
            detected_language=Language.ENGLISH,
            confidence=0.95,
            method_used="langdetect"
        )

        assert result.detected_language == Language.ENGLISH
        assert result.confidence == 0.95
        assert result.method_used == "langdetect"
        assert result.alternative_language is None
        assert result.sample_size == 0


class TestNormalizeLanguageCode:
    """Tests for _normalize_language_code method."""

    def test_english_codes(self, detector):
        """Test normalizing English language codes."""
        assert detector._normalize_language_code("en") == Language.ENGLISH
        assert detector._normalize_language_code("eng") == Language.ENGLISH
        assert detector._normalize_language_code("english") == Language.ENGLISH
        assert detector._normalize_language_code("EN") == Language.ENGLISH

    def test_japanese_codes(self, detector):
        """Test normalizing Japanese language codes."""
        assert detector._normalize_language_code("ja") == Language.JAPANESE
        assert detector._normalize_language_code("jpn") == Language.JAPANESE
        assert detector._normalize_language_code("japanese") == Language.JAPANESE

    def test_chinese_codes(self, detector):
        """Test normalizing Chinese language codes."""
        assert detector._normalize_language_code("zh") == Language.CHINESE_SIMPLIFIED
        assert detector._normalize_language_code("zh-cn") == Language.CHINESE_SIMPLIFIED
        assert detector._normalize_language_code("chi") == Language.CHINESE_SIMPLIFIED
        assert detector._normalize_language_code("zh-tw") == Language.CHINESE_TRADITIONAL
        assert detector._normalize_language_code("zh-hk") == Language.CHINESE_TRADITIONAL

    def test_korean_codes(self, detector):
        """Test normalizing Korean language codes."""
        assert detector._normalize_language_code("ko") == Language.KOREAN
        assert detector._normalize_language_code("kor") == Language.KOREAN
        assert detector._normalize_language_code("korean") == Language.KOREAN

    def test_unknown_code(self, detector):
        """Test handling unknown language codes."""
        assert detector._normalize_language_code("xyz") == Language.UNKNOWN
        assert detector._normalize_language_code("") == Language.UNKNOWN
        assert detector._normalize_language_code(None) == Language.UNKNOWN


class TestDetectByPatterns:
    """Tests for _detect_by_patterns method."""

    def test_detects_japanese(self, detector):
        """Test detecting Japanese text with hiragana/katakana."""
        text = "こんにちは世界。これはテストです。"
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language == Language.JAPANESE
        assert result.confidence > 0.5

    def test_detects_korean(self, detector):
        """Test detecting Korean text with Hangul."""
        text = "안녕하세요 세계. 이것은 테스트입니다."
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language == Language.KOREAN
        assert result.confidence > 0.5

    def test_detects_chinese(self, detector):
        """Test detecting Chinese text."""
        text = "你好世界。这是一个测试。"
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language in [Language.CHINESE_SIMPLIFIED, Language.CHINESE_TRADITIONAL]

    def test_detects_russian(self, detector):
        """Test detecting Russian text with Cyrillic."""
        text = "Привет мир. Это тест."
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language == Language.RUSSIAN
        assert result.confidence > 0.5

    def test_no_pattern_match_english(self, detector):
        """Test that English doesn't match CJK patterns."""
        text = "Hello world. This is a test."
        result = detector._detect_by_patterns(text)

        # English won't match CJK patterns
        assert result is None


class TestExtractSampleText:
    """Tests for _extract_sample_text method."""

    def test_removes_ass_tags(self, detector):
        """Test that ASS formatting tags are removed."""
        import pysubs2

        subs = pysubs2.SSAFile()
        subs.append(pysubs2.SSAEvent(text=r"{\i1}Hello{\i0} world"))
        subs.append(pysubs2.SSAEvent(text=r"{\b1}Bold{\b0} text"))

        sample = detector._extract_sample_text(subs)

        assert r"{\i1}" not in sample
        assert r"{\i0}" not in sample
        assert "Hello" in sample
        assert "world" in sample

    def test_removes_html_tags(self, detector):
        """Test that HTML tags are removed."""
        import pysubs2

        subs = pysubs2.SSAFile()
        subs.append(pysubs2.SSAEvent(text="<i>Hello</i> <b>world</b>"))

        sample = detector._extract_sample_text(subs)

        assert "<i>" not in sample
        assert "</i>" not in sample
        assert "Hello" in sample


class TestDetectEncoding:
    """Tests for detect_encoding method."""

    def test_detects_utf8(self, detector):
        """Test detecting UTF-8 encoding."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as f:
            f.write("1\n00:00:01,000 --> 00:00:02,000\nHello world\n")
            temp_path = Path(f.name)

        try:
            encoding = detector.detect_encoding(temp_path)
            assert encoding.lower() in ['utf-8', 'ascii']
        finally:
            temp_path.unlink()

    def test_detects_utf8_with_japanese(self, detector):
        """Test detecting UTF-8 encoding with Japanese characters."""
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.srt', delete=False) as f:
            content = "1\n00:00:01,000 --> 00:00:02,000\nこんにちは\n"
            f.write(content.encode('utf-8'))
            temp_path = Path(f.name)

        try:
            encoding = detector.detect_encoding(temp_path)
            assert encoding.lower() == 'utf-8'
        finally:
            temp_path.unlink()


class TestChineseVariantDetection:
    """Tests for Chinese Simplified vs Traditional detection."""

    def test_traditional_indicators(self, detector):
        """Test detection of Traditional Chinese indicators."""
        # Text with Traditional Chinese characters
        text = "這是繁體中文測試"
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language in [Language.CHINESE_SIMPLIFIED, Language.CHINESE_TRADITIONAL]

    def test_simplified_indicators(self, detector):
        """Test detection of Simplified Chinese indicators."""
        # Text with Simplified Chinese characters
        text = "这是简体中文测试"
        result = detector._detect_by_patterns(text)

        assert result is not None
        assert result.detected_language in [Language.CHINESE_SIMPLIFIED, Language.CHINESE_TRADITIONAL]


class TestRefineChineseDetection:
    """Tests for _refine_chinese_detection method."""

    def test_refines_to_traditional(self, detector):
        """Test refinement to Traditional Chinese."""
        text = "繁體國際電腦網絡" * 5  # Repeat for strong indicator
        initial = LanguageDetectionResult(
            detected_language=Language.CHINESE_SIMPLIFIED,
            confidence=0.7,
            method_used="langdetect"
        )

        result = detector._refine_chinese_detection(text, initial)

        assert result.detected_language == Language.CHINESE_TRADITIONAL
        assert 'traditional_indicators' in result.details

    def test_refines_to_simplified(self, detector):
        """Test refinement to Simplified Chinese."""
        text = "简体国际电脑网络" * 5  # Repeat for strong indicator
        initial = LanguageDetectionResult(
            detected_language=Language.CHINESE_TRADITIONAL,
            confidence=0.7,
            method_used="langdetect"
        )

        result = detector._refine_chinese_detection(text, initial)

        assert result.detected_language == Language.CHINESE_SIMPLIFIED
        assert 'simplified_indicators' in result.details
