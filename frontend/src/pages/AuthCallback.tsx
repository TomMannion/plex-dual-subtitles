/**
 * AuthCallback — Brutalist authentication success page
 *
 * Shown in the popup after Plex authentication completes.
 */

import { useEffect } from 'react';
import { Card, Stack, Text, Heading, Spinner, Tick } from '../primitives';

export const AuthCallback: React.FC = () => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.close();
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <Card variant="elevated" padding={6} className="alert-success">
          <Stack gap={4} align="center" className="text-center">
            <Tick size="xl" className="text-success" />
            <Heading level={2} className="text-success">
              Authentication Successful
            </Heading>
            <Text color="muted">
              You can close this window now.
            </Text>
            <Stack direction="row" align="center" gap={2}>
              <Spinner />
              <Text variant="caption" color="muted">
                Closing automatically...
              </Text>
            </Stack>
          </Stack>
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback;
