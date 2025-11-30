"""
Simplified subtitle synchronization using ffsubsync
"""

import logging
import re
import shutil
import subprocess
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

import chardet
import pysubs2

from config import settings

logger = logging.getLogger(__name__)


class SyncMethod(Enum):
    """Available synchronization methods"""
    FFSUBSYNC = "ffsubsync"
    MANUAL_OFFSET = "manual_offset"
    NONE = "none"


@dataclass
class SyncResult:
    """Result of a synchronization operation"""
    success: bool
    method: SyncMethod
    output_path: str
    offset_ms: Optional[int] = None
    confidence: Optional[float] = None
    error: Optional[str] = None


class SimplifiedSubtitleSynchronizer:
    """Simplified synchronizer that primarily uses ffsubsync"""
    
    def __init__(self):
        self._ffsubsync_available = None
    
    @property
    def ffsubsync_available(self) -> bool:
        """Check if ffsubsync is installed"""
        if self._ffsubsync_available is None:
            self._ffsubsync_available = shutil.which('ffsubsync') is not None
        return self._ffsubsync_available
    
    def sync_subtitles(
        self,
        reference_path: str,
        target_path: str,
        output_path: str,
        video_path: Optional[str] = None,
        **kwargs
    ) -> SyncResult:
        """
        Synchronize subtitles using ffsubsync or fallback to simple offset
        
        Args:
            reference_path: Reference subtitle file (or video if video_path not provided)
            target_path: Subtitle file to synchronize
            output_path: Output path for synchronized subtitle
            video_path: Optional video file for better sync (uses this as reference if provided)
            **kwargs: Additional parameters (max_offset_seconds, timeout, etc.)
            
        Returns:
            SyncResult with synchronization details
        """
        
        # If we have a video file, use it as the reference for better accuracy
        actual_reference = video_path if video_path else reference_path
        
        # Try ffsubsync first if available
        if self.ffsubsync_available:
            result = self._sync_with_ffsubsync(
                actual_reference, target_path, output_path, **kwargs
            )
            if result.success:
                return result
            logger.warning(f"FFSubSync failed: {result.error}, trying fallback...")
        
        # Fallback to simple offset alignment
        return self._sync_with_offset(
            reference_path, target_path, output_path, **kwargs
        )
    
    def _sync_with_ffsubsync(
        self,
        reference_path: str,
        target_path: str,
        output_path: str,
        **kwargs
    ) -> SyncResult:
        """Synchronize using ffsubsync"""
        
        max_offset = kwargs.get('max_offset_seconds', settings.subtitle.max_sync_offset_seconds)
        timeout = kwargs.get('timeout', settings.subtitle.sync_timeout_seconds)
        
        # For bulk operations, use faster settings
        bulk_mode = kwargs.get('bulk_mode', False)
        if bulk_mode:
            timeout = min(timeout, 90)
        
        try:
            # Build ffsubsync command
            cmd = [
                'ffsubsync',
                str(reference_path),
                '-i', str(target_path),
                '-o', str(output_path),
                '--max-offset-seconds', str(max_offset),
                '--no-fix-framerate'
            ]
            
            # Add performance optimizations for bulk
            if bulk_mode:
                cmd.extend([
                    '--max-subtitle-seconds', '180',  # 3 minutes for speed
                    '--vad', 'webrtc',  # Faster VAD
                ])
            
            logger.debug(f"Running ffsubsync: {' '.join(cmd[:3])}...")

            # Run ffsubsync
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )

            if result.returncode == 0 and Path(output_path).exists():
                # Extract offset if possible from output
                offset_ms = None
                match = re.search(r'offset:\s*([-\d.]+)\s*seconds', result.stdout, re.IGNORECASE)
                if match:
                    offset_ms = int(float(match.group(1)) * 1000)
                
                return SyncResult(
                    success=True,
                    method=SyncMethod.FFSUBSYNC,
                    output_path=output_path,
                    offset_ms=offset_ms,
                    confidence=0.95
                )
            else:
                error_msg = result.stderr.strip() if result.stderr else 'Unknown ffsubsync error'
                return SyncResult(
                    success=False,
                    method=SyncMethod.FFSUBSYNC,
                    output_path=output_path,
                    error=f"ffsubsync failed: {error_msg}"
                )
                
        except subprocess.TimeoutExpired:
            return SyncResult(
                success=False,
                method=SyncMethod.FFSUBSYNC,
                output_path=output_path,
                error=f"ffsubsync timed out after {timeout} seconds"
            )
        except Exception as e:
            return SyncResult(
                success=False,
                method=SyncMethod.FFSUBSYNC,
                output_path=output_path,
                error=f"Unexpected error: {str(e)}"
            )
    
    def _sync_with_offset(
        self,
        reference_path: str,
        target_path: str,
        output_path: str,
        **kwargs
    ) -> SyncResult:
        """
        Simple offset-based synchronization as fallback
        Calculates offset based on average timing difference
        """
        
        try:
            # Detect encoding and load subtitle file
            def detect_and_load(file_path):
                with open(file_path, 'rb') as f:
                    raw = f.read()
                    encoding = chardet.detect(raw)['encoding'] or 'utf-8'
                try:
                    return pysubs2.load(file_path, encoding=encoding)
                except Exception:
                    return pysubs2.load(file_path, encoding='utf-8', errors='replace')
            
            ref_subs = detect_and_load(reference_path)
            target_subs = detect_and_load(target_path)
            
            if not ref_subs or not target_subs:
                # Can't sync empty files
                shutil.copy2(target_path, output_path)
                return SyncResult(
                    success=True,
                    method=SyncMethod.MANUAL_OFFSET,
                    output_path=output_path,
                    offset_ms=0,
                    confidence=0.1,
                    error="Empty subtitle file"
                )
            
            # Calculate offset based on matching patterns
            offset_ms = self._calculate_best_offset(ref_subs, target_subs)
            
            # Apply offset
            for line in target_subs:
                line.start += offset_ms
                line.end += offset_ms
                
                # Ensure no negative timestamps
                if line.start < 0:
                    line.start = 0
                if line.end < 0:
                    line.end = 0
            
            # Save adjusted subtitle
            target_subs.save(output_path)
            
            return SyncResult(
                success=True,
                method=SyncMethod.MANUAL_OFFSET,
                output_path=output_path,
                offset_ms=offset_ms,
                confidence=0.6
            )
            
        except Exception as e:
            # If all else fails, just copy the file
            shutil.copy2(target_path, output_path)
            return SyncResult(
                success=True,
                method=SyncMethod.MANUAL_OFFSET,
                output_path=output_path,
                offset_ms=0,
                confidence=0.1,
                error=f"Fallback failed, using original: {str(e)}"
            )
    
    def _calculate_best_offset(self, ref_subs, target_subs) -> int:
        """
        Calculate best offset using timing patterns
        Doesn't assume which language is "master"
        """
        
        # If subtitle counts are very different, use simple start alignment
        if abs(len(ref_subs) - len(target_subs)) > len(ref_subs) * 0.3:
            # Just align the first subtitles
            if ref_subs and target_subs:
                return ref_subs[0].start - target_subs[0].start
            return 0
        
        # Sample multiple points for offset calculation
        sample_points = min(10, len(ref_subs), len(target_subs))
        offset_samples = []
        
        for i in range(sample_points):
            ref_idx = int((i / (sample_points - 1)) * (len(ref_subs) - 1)) if sample_points > 1 else 0
            target_idx = int((i / (sample_points - 1)) * (len(target_subs) - 1)) if sample_points > 1 else 0
            
            if ref_idx < len(ref_subs) and target_idx < len(target_subs):
                offset = ref_subs[ref_idx].start - target_subs[target_idx].start
                offset_samples.append(offset)
        
        if not offset_samples:
            return 0
        
        # Use median offset to reduce impact of outliers
        offset_samples.sort()
        median_offset = offset_samples[len(offset_samples) // 2]
        
        # Check if offsets are consistent
        if len(offset_samples) > 1:
            variance = sum((o - median_offset) ** 2 for o in offset_samples) / len(offset_samples)
            # If variance is too high, the subtitles might not match well
            if variance > 1000000:  # More than 1 second variance
                logger.warning("High timing variance detected, sync may be inaccurate")
        
        return median_offset


# Create a singleton instance for backward compatibility
_synchronizer = SimplifiedSubtitleSynchronizer()

def sync_subtitles(
    reference_path: str,
    target_path: str,
    output_path: str,
    video_path: Optional[str] = None,
    **kwargs
) -> SyncResult:
    """
    Convenience function for synchronizing subtitles
    
    Args:
        reference_path: Reference subtitle file
        target_path: Subtitle file to synchronize
        output_path: Output path for synchronized subtitle
        video_path: Optional video file for better sync
        **kwargs: Additional parameters
        
    Returns:
        SyncResult with synchronization details
    """
    return _synchronizer.sync_subtitles(
        reference_path, target_path, output_path, video_path, **kwargs
    )