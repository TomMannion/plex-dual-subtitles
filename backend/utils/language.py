"""
Language detection utilities for subtitle filenames
"""

import re
import logging
from typing import List, Set, Optional

logger = logging.getLogger(__name__)


# Standard ISO 639-1/2 language codes
KNOWN_LANGUAGE_CODES: Set[str] = {
    'en', 'eng', 'english',
    'ja', 'jp', 'jpn', 'japanese',
    'zh', 'zho', 'chi', 'chinese',
    'es', 'spa', 'spanish', 'espanol',
    'fr', 'fre', 'fra', 'french', 'francais',
    'de', 'ger', 'deu', 'german', 'deutsch',
    'it', 'ita', 'italian',
    'pt', 'por', 'portuguese',
    'ru', 'rus', 'russian',
    'ko', 'kr', 'kor', 'korean',
    'ar', 'ara', 'arabic',
    'nl', 'dut', 'nld', 'dutch',
    'sv', 'swe', 'swedish',
    'no', 'nor', 'norwegian',
    'da', 'dan', 'danish',
    'fi', 'fin', 'finnish',
    'pl', 'pol', 'polish',
    'tr', 'tur', 'turkish',
    'th', 'tha', 'thai',
    'vi', 'vie', 'vietnamese',
}

# Language patterns for regex matching in filenames
LANGUAGE_PATTERNS = {
    'en': r'\b(en|eng|english)\b',
    'zh': r'\b(zh|chi|chinese|chs)\b',
    'zh-hant': r'\b(zh-tw|zh-hk|zht|cht|tc|traditional)\b',
    'es': r'\b(es|spa|spanish|espanol)\b',
    'fr': r'\b(fr|fre|fra|french|francais)\b',
    'de': r'\b(de|ger|deu|german|deutsch)\b',
    'ja': r'\b(ja|jp|jpn|japanese)\b',
    'ko': r'\b(ko|kr|kor|korean)\b',
    'pt': r'\b(pt|por|portuguese)\b',
    'pt-br': r'\b(pt-br|ptbr|pb|brazilian)\b',
    'ru': r'\b(ru|rus|russian)\b',
    'ar': r'\b(ar|ara|arabic)\b',
    'it': r'\b(it|ita|italian)\b',
    'nl': r'\b(nl|dut|nld|dutch)\b',
}

# Chinese variant mappings
CHINESE_VARIANTS = {
    'zh-tw': 'zh-TW',    # Traditional Chinese (Taiwan)
    'zh-hk': 'zh-HK',    # Traditional Chinese (Hong Kong)
    'zh-cn': 'zh-CN',    # Simplified Chinese (China)
    'zh-sg': 'zh-SG',    # Simplified Chinese (Singapore)
    'zht': 'zh-TW',      # Traditional Chinese shorthand
    'zhs': 'zh-CN',      # Simplified Chinese shorthand
    'cht': 'zh-TW',      # Traditional Chinese alternative
    'chs': 'zh-CN',      # Simplified Chinese alternative
}

# Subtitle variant indicators (not language codes)
SUBTITLE_VARIANTS = {'hi', 'cc', 'sdh', 'forced', 'commentary'}


def extract_languages_from_filename(filename: str) -> List[str]:
    """
    Extract language codes from a subtitle filename.

    Handles various naming conventions:
    - ShowName.S01E01.en.srt
    - ShowName.S01E01.eng.srt
    - ShowName.S01E01.zh-TW.srt
    - ShowName.S01E01.Japanese.srt

    Args:
        filename: The subtitle filename (with or without path)

    Returns:
        List of detected language codes (normalized)
    """
    filename_lower = filename.lower()
    detected_languages = []

    for lang_code, pattern in LANGUAGE_PATTERNS.items():
        if re.search(pattern, filename_lower):
            detected_languages.append(lang_code)

    return detected_languages


def extract_language_from_subtitle_parts(
    filename_parts: List[str],
    base_filename: str
) -> Optional[str]:
    """
    Extract language code from subtitle filename parts.

    Handles complex patterns like:
    - ShowName.S01E01.en.srt -> ['ShowName', 'S01E01', 'en'] -> 'en'
    - ShowName.S01E01.zh.TW.srt -> ['ShowName', 'S01E01', 'zh', 'TW'] -> 'zh-TW'

    Args:
        filename_parts: Filename split by '.'
        base_filename: The base video filename (without extension)

    Returns:
        Detected language code or None
    """
    if len(filename_parts) <= 1:
        return None

    # First check for Chinese variants (more specific patterns)
    for i in range(len(filename_parts)):
        current_part = filename_parts[i].lower()
        next_part = filename_parts[i + 1].lower() if i + 1 < len(filename_parts) else ""

        # Pattern: "zh-tw", "zht", etc. (combined)
        if current_part in CHINESE_VARIANTS:
            return CHINESE_VARIANTS[current_part]

        # Pattern: "zh" + "tw" as separate parts
        if current_part == 'zh' and next_part in ['tw', 'hk', 'cn', 'sg']:
            return f'zh-{next_part.upper()}'

    # Look for standard language codes
    for part in reversed(filename_parts[1:]):  # Skip the base filename part
        part_lower = part.lower()

        # Check if it's a known language code (2-3 letters)
        if len(part_lower) in [2, 3] and part_lower in KNOWN_LANGUAGE_CODES:
            return part_lower

    # Fallback: try the last part if it looks like a language code
    last_part = filename_parts[-1].lower()
    if (
        len(last_part) in [2, 3] and
        last_part.isalpha() and
        last_part not in SUBTITLE_VARIANTS
    ):
        return last_part

    return None


def normalize_language_code(code: str) -> str:
    """
    Normalize a language code to standard format.

    Examples:
    - 'eng' -> 'en'
    - 'jpn' -> 'ja'
    - 'chi' -> 'zh'

    Args:
        code: The language code to normalize

    Returns:
        Normalized language code
    """
    code = code.lower().strip()

    # Map 3-letter codes to 2-letter
    three_to_two = {
        'eng': 'en',
        'jpn': 'ja',
        'chi': 'zh',
        'zho': 'zh',
        'spa': 'es',
        'fre': 'fr',
        'fra': 'fr',
        'ger': 'de',
        'deu': 'de',
        'ita': 'it',
        'por': 'pt',
        'rus': 'ru',
        'kor': 'ko',
        'ara': 'ar',
        'dut': 'nl',
        'nld': 'nl',
    }

    return three_to_two.get(code, code)


def is_cjk_language(code: str) -> bool:
    """
    Check if a language code represents a CJK (Chinese, Japanese, Korean) language.

    Args:
        code: Language code to check

    Returns:
        True if CJK language
    """
    normalized = normalize_language_code(code)
    return normalized in {'zh', 'ja', 'ko'} or code.startswith('zh-')
