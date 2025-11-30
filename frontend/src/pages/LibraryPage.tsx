/**
 * LibraryPage — Router for library types
 *
 * Determines show/movie view based on Plex library type.
 * Brutalist loading and error states.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Shows } from './Shows';
import { Movies } from './Movies';
import { Box, Stack, Heading, Text, Spinner, Card } from '../primitives';

export const LibraryPage: React.FC = () => {
  const { libraryName } = useParams<{ libraryName: string }>();
  const decodedLibraryName = libraryName ? decodeURIComponent(libraryName) : '';

  // Fetch libraries to determine the type
  const { data: libraries, isLoading, error } = useQuery({
    queryKey: ['libraries'],
    queryFn: apiClient.getLibraries,
  });

  // Find the matching library
  const library = libraries?.libraries.find(
    (lib) => lib.title === decodedLibraryName
  );

  // Loading state
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
            LOADING LIBRARY...
          </Text>
        </Stack>
      </Box>
    );
  }

  // Error state
  if (error || !library) {
    return (
      <Box
        minHeight="screen"
        bg="primary"
        display="flex"
        className="items-center justify-center"
        p={4}
      >
        <Card variant="outline" padding={6}>
          <Stack gap={3} align="center">
            <Heading level={2}>LIBRARY NOT FOUND</Heading>
            <Text variant="body" color="secondary" align="center">
              Could not find a library named "{decodedLibraryName}"
            </Text>
          </Stack>
        </Card>
      </Box>
    );
  }

  // Render the appropriate page based on library type
  if (library.type === 'movie') {
    return <Movies />;
  }

  // Default to Shows for 'show' type
  return <Shows />;
};
