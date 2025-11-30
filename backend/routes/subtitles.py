"""
Subtitle management routes - upload, delete, dual subtitle creation, etc.
"""

import logging
import tempfile
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from dependencies import get_plex_token
from services.plex_service import plex_service
from services.subtitle_service import subtitle_service
from services.subtitle_config import DualSubtitleConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["subtitles"])

# Allowed subtitle file extensions
ALLOWED_EXTENSIONS = {'.srt', '.ass', '.ssa', '.vtt', '.sub'}


@router.post("/episodes/{episode_id}/subtitles/upload")
async def upload_subtitle(
    episode_id: str,
    token: str = Depends(get_plex_token),
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Upload a subtitle file for an episode.
    """
    try:
        # Get episode information
        plex = plex_service.connect(token)
        episode = plex.fetchItem(int(episode_id))

        # Get the naming pattern
        base_name = plex_service.get_episode_naming_pattern(episode)

        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Get the directory where the video file is
        file_info = plex_service.get_episode_file_info(episode)
        if not file_info:
            raise HTTPException(status_code=404, detail="Episode file not found")

        # Create the subtitle filename following Plex convention
        subtitle_filename = f"{base_name}.{language}{file_ext}"
        subtitle_path = Path(file_info['file_dir']) / subtitle_filename

        # Read and save the uploaded file
        content = await file.read()

        with open(subtitle_path, 'wb') as f:
            f.write(content)

        logger.info(f"Uploaded subtitle: {subtitle_filename}")

        return {
            "success": True,
            "message": "Subtitle uploaded successfully",
            "filename": subtitle_filename,
            "path": str(subtitle_path),
            "language": language
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload subtitle for episode {episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/subtitles")
async def delete_subtitle(
    file_path: str,
    token: str = Depends(get_plex_token)
):
    """
    Delete a subtitle file. Requires Plex authentication.
    """
    # Token validation ensures user is authenticated
    _ = token
    try:
        path = Path(file_path)

        # Security check - ensure it's a subtitle file
        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Can only delete subtitle files"
            )

        if not path.exists():
            raise HTTPException(status_code=404, detail="Subtitle file not found")

        # Delete the file
        path.unlink()
        logger.info(f"Deleted subtitle: {file_path}")

        return {
            "success": True,
            "message": "Subtitle deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete subtitle {file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/episodes/{episode_id}/subtitles/dual")
async def create_dual_subtitle(
    episode_id: str,
    token: str = Depends(get_plex_token),
    primary_subtitle: str = Form(...),
    secondary_subtitle: str = Form(...),
    primary_language: str = Form("ja"),
    secondary_language: str = Form("en"),
    enable_sync: bool = Form(False),
    enable_language_prefix: bool = Form(True),
    # Fields for embedded subtitle support
    primary_source_type: str = Form("external"),
    primary_stream_index: Optional[int] = Form(None),
    primary_codec: Optional[str] = Form(None),
    secondary_source_type: str = Form("external"),
    secondary_stream_index: Optional[int] = Form(None),
    secondary_codec: Optional[str] = Form(None)
):
    """
    Create a dual subtitle file from two existing subtitles.
    Supports both external and embedded subtitle sources.
    """
    temp_files = []  # Track temp files for cleanup

    try:
        # Get episode information
        plex = plex_service.connect(token)
        episode = plex.fetchItem(int(episode_id))
        episode.reload()  # Get full stream data

        # Get output path
        file_info = plex_service.get_episode_file_info(episode)
        if not file_info:
            raise HTTPException(status_code=404, detail="Episode file not found")

        video_file_path = file_info['file_path']

        # Resolve primary subtitle path (external or extract embedded)
        if primary_source_type == 'embedded' and primary_stream_index is not None:
            primary_path = _extract_embedded_to_temp(
                video_file_path, primary_stream_index, primary_codec, temp_files
            )
            if not primary_path:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to extract primary embedded subtitle"
                )
        else:
            primary_path = Path(primary_subtitle)
            if not primary_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Primary subtitle not found: {primary_subtitle}"
                )

        # Resolve secondary subtitle path (external or extract embedded)
        if secondary_source_type == 'embedded' and secondary_stream_index is not None:
            secondary_path = _extract_embedded_to_temp(
                video_file_path, secondary_stream_index, secondary_codec, temp_files
            )
            if not secondary_path:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to extract secondary embedded subtitle"
                )
        else:
            secondary_path = Path(secondary_subtitle)
            if not secondary_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Secondary subtitle not found: {secondary_subtitle}"
                )

        base_name = plex_service.get_episode_naming_pattern(episode)

        # Always use SRT format for dual subtitles with language codes
        output_filename = f"{base_name}.dual.{primary_language}-{secondary_language}.srt"
        output_path = Path(file_info['file_dir']) / output_filename

        # Create configuration
        config = DualSubtitleConfig(
            primary_language=primary_language,
            secondary_language=secondary_language,
            enable_language_prefix=enable_language_prefix,
            enable_sync=enable_sync,
        )

        # Create dual subtitle with video sync validation and language detection
        result = subtitle_service.create_dual_subtitle(
            str(primary_path),
            str(secondary_path),
            str(output_path),
            config,
            video_path=video_file_path,
            declared_primary_lang=primary_language,
            declared_secondary_lang=secondary_language,
        )

        # Clean up temp files
        for tf in temp_files:
            try:
                Path(tf).unlink()
            except Exception as e:
                logger.debug(f"Failed to clean up temp file {tf}: {e}")

        if result['success']:
            logger.info(f"Created dual subtitle: {output_filename}")
            return {
                "success": True,
                "message": "Dual subtitle created successfully",
                "output_file": output_filename,
                "output_path": str(output_path),
                "details": result
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Failed to create dual subtitle')
            )

    except HTTPException:
        # Clean up temp files on error
        for tf in temp_files:
            try:
                Path(tf).unlink()
            except Exception as e:
                logger.debug(f"Failed to clean up temp file {tf}: {e}")
        raise
    except Exception as e:
        # Clean up temp files on error
        for tf in temp_files:
            try:
                Path(tf).unlink()
            except Exception as cleanup_err:
                logger.debug(f"Failed to clean up temp file {tf}: {cleanup_err}")
        logger.error(f"Failed to create dual subtitle for episode {episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _extract_embedded_to_temp(video_path: str, stream_index: int, codec: Optional[str], temp_files: list) -> Optional[Path]:
    """Extract embedded subtitle to a temp file."""
    try:
        # Determine output extension based on codec
        if codec and codec.lower() in ['ass', 'ssa']:
            ext = '.ass'
        else:
            ext = '.srt'

        # Create temp file
        temp_file = tempfile.NamedTemporaryFile(
            suffix=ext,
            prefix=f'dual_sub_stream{stream_index}_',
            delete=False
        )
        temp_path = temp_file.name
        temp_file.close()
        temp_files.append(temp_path)

        # Extract the subtitle
        result = subtitle_service.extract_embedded_subtitle(
            video_path,
            stream_index,
            temp_path,
            codec
        )

        if result.get('success'):
            return Path(temp_path)
        else:
            logger.warning(f"Failed to extract embedded subtitle stream {stream_index}: {result.get('error')}")
            return None

    except Exception as e:
        logger.error(f"Error extracting embedded subtitle: {e}")
        return None


@router.post("/subtitles/dual/preview")
async def preview_dual_subtitle(
    primary_subtitle: str = Form(...),
    secondary_subtitle: str = Form(...)
):
    """
    Preview a dual subtitle combination without creating the file.
    """
    try:
        # Validate files exist
        primary_path = Path(primary_subtitle)
        secondary_path = Path(secondary_subtitle)

        if not primary_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Primary subtitle not found: {primary_subtitle}"
            )
        if not secondary_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Secondary subtitle not found: {secondary_subtitle}"
            )

        # Generate preview
        preview = subtitle_service.preview_dual_subtitle(
            str(primary_path),
            str(secondary_path),
            preview_lines=5
        )

        return preview

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to preview dual subtitle: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/episodes/{episode_id}/subtitles/extract-embedded")
async def extract_embedded_subtitle(
    episode_id: str,
    token: str = Depends(get_plex_token),
    stream_index: int = Form(...),
    language_code: str = Form("en"),
    subtitle_type: str = Form("normal")
):
    """
    Extract an embedded subtitle stream to an external file.
    """
    try:
        # Get episode information
        plex = plex_service.connect(token)
        episode = plex.fetchItem(int(episode_id))

        file_info = plex_service.get_episode_file_info(episode)
        if not file_info:
            raise HTTPException(status_code=404, detail="Episode file not found")

        # Find the codec of the embedded subtitle stream
        codec = None
        for sub in file_info.get('embedded_subtitles', []):
            if sub.get('stream_index') == stream_index:
                codec = sub.get('codec', '')
                break

        # Determine file extension based on codec
        if codec and codec.lower() in ['ass', 'ssa']:
            file_ext = '.ass'
        else:
            file_ext = '.srt'  # Default to SRT for compatibility

        # Create output filename
        base_name = plex_service.get_episode_naming_pattern(episode)
        suffix = ".forced" if subtitle_type == "forced" else ""
        output_filename = f"{base_name}.{language_code}{suffix}{file_ext}"
        output_path = Path(file_info['file_dir']) / output_filename

        # Extract the embedded subtitle
        result = subtitle_service.extract_embedded_subtitle(
            file_info['file_path'],
            stream_index,
            str(output_path),
            codec
        )

        if result['success']:
            logger.info(f"Extracted embedded subtitle: {output_filename}")
            return {
                "success": True,
                "message": "Embedded subtitle extracted successfully",
                "output_file": output_filename,
                "output_path": str(output_path),
                "stream_index": stream_index
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Extraction failed: {result.get('error')}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract embedded subtitle for episode {episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
