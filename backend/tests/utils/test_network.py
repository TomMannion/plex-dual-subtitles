"""
Tests for utils/network.py
"""

import pytest
from utils.network import (
    get_local_ip,
    is_local_origin,
    get_cors_origins,
    get_cors_regex,
)


class TestGetLocalIp:
    """Tests for get_local_ip function."""

    def test_returns_string(self):
        """Test that get_local_ip returns a string."""
        result = get_local_ip()
        assert isinstance(result, str)

    def test_returns_valid_ip_format(self):
        """Test that returned IP has valid format."""
        result = get_local_ip()
        # Should be either 127.0.0.1 or a real IP
        parts = result.split(".")
        assert len(parts) == 4
        for part in parts:
            assert part.isdigit()
            assert 0 <= int(part) <= 255


class TestIsLocalOrigin:
    """Tests for is_local_origin function."""

    def test_localhost(self):
        """Test localhost detection."""
        assert is_local_origin("http://localhost:5173") is True
        assert is_local_origin("http://localhost:3000") is True
        assert is_local_origin("http://localhost") is True

    def test_loopback(self):
        """Test 127.0.0.1 detection."""
        assert is_local_origin("http://127.0.0.1:5173") is True
        assert is_local_origin("http://127.0.0.1:3000") is True
        assert is_local_origin("http://127.0.0.1") is True

    def test_private_192_168(self):
        """Test 192.168.x.x range detection."""
        assert is_local_origin("http://192.168.1.1:5173") is True
        assert is_local_origin("http://192.168.0.100:3000") is True
        assert is_local_origin("http://192.168.255.255") is True

    def test_private_10(self):
        """Test 10.x.x.x range detection."""
        assert is_local_origin("http://10.0.0.1:5173") is True
        assert is_local_origin("http://10.255.255.255:3000") is True

    def test_private_172_16(self):
        """Test 172.16-31.x.x range detection."""
        assert is_local_origin("http://172.16.0.1:5173") is True
        assert is_local_origin("http://172.31.255.255:3000") is True

        # These should be outside the private range
        assert is_local_origin("http://172.15.0.1:5173") is False
        assert is_local_origin("http://172.32.0.1:5173") is False

    def test_local_domain(self):
        """Test .local domain detection."""
        assert is_local_origin("http://myserver.local:5173") is True
        assert is_local_origin("http://plex.local:3000") is True

    def test_public_ip(self):
        """Test that public IPs are rejected."""
        assert is_local_origin("http://8.8.8.8:5173") is False
        assert is_local_origin("http://1.1.1.1:3000") is False
        assert is_local_origin("http://142.250.80.46") is False

    def test_null_origin(self):
        """Test null origin (file:// or redirect)."""
        assert is_local_origin("null") is True

    def test_empty_origin(self):
        """Test empty or None origin."""
        assert is_local_origin("") is False
        assert is_local_origin(None) is False

    def test_https_allowed(self):
        """Test HTTPS origins are also checked."""
        assert is_local_origin("https://localhost:5173") is True
        assert is_local_origin("https://192.168.1.1:3000") is True

    def test_external_domain(self):
        """Test that external domains are rejected."""
        assert is_local_origin("http://example.com:5173") is False
        assert is_local_origin("http://google.com") is False


class TestGetCorsOrigins:
    """Tests for get_cors_origins function."""

    def test_returns_list(self):
        """Test that get_cors_origins returns a list."""
        result = get_cors_origins("192.168.1.100")
        assert isinstance(result, list)

    def test_includes_localhost(self):
        """Test that localhost origins are included."""
        result = get_cors_origins("192.168.1.100")
        assert "http://localhost:5173" in result
        assert "http://localhost:3000" in result

    def test_includes_loopback(self):
        """Test that 127.0.0.1 origins are included."""
        result = get_cors_origins("192.168.1.100")
        assert "http://127.0.0.1:5173" in result
        assert "http://127.0.0.1:3000" in result

    def test_includes_local_ip(self):
        """Test that local IP origins are included."""
        result = get_cors_origins("192.168.1.100")
        assert "http://192.168.1.100:5173" in result
        assert "http://192.168.1.100:3000" in result


class TestGetCorsRegex:
    """Tests for get_cors_regex function."""

    def test_returns_string(self):
        """Test that get_cors_regex returns a string."""
        result = get_cors_regex()
        assert isinstance(result, str)

    def test_regex_matches_localhost(self):
        """Test regex matches localhost."""
        import re
        pattern = get_cors_regex()

        assert re.match(pattern, "http://localhost:5173") is not None
        assert re.match(pattern, "http://localhost:3000") is not None

    def test_regex_matches_private_ips(self):
        """Test regex matches private IP ranges."""
        import re
        pattern = get_cors_regex()

        assert re.match(pattern, "http://192.168.1.1:5173") is not None
        assert re.match(pattern, "http://10.0.0.1:3000") is not None
        assert re.match(pattern, "http://172.16.0.1:8080") is not None

    def test_regex_matches_local_domain(self):
        """Test regex matches .local domains."""
        import re
        pattern = get_cors_regex()

        assert re.match(pattern, "http://myserver.local:5173") is not None

    def test_regex_rejects_public(self):
        """Test regex rejects public origins."""
        import re
        pattern = get_cors_regex()

        assert re.match(pattern, "http://example.com:5173") is None
        assert re.match(pattern, "http://8.8.8.8:3000") is None
