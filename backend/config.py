"""
Configuration management for Plex Dual Subtitle Manager
"""

import logging
import tempfile
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class SubtitleConfig(BaseSettings):
    """Subtitle processing configuration"""

    model_config = SettingsConfigDict(
        env_prefix="DUALSUB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Language defaults
    default_primary_lang: str = Field("ja", description="Default primary subtitle language")
    default_secondary_lang: str = Field("en", description="Default secondary subtitle language")

    # Synchronization settings
    enable_sync_by_default: bool = Field(True, description="Enable subtitle synchronization by default")
    sync_timeout_seconds: int = Field(120, description="Maximum time for sync operations")
    max_sync_offset_seconds: int = Field(60, description="Maximum allowed sync offset")

    # Font settings for ASS format
    default_font_name: str = Field("Arial", description="Default font for subtitles")
    primary_font_size: int = Field(20, description="Primary subtitle font size")
    secondary_font_size: int = Field(18, description="Secondary subtitle font size")
    primary_color: str = Field("#FFFFFF", description="Primary subtitle color")
    secondary_color: str = Field("#FFFF00", description="Secondary subtitle color")

    # File processing
    supported_subtitle_formats: List[str] = Field(
        default_factory=lambda: ['.srt', '.ass', '.ssa', '.vtt', '.sub'],
        description="Supported subtitle file extensions"
    )

    # Validation settings
    video_sync_tolerance_ms: int = Field(5000, description="Tolerance for video sync validation (ms)")
    video_sync_warning_threshold_ms: int = Field(30000, description="Warning threshold for video sync (ms)")


class PlexConfig(BaseSettings):
    """Plex server configuration"""

    model_config = SettingsConfigDict(
        env_prefix="PLEX_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    url: str = Field("http://localhost:32400", description="Plex server URL")
    token: Optional[str] = Field(None, description="Plex authentication token")

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Plex URL must start with http:// or https://')
        return v.rstrip('/')


class AppConfig(BaseSettings):
    """Main application configuration"""

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API settings
    api_host: str = Field("127.0.0.1", description="API host")
    api_port: int = Field(8000, description="API port")
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://localhost:8080"
        ],
        description="Allowed CORS origins"
    )

    # File paths
    temp_dir: Path = Field(
        default_factory=lambda: Path(tempfile.gettempdir()) / "dualsub",
        description="Temporary directory for processing"
    )
    backup_dir: Optional[Path] = Field(None, description="Directory for subtitle backups")

    # Performance settings
    max_workers: int = Field(4, description="Maximum worker threads for async operations")

    # Feature flags
    enable_language_detection: bool = Field(True, description="Enable automatic language detection")
    enable_auto_backup: bool = Field(True, description="Automatically backup files before modification")

    @field_validator('temp_dir', 'backup_dir', mode='after')
    @classmethod
    def create_directories(cls, v: Optional[Path]) -> Optional[Path]:
        if v:
            v.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Created directory: {v}")
        return v


class Settings:
    """Singleton settings manager"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.app = AppConfig()
        self.plex = PlexConfig()
        self.subtitle = SubtitleConfig()
        self._initialized = True
        logger.debug("Settings initialized")

    def reload(self) -> None:
        """Reload configuration from environment and files"""
        self.app = AppConfig()
        self.plex = PlexConfig()
        self.subtitle = SubtitleConfig()
        logger.info("Settings reloaded")


# Global settings instance
settings = Settings()
