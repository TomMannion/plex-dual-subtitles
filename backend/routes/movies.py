"""
Movie routes
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

router = APIRouter(prefix="/api/movies", tags=["movies"])

# Allowed subtitle file extensions
ALLOWED_EXTENSIONS = {'.srt', '.ass', '.ssa', '.vtt', '.sub'}


@router.get("/")
async def get_movies(
    token: str = Depends(get_plex_token),
    library: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0
):
    """
    Get all movies from a library.

    Args:
        library: Optional library name to filter by
        limit: Optional limit on number of movies returned
        offset: Pagination offset
    """
    try:
        movies = plex_service.get_all_movies(library, token)

        # Apply pagination
        total_count = len(movies)
        if offset:
            movies = movies[offset:]
        if limit:
            movies = movies[:limit]

        return {
            "count": total_count,
            "offset": offset,
            "movies": [
                {
                    "id": movie.ratingKey,
                    "title": movie.title,
                    "year": getattr(movie, 'year', None),
                    "thumb": plex_service.get_full_image_url(movie.thumb, token),
                    "summary": getattr(movie, 'summary', '')[:200] if hasattr(movie, 'summary') else ''
                }
                for movie in movies
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get movies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{movie_id}")
async def get_movie_detail(movie_id: str, token: str = Depends(get_plex_token)):
    """
    Get detailed information about a specific movie.
    """
    try:
        plex = plex_service.connect(token)
        movie = plex.fetchItem(int(movie_id))
        movie.reload()  # Get full stream data

        return plex_service.format_movie_info(movie, token)
    except Exception as e:
        logger.error(f"Failed to get movie {movie_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{movie_id}/subtitles")
async def get_movie_subtitles(movie_id: str, token: str = Depends(get_plex_token)):
    """
    Get all subtitles (embedded and external) for a movie.
    """
    try:
        plex = plex_service.connect(token)
        movie = plex.fetchItem(int(movie_id))
        movie.reload()  # Get full stream data

        file_info = plex_service.get_movie_file_info(movie)

        if not file_info:
            return {
                "movie": movie.title,
                "has_file": False,
                "subtitles": []
            }

        return {
            "movie": movie.title,
            "file_path": file_info['file_path'],
            "has_subtitles": file_info['has_subtitles'],
            "embedded_subtitles": file_info['embedded_subtitles'],
            "external_subtitles": file_info['external_subtitles'],
            "naming_pattern": plex_service.get_movie_naming_pattern(movie)
        }
    except Exception as e:
        logger.error(f"Failed to get subtitles for movie {movie_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{movie_id}/subtitles/upload")
async def upload_movie_subtitle(
    movie_id: str,
    token: str = Depends(get_plex_token),
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Upload a subtitle file for a movie.
    """
    try:
        plex = plex_service.connect(token)
        movie = plex.fetchItem(int(movie_id))

        # Get the naming pattern
        base_name = plex_service.get_movie_naming_pattern(movie)

        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Get the directory where the video file is
        file_info = plex_service.get_movie_file_info(movie)
        if not file_info:
            raise HTTPException(status_code=404, detail="Movie file not found")

        # Create the subtitle filename following Plex convention
        subtitle_filename = f"{base_name}.{language}{file_ext}"
        subtitle_path = Path(file_info['file_dir']) / subtitle_filename

        # Read and save the uploaded file
        content = await file.read()

        with open(subtitle_path, 'wb') as f:
            f.write(content)

        logger.info(f"Uploaded movie subtitle: {subtitle_filename}")

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
        logger.error(f"Failed to upload subtitle for movie {movie_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{movie_id}/subtitles/dual")
async def create_movie_dual_subtitle(
    movie_id: str,
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
    Create a dual subtitle file from two existing subtitles for a movie.
    Supports both external and embedded subtitle sources.
    """
    temp_files = []  # Track temp files for cleanup

    try:
        plex = plex_service.connect(token)
        movie = plex.fetchItem(int(movie_id))
        movie.reload()  # Get full stream data

        # Get output path
        file_info = plex_service.get_movie_file_info(movie)
        if not file_info:
            raise HTTPException(status_code=404, detail="Movie file not found")

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

        base_name = plex_service.get_movie_naming_pattern(movie)

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
            logger.info(f"Created movie dual subtitle: {output_filename}")
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
        logger.error(f"Failed to create dual subtitle for movie {movie_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{movie_id}/subtitles/extract-embedded")
async def extract_movie_embedded_subtitle(
    movie_id: str,
    token: str = Depends(get_plex_token),
    stream_index: int = Form(...),
    language_code: str = Form("en"),
    subtitle_type: str = Form("normal")
):
    """
    Extract an embedded subtitle stream to an external file for a movie.
    """
    try:
        plex = plex_service.connect(token)
        movie = plex.fetchItem(int(movie_id))
        movie.reload()

        file_info = plex_service.get_movie_file_info(movie)
        if not file_info:
            raise HTTPException(status_code=404, detail="Movie file not found")

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
        base_name = plex_service.get_movie_naming_pattern(movie)
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
            logger.info(f"Extracted movie embedded subtitle: {output_filename}")
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
        logger.error(f"Failed to extract embedded subtitle for movie {movie_id}: {e}")
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
            prefix=f'movie_dual_sub_stream{stream_index}_',
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
