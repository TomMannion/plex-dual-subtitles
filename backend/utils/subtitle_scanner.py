"""
Subtitle file scanner utility

Scans directories for subtitle files and extracts metadata like language codes.
"""

import logging
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass

from .language import (
    extract_language_from_subtitle_parts,
    CHINESE_VARIANTS,
    KNOWN_LANGUAGE_CODES,
    SUBTITLE_VARIANTS,
)

logger = logging.getLogger(__name__)

# Supported subtitle file extensions
SUBTITLE_EXTENSIONS = {'.srt', '.ass', '.ssa', '.vtt', '.sub'}


@dataclass
class SubtitleFileInfo:
    """Information about an external subtitle file."""
    file_path: str
    file_name: str
    language_code: Optional[str]
    format: str
    is_dual_subtitle: bool
    dual_languages: Optional[List[str]]

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'file_path': self.file_path,
            'file_name': self.file_name,
            'language_code': self.language_code,
            'format': self.format,
            'is_dual_subtitle': self.is_dual_subtitle,
            'dual_languages': self.dual_languages,
        }


def scan_directory_for_subtitles(
    directory: str,
    base_filename: str
) -> List[SubtitleFileInfo]:
    """
    Scan a directory for subtitle files matching a video file.

    Args:
        directory: Path to the directory to scan
        base_filename: Base filename of the video (without extension)

    Returns:
        List of SubtitleFileInfo objects for found subtitles
    """
    subtitles: List[SubtitleFileInfo] = []

    try:
        dir_path = Path(directory)
        if not dir_path.exists():
            logger.debug(f"Directory does not exist: {directory}")
            return subtitles

        for file in dir_path.iterdir():
            if not file.is_file():
                continue

            if file.suffix.lower() not in SUBTITLE_EXTENSIONS:
                continue

            # Check if this subtitle belongs to our video
            if not file.stem.startswith(base_filename):
                continue

            subtitle_info = parse_subtitle_filename(file, base_filename)
            if subtitle_info:
                subtitles.append(subtitle_info)

    except (OSError, PermissionError) as e:
        logger.warning(f"Error scanning directory {directory}: {e}")

    return subtitles


def parse_subtitle_filename(
    file_path: Path,
    base_filename: str
) -> Optional[SubtitleFileInfo]:
    """
    Parse a subtitle filename to extract metadata.

    Handles patterns like:
    - ShowName.S01E01.en.srt
    - ShowName.S01E01.zh-TW.srt
    - ShowName.S01E01.dual.ja.en.ass

    Args:
        file_path: Path to the subtitle file
        base_filename: Base filename of the video

    Returns:
        SubtitleFileInfo or None if parsing fails
    """
    try:
        filename = file_path.stem
        parts = filename.split('.')

        # Detect dual subtitle
        is_dual, dual_languages = detect_dual_subtitle(parts)

        # Extract language code (unless it's a dual subtitle)
        language_code = None
        if not is_dual:
            language_code = _extract_language_code(parts)

        return SubtitleFileInfo(
            file_path=str(file_path),
            file_name=file_path.name,
            language_code=language_code,
            format=file_path.suffix[1:].upper(),
            is_dual_subtitle=is_dual,
            dual_languages=dual_languages,
        )

    except Exception as e:
        logger.warning(f"Error parsing subtitle filename {file_path}: {e}")
        return None


def detect_dual_subtitle(parts: List[str]) -> tuple[bool, Optional[List[str]]]:
    """
    Detect if a subtitle file is a dual subtitle and extract languages.

    Dual subtitle pattern: base.dual.lang1.lang2.ext

    Args:
        parts: Filename split by '.'

    Returns:
        Tuple of (is_dual, languages_list)
    """
    # Check if 'dual' is in the filename
    lower_parts = [p.lower() for p in parts]
    if 'dual' not in lower_parts:
        return False, None

    try:
        dual_index = lower_parts.index('dual')

        # Need at least 2 parts after 'dual' for language codes
        if dual_index + 2 < len(parts):
            lang1 = parts[dual_index + 1]
            lang2 = parts[dual_index + 2]

            # Validate they look like language codes
            if _looks_like_language_code(lang1) and _looks_like_language_code(lang2):
                return True, [lang1, lang2]

    except (ValueError, IndexError):
        pass

    # It has 'dual' but we couldn't extract languages
    return True, None


def _extract_language_code(parts: List[str]) -> Optional[str]:
    """
    Extract language code from filename parts.

    Uses the centralized language utilities for consistency.
    """
    if len(parts) <= 1:
        return None

    # First try using the centralized function
    result = extract_language_from_subtitle_parts(parts, parts[0])
    if result:
        return result

    # Fallback: check last part if it looks like a language code
    last_part = parts[-1].lower()
    if _looks_like_language_code(last_part) and last_part not in SUBTITLE_VARIANTS:
        return last_part

    return None


def _looks_like_language_code(s: str) -> bool:
    """
    Check if a string looks like a language code.

    Args:
        s: String to check

    Returns:
        True if it looks like a 2-3 letter language code
    """
    s_lower = s.lower()
    return (
        len(s_lower) in [2, 3] and
        s_lower.isalpha() and
        s_lower not in SUBTITLE_VARIANTS
    )


def get_subtitle_extensions() -> List[str]:
    """Get list of supported subtitle file extensions."""
    return list(SUBTITLE_EXTENSIONS)
