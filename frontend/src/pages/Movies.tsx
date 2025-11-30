/**
 * Movies — Movies browse page
 *
 * Brutalist zine-style header with chaotic masonry grid.
 * B&W images with color-on-hover effect.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { MediaCard, MediaGrid, MediaListItem, AlphabetList } from '../components/media';
import {
  Box,
  Stack,
  Heading,
  Text,
  Input,
  Card,
  Spinner,
  Divider,
  Target,
  GridIcon,
  Bars,
  Stop,
} from '../primitives';
import { useViewMode } from '../hooks/useViewMode';
import type { Movie } from '../types';

export const Movies: React.FC = () => {
  const { libraryName } = useParams<{ libraryName: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useViewMode('grid');

  const selectedLibrary = libraryName ? decodeURIComponent(libraryName) : '';

  // Fetch movies
  const { data: moviesData, isLoading } = useQuery({
    queryKey: ['movies', selectedLibrary],
    queryFn: () => apiClient.getMovies(selectedLibrary || undefined),
    staleTime: 5 * 60 * 1000,
  });

  // Filter movies based on search term
  const filteredMovies =
    moviesData?.movies.filter((movie: Movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const pageTitle = selectedLibrary || 'FILMS';

  return (
    <Box className="movies-page">
      {/* Zine-Style Header */}
      <Box className="zine-header" p={4}>
        <div className="zine-header-content">
          {/* Main title - giant */}
          <h1 className="zine-title">{pageTitle}</h1>

          {/* Subtitle */}
          <p className="zine-subtitle">Browse your film collection</p>

          {/* Scattered stat stamps */}
          <div className="zine-stamps">
            <div className="zine-stamp zine-stamp-1">
              <span className="zine-stamp-number">{moviesData?.count || 0}</span>
              <span className="zine-stamp-label">FILMS</span>
            </div>
          </div>

          {/* Decorative pattern blocks */}
          <div className="zine-pattern zine-pattern-dots" aria-hidden="true" />
          <div className="zine-pattern zine-pattern-lines" aria-hidden="true" />
          <div className="zine-pattern zine-pattern-hash" aria-hidden="true" />
        </div>
      </Box>

      {/* Controls bar - separate from header */}
      <Box px={4} py={3} className="zine-controls-bar mobile-px-2">
        <div className="controls-bar-responsive">
          <Box className="search-container mobile-full-width">
            <Target size="sm" className="search-icon" />
            <Input
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </Box>
          <div className="controls-row">
            {/* View Toggle */}
            <Stack direction="row" className="view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                aria-label="Grid view"
              >
                <GridIcon size="sm" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                aria-label="List view"
              >
                <Bars size="sm" />
              </button>
            </Stack>
          </div>
        </div>
      </Box>

      <Divider thickness="thick" spacing={0} />

      {/* Movies Grid */}
      <Box py={4}>
        <Box px={4} mb={3}>
          <Stack direction="row" align="center" justify="between">
            <Heading level={2}>ALL FILMS</Heading>
            <Text variant="caption" color="muted">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'FILM' : 'FILMS'}
            </Text>
          </Stack>
        </Box>

        {isLoading ? (
          <Box p={8} display="flex" className="justify-center">
            <Spinner size="lg" />
          </Box>
        ) : filteredMovies.length > 0 ? (
          <Box px={4}>
            {viewMode === 'grid' ? (
              <MediaGrid chaos>
                {filteredMovies.map((movie) => (
                  <MediaCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    imageUrl={movie.thumb}
                    type="movie"
                    href={`/movies/${movie.id}`}
                    badge={movie.year?.toString()}
                  />
                ))}
              </MediaGrid>
            ) : (
              <AlphabetList
                items={filteredMovies}
                renderItem={(movie) => (
                  <MediaListItem
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    imageUrl={movie.thumb}
                    href={`/movies/${movie.id}`}
                    year={movie.year}
                  />
                )}
              />
            )}
          </Box>
        ) : (
          <Box px={4}>
            <Card variant="outline" padding={6}>
              <Stack gap={3} align="center">
                <Stop size="xl" className="text-muted" />
                <Heading level={3}>NO FILMS FOUND</Heading>
                <Text variant="body" color="secondary" align="center">
                  {searchTerm
                    ? 'Try adjusting your search terms.'
                    : 'No films available in this library.'}
                </Text>
              </Stack>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};
