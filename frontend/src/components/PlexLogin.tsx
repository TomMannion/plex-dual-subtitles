/**
 * PlexLogin — Brutalist authentication form
 *
 * Hard-edged login button with thick borders.
 * Status states with aggressive styling.
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Stack, Text, Button, Spinner, Card, Badge, Arrow, Cross } from '../primitives';

interface PlexLoginProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
}

export const PlexLogin: React.FC<PlexLoginProps> = ({
  onLoginSuccess,
  onLoginError
}) => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [authStep, setAuthStep] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const handleLogin = useCallback(async () => {
    setAuthStep('waiting');
    setError('');

    try {
      await login();
      setAuthStep('idle');
      onLoginSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setAuthStep('error');
      onLoginError?.(errorMessage);
    }
  }, [login, onLoginSuccess, onLoginError]);

  const handleLogout = useCallback(() => {
    logout();
    setAuthStep('idle');
    setError('');
  }, [logout]);

  // Authenticated state - show user profile
  if (isAuthenticated && user) {
    return (
      <Card variant="outline" padding={3} className="login-success">
        <Stack direction="row" align="center" gap={3}>
          <Stack direction="row" align="center" gap={3} className="flex-1">
            {user.thumb && (
              <img
                src={user.thumb}
                alt={user.friendlyName}
                className="login-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <Stack gap={0}>
              <Text variant="label">{user.friendlyName}</Text>
              <Badge variant="success">CONNECTED</Badge>
              {user.email && (
                <Text variant="caption" color="muted">
                  {user.email}
                </Text>
              )}
            </Stack>
          </Stack>

          <Button variant="secondary" size="sm" onClick={handleLogout}>
            SIGN OUT
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap={4}>
      {/* Idle state - Login button */}
      {authStep === 'idle' && (
        <>
          <Button
            variant="primary"
            size="lg"
            onClick={handleLogin}
            disabled={isLoading}
            fullWidth
            className="login-button"
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <Arrow size="md" />
            )}
            {isLoading ? 'CONNECTING...' : 'LOGIN WITH PLEX'}
          </Button>

          <Text variant="caption" color="muted" align="center">
            Connect your Plex server to manage subtitles
          </Text>
        </>
      )}

      {/* Waiting state - Auth in progress */}
      {authStep === 'waiting' && (
        <Card variant="outline" padding={4} className="login-waiting">
          <Stack gap={3} align="center">
            <Spinner size="lg" />
            <Text variant="label">PLEX AUTHENTICATION</Text>
            <Text variant="body" color="secondary" align="center">
              Complete authentication in the popup window to connect to your Plex server
            </Text>
          </Stack>
        </Card>
      )}

      {/* Error state */}
      {authStep === 'error' && error && (
        <Card variant="outline" padding={4} className="login-error">
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <Cross size="md" className="text-accent" />
              <Text variant="label">ACCESS DENIED</Text>
            </Stack>

            <Text variant="body" color="secondary">
              {error}
            </Text>

            <Button
              variant="secondary"
              onClick={() => setAuthStep('idle')}
              fullWidth
            >
              TRY AGAIN
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default PlexLogin;
