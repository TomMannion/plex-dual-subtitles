"""
Pytest configuration and fixtures for PlexDualSub tests
"""

import pytest
import sys
from pathlib import Path

# Add backend to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture
def sample_subtitle_filenames():
    """Sample subtitle filenames for testing language extraction."""
    return [
        # Standard patterns
        ("ShowName.S01E01.en.srt", ["en"]),
        ("ShowName.S01E01.eng.srt", ["en"]),
        ("ShowName.S01E01.japanese.srt", ["ja"]),
        ("ShowName.S01E01.ja.srt", ["ja"]),

        # Chinese variants
        ("ShowName.S01E01.zh-TW.srt", ["zh-hant"]),
        ("ShowName.S01E01.zht.srt", ["zh-hant"]),
        ("ShowName.S01E01.chi.srt", ["zh"]),

        # Multiple languages detected
        ("ShowName.S01E01.en.ja.dual.srt", ["en", "ja"]),

        # No language code
        ("ShowName.S01E01.srt", []),

        # Edge cases
        ("ShowName.S01E01.hi.srt", []),  # 'hi' is hearing impaired, not Hindi
        ("ShowName.S01E01.forced.srt", []),
    ]


@pytest.fixture
def cache_config():
    """Configuration for cache tests."""
    return {
        "ttl_seconds": 1,  # Short TTL for testing expiration
        "max_size": 5,
    }
