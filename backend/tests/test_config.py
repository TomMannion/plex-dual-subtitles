"""
Tests for config.py
"""

import pytest
import tempfile
from pathlib import Path

from config import SubtitleConfig, PlexConfig, AppConfig, Settings


class TestSubtitleConfig:
    """Tests for SubtitleConfig."""

    def test_default_values(self):
        """Test default configuration values."""
        config = SubtitleConfig()

        assert config.default_primary_lang == "ja"
        assert config.default_secondary_lang == "en"
        assert config.enable_sync_by_default is True
        assert config.sync_timeout_seconds == 120
        assert config.default_font_name == "Arial"
        assert config.primary_font_size == 20
        assert config.secondary_font_size == 18

    def test_supported_formats(self):
        """Test supported subtitle formats list."""
        config = SubtitleConfig()

        assert '.srt' in config.supported_subtitle_formats
        assert '.ass' in config.supported_subtitle_formats
        assert '.ssa' in config.supported_subtitle_formats
        assert '.vtt' in config.supported_subtitle_formats

    def test_color_defaults(self):
        """Test default color values."""
        config = SubtitleConfig()

        assert config.primary_color == "#FFFFFF"
        assert config.secondary_color == "#FFFF00"


class TestPlexConfig:
    """Tests for PlexConfig."""

    def test_default_url(self):
        """Test default Plex URL."""
        config = PlexConfig()

        assert config.url == "http://localhost:32400"
        assert config.token is None

    def test_url_validation_http(self):
        """Test URL validation accepts http."""
        config = PlexConfig(url="http://192.168.1.100:32400")
        assert config.url == "http://192.168.1.100:32400"

    def test_url_validation_https(self):
        """Test URL validation accepts https."""
        config = PlexConfig(url="https://plex.example.com:32400")
        assert config.url == "https://plex.example.com:32400"

    def test_url_trailing_slash_removed(self):
        """Test trailing slash is removed from URL."""
        config = PlexConfig(url="http://localhost:32400/")
        assert config.url == "http://localhost:32400"

    def test_url_validation_rejects_invalid(self):
        """Test URL validation rejects invalid URLs."""
        with pytest.raises(ValueError, match="must start with http"):
            PlexConfig(url="ftp://localhost:32400")


class TestAppConfig:
    """Tests for AppConfig."""

    def test_default_values(self):
        """Test default application configuration."""
        config = AppConfig()

        assert config.api_host == "127.0.0.1"
        assert config.api_port == 8000
        assert config.max_workers == 4
        assert config.enable_language_detection is True
        assert config.enable_auto_backup is True

    def test_cors_origins_default(self):
        """Test default CORS origins."""
        config = AppConfig()

        assert "http://localhost:3000" in config.cors_origins
        assert "http://localhost:5173" in config.cors_origins

    def test_temp_dir_created(self):
        """Test temp directory is created."""
        config = AppConfig()

        assert config.temp_dir.exists()
        assert config.temp_dir.is_dir()

    def test_custom_temp_dir(self):
        """Test custom temp directory is created."""
        with tempfile.TemporaryDirectory() as tmpdir:
            custom_path = Path(tmpdir) / "custom_temp"
            config = AppConfig(temp_dir=custom_path)

            assert config.temp_dir == custom_path
            assert config.temp_dir.exists()

    def test_backup_dir_none_by_default(self):
        """Test backup directory is None by default."""
        config = AppConfig()
        assert config.backup_dir is None


class TestSettings:
    """Tests for Settings singleton."""

    def test_settings_singleton(self):
        """Test Settings is a singleton."""
        settings1 = Settings()
        settings2 = Settings()

        assert settings1 is settings2

    def test_settings_has_all_configs(self):
        """Test Settings has all config objects."""
        settings = Settings()

        assert hasattr(settings, 'app')
        assert hasattr(settings, 'plex')
        assert hasattr(settings, 'subtitle')
        assert isinstance(settings.app, AppConfig)
        assert isinstance(settings.plex, PlexConfig)
        assert isinstance(settings.subtitle, SubtitleConfig)

    def test_settings_reload(self):
        """Test settings can be reloaded."""
        settings = Settings()

        # Store original value
        original_port = settings.app.api_port

        # Reload should not raise
        settings.reload()

        # Values should be the same after reload
        assert settings.app.api_port == original_port


class TestGlobalSettings:
    """Tests for global settings instance."""

    def test_global_settings_available(self):
        """Test global settings instance is available."""
        from config import settings

        assert settings is not None
        assert isinstance(settings, Settings)

    def test_global_settings_is_singleton(self):
        """Test global settings is the singleton."""
        from config import settings

        new_settings = Settings()
        assert settings is new_settings
