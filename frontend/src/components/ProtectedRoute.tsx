/**
 * ProtectedRoute — Authentication gate with brutalist login
 *
 * Full-bleed centered auth layout with thick borders.
 * Hard shadows and aggressive typography.
 */

import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlexLogin from './PlexLogin';
import { Box, Stack, Heading, Text, Spinner, Divider, Card } from '../primitives';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state - brutalist spinner
  if (isLoading) {
    return (
      <Box
        minHeight="screen"
        bg="primary"
        display="flex"
        className="items-center justify-center"
      >
        <Stack gap={4} align="center">
          <Spinner size="lg" />
          <Text variant="label" color="muted">
            AUTHENTICATING...
          </Text>
        </Stack>
      </Box>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return fallback || (
      <Box
        minHeight="screen"
        bg="primary"
        display="flex"
        className="items-center justify-center auth-layout"
        p={4}
      >
        <Box className="auth-container">
          {/* Header */}
          <Stack gap={2} align="center" className="auth-header">
            <Heading level={1} align="center" className="auth-title">
              PLEX DUALSUB
            </Heading>
            <Text variant="body" color="secondary" align="center">
              PROFESSIONAL SUBTITLE MANAGEMENT
            </Text>
          </Stack>

          <Divider thickness="thick" spacing={4} />

          {/* Login Card */}
          <Card variant="elevated" padding={4}>
            <PlexLogin />
          </Card>

          {/* Footer note */}
          <Box mt={4}>
            <Text variant="caption" color="muted" align="center">
              CONNECT YOUR PLEX SERVER TO BEGIN
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default ProtectedRoute;
