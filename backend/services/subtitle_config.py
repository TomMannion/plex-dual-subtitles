"""
Centralized subtitle configuration for SRT dual subtitles
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class DualSubtitleConfig:
    """Centralized configuration for dual subtitle creation (SRT format)"""

    # Language hints
    primary_language: Optional[str] = None
    secondary_language: Optional[str] = None

    # SRT format options
    enable_language_prefix: bool = True  # Add [EN] [JA] etc. before subtitle lines

    # Processing options
    enable_sync: bool = True
    enable_language_detection: bool = True
