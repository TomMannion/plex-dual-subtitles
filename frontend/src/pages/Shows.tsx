/**
 * Shows — TV Shows browse page
 *
 * Brutalist zine-style header with chaotic masonry grid.
 * B&W images with color-on-hover effect.
 */

import React, { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
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
import type { Show } from '../types';

export const Shows: React.FC = () => {
  const { libraryName } = useParams<{ libraryName: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useViewMode('grid');

  const selectedLibrary = libraryName ? decodeURIComponent(libraryName) : '';

  // Fetch shows
  const { data: showsData, isLoading } = useQuery({
    queryKey: ['shows', selectedLibrary],
    queryFn: () => apiClient.getShows(selectedLibrary || undefined, undefined, true),
    staleTime: 5 * 60 * 1000,
  });

  // Filter shows based on search term
  const filteredShows =
    showsData?.shows.filter((show: Show) =>
      show.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Fetch counts for each show
  const countQueries = useQueries({
    queries: filteredShows.map((show) => ({
      queryKey: ['show-counts', show.id],
      queryFn: () => apiClient.getShowCounts(show.id),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    })),
  });

  const showCounts = new Map<
    string,
    { episode_count: number; season_count: number }
  >();
  countQueries.forEach((query, index) => {
    if (query.data && filteredShows[index]) {
      showCounts.set(filteredShows[index].id, query.data);
    }
  });

  const totalEpisodes = filteredShows.reduce((acc, show) => {
    const counts = showCounts.get(show.id);
    return acc + (counts?.episode_count || 0);
  }, 0);

  const isLoadingCounts = countQueries.some((q) => q.isLoading);
  const pageTitle = selectedLibrary || 'TV SHOWS';

  return (
    <Box className="shows-page">
      {/* Zine-Style Header */}
      <Box className="zine-header" p={4}>
        <div className="zine-header-content">
          {/* Main title - giant */}
          <h1 className="zine-title">{pageTitle}</h1>

          {/* Subtitle */}
          <p className="zine-subtitle">Browse your TV collection</p>

          {/* Scattered stat stamps */}
          <div className="zine-stamps">
            <div className="zine-stamp zine-stamp-1">
              <span className="zine-stamp-number">{showsData?.count || 0}</span>
              <span className="zine-stamp-label">SHOWS</span>
            </div>
            {!isLoadingCounts && totalEpisodes > 0 && (
              <div className="zine-stamp zine-stamp-2">
                <span className="zine-stamp-number">{totalEpisodes.toLocaleString()}</span>
                <span className="zine-stamp-label">EPISODES</span>
              </div>
            )}
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

      {/* Shows Grid */}
      <Box py={4}>
        <Box px={4} mb={3}>
          <Stack direction="row" align="center" justify="between">
            <Heading level={2}>ALL SHOWS</Heading>
            <Text variant="caption" color="muted">
              {filteredShows.length} {filteredShows.length === 1 ? 'SHOW' : 'SHOWS'}
            </Text>
          </Stack>
        </Box>

        {isLoading ? (
          <Box p={8} display="flex" className="justify-center">
            <Spinner size="lg" />
          </Box>
        ) : filteredShows.length > 0 ? (
          <Box px={4}>
            {viewMode === 'grid' ? (
              <MediaGrid chaos>
                {filteredShows.map((show) => {
                  const counts = showCounts.get(show.id);
                  return (
                    <MediaCard
                      key={show.id}
                      id={show.id}
                      title={show.title}
                      subtitle={counts ? `${counts.season_count}S · ${counts.episode_count}E` : undefined}
                      imageUrl={show.thumb}
                      type="show"
                      href={`/shows/${show.id}`}
                      badge={show.year?.toString()}
                    />
                  );
                })}
              </MediaGrid>
            ) : (
              <AlphabetList
                items={filteredShows}
                renderItem={(show) => {
                  const counts = showCounts.get(show.id);
                  return (
                    <MediaListItem
                      key={show.id}
                      id={show.id}
                      title={show.title}
                      subtitle={counts ? `${counts.season_count}S · ${counts.episode_count}E` : undefined}
                      imageUrl={show.thumb}
                      href={`/shows/${show.id}`}
                      year={show.year}
                    />
                  );
                }}
              />
            )}
          </Box>
        ) : (
          <Box px={4}>
            <Card variant="outline" padding={6}>
              <Stack gap={3} align="center">
                <Stop size="xl" className="text-muted" />
                <Heading level={3}>NO SHOWS FOUND</Heading>
                <Text variant="body" color="secondary" align="center">
                  {searchTerm
                    ? 'Try adjusting your search terms.'
                    : 'No shows available in this library.'}
                </Text>
              </Stack>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};
