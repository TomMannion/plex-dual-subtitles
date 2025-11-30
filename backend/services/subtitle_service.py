"""
Subtitle Service - handles subtitle file operations and dual subtitle creation
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional

import chardet
import ffmpeg
import pysubs2

from .subtitle_config import DualSubtitleConfig
from .subtitle_sync import (
    prepare_synced_subtitles,
    cleanup_temp_files,
    sync_with_ffsubsync,
    SyncReport,
)
from .language_detector import SimpleLanguageDetector

logger = logging.getLogger(__name__)


class SubtitleService:
    """Service for subtitle file operations and dual subtitle creation."""

    def __init__(self):
        self.language_detector = SimpleLanguageDetector()

    def create_dual_subtitle(
        self,
        primary_path: str,
        secondary_path: str,
        output_path: str,
        config: Optional[DualSubtitleConfig] = None,
        video_path: Optional[str] = None,
        declared_primary_lang: Optional[str] = None,
        declared_secondary_lang: Optional[str] = None,
        enable_language_detection: bool = True,
        enable_sync: Optional[bool] = None
    ) -> Dict:
        """
        Create dual subtitle in SRT format.

        Args:
            primary_path: Path to primary subtitle file
            secondary_path: Path to secondary subtitle file
            output_path: Output path for dual subtitle
            config: Configuration for dual subtitle
            video_path: Optional video path for sync validation
            declared_primary_lang: Declared primary language
            declared_secondary_lang: Declared secondary language
            enable_language_detection: Whether to detect languages
            enable_sync: Whether to sync subtitles (overrides config if set)

        Returns:
            Dict with success status and details
        """
        if config is None:
            config = DualSubtitleConfig()

        # Use enable_sync from parameter if provided, otherwise from config
        sync_enabled = enable_sync if enable_sync is not None else config.enable_sync

        # Language detection
        detection_report = None
        if enable_language_detection or config.enable_language_detection:
            detection_report = self._detect_and_enhance(
                primary_path, secondary_path, config,
                declared_primary_lang, declared_secondary_lang
            )

        # Validate sync with video
        sync_warnings = self._validate_sync(primary_path, secondary_path, video_path)

        # Prepare synced subtitles
        actual_primary, actual_secondary, sync_report = prepare_synced_subtitles(
            primary_path, secondary_path, video_path, sync_enabled
        )

        try:
            # Create the dual subtitle in SRT format
            result = self._create_srt(
                actual_primary, actual_secondary, output_path, config
            )

            # Add extra info
            result['sync_report'] = {
                'attempted': sync_report.attempted,
                'successful': sync_report.successful,
                'primary_synced': sync_report.primary_synced,
                'secondary_synced': sync_report.secondary_synced,
                'method': sync_report.method,
                'error': sync_report.error,
            }

            if sync_warnings:
                result['sync_warnings'] = sync_warnings
            if detection_report:
                result['language_detection'] = detection_report

            return result

        finally:
            # Cleanup temp files
            cleanup_temp_files(
                [actual_primary, actual_secondary],
                [primary_path, secondary_path]
            )

    def _create_srt(
        self,
        primary_path: str,
        secondary_path: str,
        output_path: str,
        config: DualSubtitleConfig
    ) -> Dict:
        """Create dual subtitle in SRT format with overlap merging."""
        try:
            primary_subs = self.load_subtitle(primary_path)
            secondary_subs = self.load_subtitle(secondary_path)

            dual_subs = pysubs2.SSAFile()

            # Determine prefixes based on enable_language_prefix setting
            primary_prefix = ""
            secondary_prefix = ""
            if config.enable_language_prefix:
                primary_lang = (config.primary_language or "pri").upper()
                secondary_lang = (config.secondary_language or "sec").upper()
                primary_prefix = f"[{primary_lang}] "
                secondary_prefix = f"[{secondary_lang}] "

            # Add primary with optional prefix
            for line in primary_subs:
                text = primary_prefix + line.text if primary_prefix else line.text

                event = pysubs2.SSAEvent(
                    start=line.start,
                    end=line.end,
                    text=text
                )
                dual_subs.append(event)

            # Add secondary, merging overlaps
            for line in secondary_subs:
                text = secondary_prefix + line.text if secondary_prefix else line.text

                # Check for overlaps
                merged = False
                for existing in dual_subs:
                    if self._times_overlap(line, existing):
                        existing.text = f"{existing.text}\\N{text}"
                        merged = True
                        break

                if not merged:
                    dual_subs.append(pysubs2.SSAEvent(
                        start=line.start,
                        end=line.end,
                        text=text
                    ))

            dual_subs.sort()
            dual_subs.save(output_path, format_='srt')

            return {
                'success': True,
                'output_path': output_path,
                'primary_lines': len(primary_subs),
                'secondary_lines': len(secondary_subs),
                'total_lines': len(dual_subs),
                'format': 'SRT'
            }

        except Exception as e:
            logger.error(f"Failed to create SRT dual subtitle: {e}")
            return {'success': False, 'error': str(e)}

    def _times_overlap(self, line1, line2) -> bool:
        """Check if two subtitle lines overlap in time."""
        return (
            line1.start <= line2.end and
            line1.end >= line2.start
        )

    def _detect_and_enhance(
        self,
        primary_path: str,
        secondary_path: str,
        config: DualSubtitleConfig,
        declared_primary: Optional[str],
        declared_secondary: Optional[str]
    ) -> Optional[Dict]:
        """Detect languages and enhance configuration."""
        try:
            primary_result = self.language_detector.detect_from_file(
                Path(primary_path), declared_primary
            )
            secondary_result = self.language_detector.detect_from_file(
                Path(secondary_path), declared_secondary
            )

            return {
                'primary_analysis': {
                    'detected': primary_result.detected_language.value,
                    'confidence': primary_result.confidence,
                },
                'secondary_analysis': {
                    'detected': secondary_result.detected_language.value,
                    'confidence': secondary_result.confidence,
                }
            }
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
            return {'error': str(e)}

    def _validate_sync(
        self,
        primary_path: str,
        secondary_path: str,
        video_path: Optional[str]
    ) -> List[str]:
        """Validate subtitle sync with video."""
        warnings = []
        if not video_path:
            return warnings

        primary_sync = self.validate_subtitle_sync(primary_path, video_path)
        secondary_sync = self.validate_subtitle_sync(secondary_path, video_path)

        if not primary_sync.get('valid'):
            msg = primary_sync.get('warning') or primary_sync.get('error')
            warnings.append(f"Primary subtitle sync issue: {msg}")

        if not secondary_sync.get('valid'):
            msg = secondary_sync.get('warning') or secondary_sync.get('error')
            warnings.append(f"Secondary subtitle sync issue: {msg}")

        return warnings

    # =========================================================================
    # Utility methods
    # =========================================================================

    def detect_encoding(self, file_path: str) -> str:
        """Detect character encoding of a subtitle file."""
        with open(file_path, 'rb') as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            return result['encoding'] or 'utf-8'

    def load_subtitle(
        self,
        file_path: str,
        encoding: Optional[str] = None
    ) -> pysubs2.SSAFile:
        """Load subtitle file with automatic encoding detection."""
        if not encoding:
            encoding = self.detect_encoding(file_path)

        try:
            return pysubs2.load(file_path, encoding=encoding)
        except Exception:
            return pysubs2.load(file_path, encoding='utf-8', errors='replace')

    def get_video_duration_ms(self, video_path: str) -> Optional[int]:
        """Get video duration in milliseconds using ffmpeg."""
        try:
            probe = ffmpeg.probe(video_path)
            duration = float(probe['streams'][0]['duration'])
            return int(duration * 1000)
        except Exception as e:
            logger.warning(f"Could not get video duration: {e}")
            return None

    def validate_subtitle_sync(
        self,
        subtitle_path: str,
        video_path: str
    ) -> Dict:
        """Check if subtitle timing matches video duration."""
        video_duration = self.get_video_duration_ms(video_path)
        if not video_duration:
            return {'valid': None, 'warning': 'Could not determine video duration'}

        try:
            subs = self.load_subtitle(subtitle_path)
            if not subs:
                return {'valid': False, 'error': 'No subtitles found'}

            last_end = max(line.end for line in subs)

            if last_end > video_duration + 5000:
                return {
                    'valid': False,
                    'warning': f'Subtitles end {(last_end - video_duration) / 1000:.1f}s after video',
                    'subtitle_duration_ms': last_end,
                    'video_duration_ms': video_duration,
                }

            if last_end < video_duration - 30000:
                return {
                    'valid': False,
                    'warning': f'Subtitles end {(video_duration - last_end) / 1000:.1f}s before video',
                    'subtitle_duration_ms': last_end,
                    'video_duration_ms': video_duration,
                }

            return {
                'valid': True,
                'subtitle_duration_ms': last_end,
                'video_duration_ms': video_duration
            }

        except Exception as e:
            return {'valid': False, 'error': str(e)}

    def extract_embedded_subtitle(
        self,
        video_path: str,
        stream_index: int,
        output_path: str,
        codec: Optional[str] = None
    ) -> Dict:
        """Extract an embedded subtitle stream from video file."""
        try:
            output_ext = Path(output_path).suffix.lower()

            # Determine format
            if codec and codec.lower() in ['ass', 'ssa'] and output_ext == '.ass':
                output_format = 'ass'
            elif codec and codec.lower() in ['ass', 'ssa'] and output_ext == '.ssa':
                output_format = 'ssa'
            else:
                output_format = 'srt'

            logger.info(f"Extracting subtitle stream {stream_index} from {video_path}")

            input_stream = ffmpeg.input(video_path)
            output = ffmpeg.output(
                input_stream,
                output_path,
                **{'map': f'0:{stream_index}', 'f': output_format}
            )

            ffmpeg.run(output, overwrite_output=True, quiet=False)

            return {
                'success': True,
                'output_path': output_path,
                'stream_index': stream_index
            }

        except ffmpeg.Error as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            logger.error(f"FFmpeg extraction failed: {error_msg}")
            return {'success': False, 'error': f"FFmpeg error: {error_msg}"}

        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return {'success': False, 'error': str(e)}

    def preview_dual_subtitle(
        self,
        primary_path: str,
        secondary_path: str,
        preview_lines: int = 5
    ) -> Dict:
        """Generate a preview of dual subtitle without saving."""
        primary_subs = self.load_subtitle(primary_path)
        secondary_subs = self.load_subtitle(secondary_path)

        def format_preview(subs, limit):
            preview = []
            for i, line in enumerate(subs):
                if i >= limit:
                    break
                preview.append({
                    'time': f"{pysubs2.time.ms_to_str(line.start)} --> {pysubs2.time.ms_to_str(line.end)}",
                    'text': line.text
                })
            return preview

        return {
            'primary': format_preview(primary_subs, preview_lines),
            'secondary': format_preview(secondary_subs, preview_lines),
        }


# Singleton instance
subtitle_service = SubtitleService()
