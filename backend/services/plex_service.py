"""
Plex API Service - handles all interactions with Plex Media Server
"""

import os
import logging
from typing import List, Dict, Optional
from pathlib import Path

from plexapi.server import PlexServer
from plexapi.library import ShowSection, MovieSection
from plexapi.video import Show, Episode, Movie
from dotenv import load_dotenv

from utils.cache import TTLCache
from utils.subtitle_scanner import scan_directory_for_subtitles
from exceptions import PlexConnectionError, PlexAuthenticationError

logger = logging.getLogger(__name__)

# Plex stream type constants
PLEX_STREAM_TYPE_VIDEO = 1
PLEX_STREAM_TYPE_AUDIO = 2
PLEX_STREAM_TYPE_SUBTITLE = 3


class PlexService:
    """
    Service for interacting with Plex Media Server.

    Handles connection management, library access, and media information retrieval.
    """

    def __init__(self):
        load_dotenv()
        # Fallback to .env for backward compatibility, but prefer dynamic tokens
        self.fallback_server_url = os.getenv('PLEX_URL')
        self.fallback_token = os.getenv('PLEX_TOKEN')

        # Cache connections with TTL (10 minutes, max 10 connections)
        self._connection_cache: TTLCache[PlexServer] = TTLCache(
            ttl_seconds=600,
            max_size=10,
            name="plex_connections"
        )

    def connect(
        self,
        token: Optional[str] = None,
        server_url: Optional[str] = None
    ) -> PlexServer:
        """
        Connect to Plex server using provided or fallback credentials.

        Args:
            token: Plex authentication token
            server_url: Plex server URL

        Returns:
            Connected PlexServer instance

        Raises:
            PlexAuthenticationError: If no token is available
            PlexConnectionError: If connection fails
        """
        # Use provided token or fallback
        auth_token = token or self.fallback_token
        plex_url = server_url or self.fallback_server_url

        if not auth_token:
            raise PlexAuthenticationError()

        # Create cache key using hash of token prefix
        cache_key = f"{plex_url}:{hash(auth_token[:10])}"

        # Check cache for existing connection
        cached = self._connection_cache.get(cache_key)
        if cached and self._is_connection_valid(cached):
            return cached

        # Discover server URL from token if not provided
        if not plex_url and auth_token:
            plex_url = self._discover_server_url(auth_token)

        if not plex_url:
            raise PlexConnectionError(
                url="unknown",
                reason="No Plex server URL available. Please configure PLEX_URL in .env"
            )

        # Create new connection
        try:
            plex = PlexServer(plex_url, auth_token)
            # Cache the connection
            self._connection_cache.set(cache_key, plex)
            logger.info(f"Connected to Plex server: {plex.friendlyName}")
            return plex
        except Exception as e:
            raise PlexConnectionError(url=plex_url, reason=str(e))

    def _is_connection_valid(self, plex: PlexServer) -> bool:
        """Check if a cached connection is still valid."""
        try:
            # Quick check - accessing friendlyName validates the connection
            _ = plex.friendlyName
            return True
        except Exception:
            return False

    def _discover_server_url(self, token: str) -> Optional[str]:
        """
        Discover server URL from MyPlex account using token.

        Prefers local connections over remote ones.
        """
        try:
            from plexapi.myplex import MyPlexAccount
            account = MyPlexAccount(token=token)

            # Get servers
            servers = account.resources()
            plex_servers = [
                s for s in servers
                if s.product == 'Plex Media Server' and s.presence
            ]

            if plex_servers:
                # Prefer local connections
                for server in plex_servers:
                    for conn in server.connections:
                        if conn.local:
                            logger.info(f"Discovered local Plex server: {conn.uri}")
                            return conn.uri

                # Fall back to any connection
                if plex_servers[0].connections:
                    uri = plex_servers[0].connections[0].uri
                    logger.info(f"Discovered remote Plex server: {uri}")
                    return uri

        except Exception as e:
            logger.warning(f"Failed to discover server URL: {e}")

        return None

    def get_tv_libraries(self, token: Optional[str] = None) -> List[ShowSection]:
        """Get all TV show libraries."""
        plex = self.connect(token)
        libraries = plex.library.sections()
        return [lib for lib in libraries if lib.type == 'show']

    def get_movie_libraries(self, token: Optional[str] = None) -> List[MovieSection]:
        """Get all movie libraries."""
        plex = self.connect(token)
        libraries = plex.library.sections()
        return [lib for lib in libraries if lib.type == 'movie']

    def get_all_libraries(self, token: Optional[str] = None) -> List[Dict]:
        """Get all TV and movie libraries with type information."""
        plex = self.connect(token)
        libraries = plex.library.sections()
        result = []
        for lib in libraries:
            if lib.type in ('show', 'movie'):
                result.append({
                    'key': lib.key,
                    'title': lib.title,
                    'uuid': lib.uuid,
                    'type': lib.type,
                    'item_count': len(lib.all())
                })
        return result

    def get_tv_library(
        self,
        library_name: Optional[str] = None,
        token: Optional[str] = None
    ) -> ShowSection:
        """
        Get specific TV library by name.

        Args:
            library_name: Name of the library (uses first available if not specified)
            token: Plex authentication token

        Returns:
            ShowSection for the requested library
        """
        plex = self.connect(token)

        if library_name:
            try:
                return plex.library.section(library_name)
            except Exception as e:
                raise PlexConnectionError(
                    url=plex._baseurl,
                    reason=f"Library '{library_name}' not found or not accessible: {e}"
                )

        # No library specified - return first available TV library
        tv_libraries = self.get_tv_libraries(token)
        if not tv_libraries:
            raise PlexConnectionError(
                url=plex._baseurl,
                reason="No TV libraries found"
            )

        return tv_libraries[0]

    def get_all_shows(
        self,
        library_name: Optional[str] = None,
        token: Optional[str] = None
    ) -> List[Show]:
        """Get all TV shows from a library."""
        library = self.get_tv_library(library_name, token)
        return library.all()

    def get_full_image_url(
        self,
        relative_url: str,
        token: Optional[str] = None,
        server_url: Optional[str] = None
    ) -> str:
        """
        Convert relative Plex image URL to full URL with auth.

        Note: For security, prefer using the /api/plex-proxy endpoint
        instead of exposing tokens in URLs.
        """
        if not relative_url:
            return ""
        if relative_url.startswith('http'):
            return relative_url

        # Use provided values or fallbacks
        auth_token = token or self.fallback_token
        plex_url = server_url or self.fallback_server_url

        return f"{plex_url}{relative_url}?X-Plex-Token={auth_token}"

    def get_show(self, show_id: str, token: Optional[str] = None) -> Show:
        """Get specific show by ID."""
        plex = self.connect(token)
        return plex.fetchItem(int(show_id))

    def get_episode_file_info(self, episode: Episode) -> Optional[Dict]:
        """
        Get file path and subtitle info for an episode.

        Returns:
            Dictionary with file info and subtitle lists, or None if no media
        """
        if not episode.media:
            return None

        media = episode.media[0]  # Get first media item (highest quality)
        part = media.parts[0]  # Get first part (main file)

        file_path = part.file
        file_dir = str(Path(file_path).parent)
        file_name = Path(file_path).stem

        # Get embedded subtitle streams
        embedded_subs = self._extract_embedded_subtitles(part)

        # Find external subtitles using the scanner utility
        external_sub_infos = scan_directory_for_subtitles(file_dir, file_name)
        external_subs = [sub.to_dict() for sub in external_sub_infos]

        return {
            'file_path': file_path,
            'file_dir': file_dir,
            'file_name': file_name,
            'embedded_subtitles': embedded_subs,
            'external_subtitles': external_subs,
            'has_subtitles': bool(embedded_subs or external_subs)
        }

    def _extract_embedded_subtitles(self, part) -> List[Dict]:
        """
        Extract embedded subtitle stream information from a media part.

        Only returns truly embedded subtitles (inside the video file),
        not external subtitles that Plex has associated.
        """
        embedded_subs = []

        for stream in part.streams:
            if stream.streamType != PLEX_STREAM_TYPE_SUBTITLE:
                continue

            stream_index = getattr(stream, 'index', -1)
            stream_key = getattr(stream, 'key', None)

            # Detect truly embedded subtitles:
            # - No key (external subs have keys like "/library/streams/xxxxx")
            # - Positive stream index
            # - No external URL
            is_truly_embedded = (
                stream_key is None and
                stream_index >= 0 and
                not (hasattr(stream, 'url') and stream.url)
            )

            if is_truly_embedded:
                language = getattr(stream, 'language', 'Unknown')
                codec = getattr(stream, 'codec', 'SUB')
                forced = getattr(stream, 'forced', False)

                embedded_subs.append({
                    'language': language,
                    'languageCode': getattr(stream, 'languageCode', ''),
                    'codec': codec,
                    'forced': forced,
                    'title': getattr(stream, 'title', ''),
                    'stream_index': stream_index,
                    'id': f"embedded_{stream_index}",
                    'display_name': f"{language} ({codec}){' - Forced' if forced else ''}"
                })

        return embedded_subs

    def get_episode_naming_pattern(self, episode: Episode) -> str:
        """
        Generate Plex-compatible filename base for subtitles.

        Uses the actual video filename to ensure proper matching.
        """
        if episode.media:
            actual_file = Path(episode.media[0].parts[0].file).stem
            return actual_file

        # Fallback to standard pattern
        show_title = episode.grandparentTitle
        season_num = str(episode.parentIndex).zfill(2)
        episode_num = str(episode.index).zfill(2)

        safe_title = "".join(
            c for c in show_title if c.isalnum() or c in ' -_'
        ).strip().replace(' ', '.')

        return f"{safe_title}.S{season_num}E{episode_num}"

    def format_episode_info(
        self,
        episode: Episode,
        token: Optional[str] = None
    ) -> Dict:
        """Format episode information for API response."""
        file_info = self.get_episode_file_info(episode)

        return {
            'id': episode.ratingKey,
            'title': episode.title,
            'show': episode.grandparentTitle,
            'show_id': episode.grandparentRatingKey,
            'season': episode.parentIndex,
            'episode': episode.index,
            'season_episode': f"S{str(episode.parentIndex).zfill(2)}E{str(episode.index).zfill(2)}",
            'file_info': file_info,
            'naming_pattern': self.get_episode_naming_pattern(episode),
            'thumb': self.get_full_image_url(episode.thumb, token),
            'duration': episode.duration,
            'viewed': episode.isWatched
        }

    # =========================================================================
    # Movie-specific methods
    # =========================================================================

    def get_movie_library(
        self,
        library_name: Optional[str] = None,
        token: Optional[str] = None
    ) -> MovieSection:
        """
        Get specific movie library by name.

        Args:
            library_name: Name of the library (uses first available if not specified)
            token: Plex authentication token

        Returns:
            MovieSection for the requested library
        """
        plex = self.connect(token)

        if library_name:
            try:
                lib = plex.library.section(library_name)
                if lib.type != 'movie':
                    raise PlexConnectionError(
                        url=plex._baseurl,
                        reason=f"Library '{library_name}' is not a movie library"
                    )
                return lib
            except Exception as e:
                raise PlexConnectionError(
                    url=plex._baseurl,
                    reason=f"Library '{library_name}' not found or not accessible: {e}"
                )

        # No library specified - return first available movie library
        movie_libraries = self.get_movie_libraries(token)
        if not movie_libraries:
            raise PlexConnectionError(
                url=plex._baseurl,
                reason="No movie libraries found"
            )

        return movie_libraries[0]

    def get_all_movies(
        self,
        library_name: Optional[str] = None,
        token: Optional[str] = None
    ) -> List[Movie]:
        """Get all movies from a library."""
        library = self.get_movie_library(library_name, token)
        return library.all()

    def get_movie(self, movie_id: str, token: Optional[str] = None) -> Movie:
        """Get specific movie by ID."""
        plex = self.connect(token)
        return plex.fetchItem(int(movie_id))

    def get_movie_file_info(self, movie: Movie) -> Optional[Dict]:
        """
        Get file path and subtitle info for a movie.

        Returns:
            Dictionary with file info and subtitle lists, or None if no media
        """
        if not movie.media:
            return None

        media = movie.media[0]  # Get first media item (highest quality)
        part = media.parts[0]  # Get first part (main file)

        file_path = part.file
        file_dir = str(Path(file_path).parent)
        file_name = Path(file_path).stem

        # Get embedded subtitle streams
        embedded_subs = self._extract_embedded_subtitles(part)

        # Find external subtitles using the scanner utility
        external_sub_infos = scan_directory_for_subtitles(file_dir, file_name)
        external_subs = [sub.to_dict() for sub in external_sub_infos]

        return {
            'file_path': file_path,
            'file_dir': file_dir,
            'file_name': file_name,
            'embedded_subtitles': embedded_subs,
            'external_subtitles': external_subs,
            'has_subtitles': bool(embedded_subs or external_subs)
        }

    def get_movie_naming_pattern(self, movie: Movie) -> str:
        """
        Generate Plex-compatible filename base for movie subtitles.

        Uses the actual video filename to ensure proper matching.
        """
        if movie.media:
            actual_file = Path(movie.media[0].parts[0].file).stem
            return actual_file

        # Fallback to movie title
        safe_title = "".join(
            c for c in movie.title if c.isalnum() or c in ' -_'
        ).strip().replace(' ', '.')

        year = getattr(movie, 'year', '')
        if year:
            return f"{safe_title}.{year}"
        return safe_title

    def format_movie_info(
        self,
        movie: Movie,
        token: Optional[str] = None
    ) -> Dict:
        """Format movie information for API response."""
        file_info = self.get_movie_file_info(movie)

        return {
            'id': movie.ratingKey,
            'title': movie.title,
            'year': getattr(movie, 'year', None),
            'summary': getattr(movie, 'summary', ''),
            'file_info': file_info,
            'naming_pattern': self.get_movie_naming_pattern(movie),
            'thumb': self.get_full_image_url(movie.thumb, token),
            'art': self.get_full_image_url(getattr(movie, 'art', ''), token),
            'duration': movie.duration,
            'viewed': movie.isWatched
        }


    def get_recently_added(
        self,
        limit: int = 12,
        token: Optional[str] = None
    ) -> List[Dict]:
        """
        Get recently added items across all libraries (episodes and movies).

        Args:
            limit: Maximum number of items to return
            token: Plex authentication token

        Returns:
            List of recently added items with type information
        """
        plex = self.connect(token)
        results = []
        seen_shows = set()  # Track shows we've already added an episode from

        # Get recently added from all libraries
        try:
            # Use the hub/recentlyAdded endpoint for efficient fetch
            recently_added = plex.library.recentlyAdded()[:limit * 3]  # Fetch extra to handle seasons

            for item in recently_added:
                if len(results) >= limit:
                    break

                if item.type == 'episode':
                    # Skip if we already have an episode from this show
                    show_id = item.grandparentRatingKey
                    if show_id in seen_shows:
                        continue
                    seen_shows.add(show_id)

                    results.append({
                        'type': 'episode',
                        'id': item.ratingKey,
                        'title': item.title,
                        'show_title': item.grandparentTitle,
                        'show_id': show_id,
                        'season': item.parentIndex,
                        'episode': item.index,
                        'season_episode': f"S{str(item.parentIndex).zfill(2)}E{str(item.index).zfill(2)}",
                        'thumb': self.get_full_image_url(item.grandparentThumb or item.thumb, token),
                        'added_at': item.addedAt.isoformat() if item.addedAt else None,
                    })
                elif item.type == 'movie':
                    results.append({
                        'type': 'movie',
                        'id': item.ratingKey,
                        'title': item.title,
                        'year': getattr(item, 'year', None),
                        'thumb': self.get_full_image_url(item.thumb, token),
                        'added_at': item.addedAt.isoformat() if item.addedAt else None,
                    })
                elif item.type == 'season':
                    # For seasons, get the most recent episode
                    show_id = item.parentRatingKey
                    if show_id in seen_shows:
                        continue

                    try:
                        episodes = item.episodes()
                        if episodes:
                            # Get the most recently added episode from this season
                            latest_ep = max(episodes, key=lambda e: e.addedAt if e.addedAt else e.index)
                            seen_shows.add(show_id)
                            results.append({
                                'type': 'episode',
                                'id': latest_ep.ratingKey,
                                'title': latest_ep.title,
                                'show_title': latest_ep.grandparentTitle,
                                'show_id': show_id,
                                'season': latest_ep.parentIndex,
                                'episode': latest_ep.index,
                                'season_episode': f"S{str(latest_ep.parentIndex).zfill(2)}E{str(latest_ep.index).zfill(2)}",
                                'thumb': self.get_full_image_url(latest_ep.grandparentThumb or latest_ep.thumb, token),
                                'added_at': latest_ep.addedAt.isoformat() if latest_ep.addedAt else None,
                            })
                    except Exception as e:
                        logger.warning(f"Failed to get episodes for season: {e}")
                        continue
                elif item.type == 'show':
                    # For shows, get the most recent episode
                    show_id = item.ratingKey
                    if show_id in seen_shows:
                        continue

                    try:
                        episodes = item.episodes()
                        if episodes:
                            latest_ep = max(episodes, key=lambda e: e.addedAt if e.addedAt else e.index)
                            seen_shows.add(show_id)
                            results.append({
                                'type': 'episode',
                                'id': latest_ep.ratingKey,
                                'title': latest_ep.title,
                                'show_title': item.title,
                                'show_id': show_id,
                                'season': latest_ep.parentIndex,
                                'episode': latest_ep.index,
                                'season_episode': f"S{str(latest_ep.parentIndex).zfill(2)}E{str(latest_ep.index).zfill(2)}",
                                'thumb': self.get_full_image_url(item.thumb or latest_ep.thumb, token),
                                'added_at': latest_ep.addedAt.isoformat() if latest_ep.addedAt else None,
                            })
                    except Exception as e:
                        logger.warning(f"Failed to get episodes for show: {e}")
                        continue

        except Exception as e:
            logger.warning(f"Failed to get recently added: {e}")

        return results[:limit]


# Singleton instance
plex_service = PlexService()
