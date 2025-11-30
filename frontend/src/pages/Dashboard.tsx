/**
 * Dashboard — Home page with recently added content
 *
 * Brutalist chaotic grid layout. Asymmetric card placements.
 * Background job status floating panel.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import {
  Box,
  Stack,
  Heading,
  Text,
  Card,
  Divider,
  Spinner,
} from '../primitives';
import { MediaCard, MediaGrid } from '../components/media';
import { JobStatusWidget } from '../components/jobs/JobStatusWidget';
import { JobDetailModal } from '../components/jobs/JobDetailModal';

import type { RecentlyAddedItem } from '../types/api';

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Check for job query parameter on mount
  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId) {
      setSelectedJobId(jobId);
      // Clear the query parameter from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Get recently added items
  const { data: recentlyAddedData, isLoading } = useQuery({
    queryKey: ['recently-added'],
    queryFn: () => apiClient.getRecentlyAdded(10),
  });

  // Get total library counts
  const { data: showsData } = useQuery({
    queryKey: ['shows-count'],
    queryFn: () => apiClient.getShows(undefined, 1, true), // Just get count, limit 1
  });

  const { data: moviesData } = useQuery({
    queryKey: ['movies-count'],
    queryFn: () => apiClient.getMovies(undefined, 1), // Just get count, limit 1
  });

  // Library totals
  const totalShows = showsData?.count || 0;
  const totalMovies = moviesData?.count || 0;

  return (
    <Box className="dashboard">
      {/* Zine-Style Header */}
      <Box className="zine-header" p={4}>
        <div className="zine-header-content">
          {/* Main title - giant and rotated */}
          <h1 className="zine-title">DASHBOARD</h1>

          {/* Subtitle offset */}
          <p className="zine-subtitle">Manage your dual subtitles</p>

          {/* Scattered stat stamps - library totals */}
          <div className="zine-stamps">
            {totalMovies > 0 && (
              <div className="zine-stamp zine-stamp-1">
                <span className="zine-stamp-number">{totalMovies}</span>
                <span className="zine-stamp-label">FILMS</span>
              </div>
            )}
            {totalShows > 0 && (
              <div className="zine-stamp zine-stamp-2">
                <span className="zine-stamp-number">{totalShows}</span>
                <span className="zine-stamp-label">SHOWS</span>
              </div>
            )}
          </div>

          {/* Decorative pattern blocks */}
          <div className="zine-pattern zine-pattern-dots" aria-hidden="true" />
          <div className="zine-pattern zine-pattern-lines" aria-hidden="true" />
          <div className="zine-pattern zine-pattern-hash" aria-hidden="true" />
        </div>
      </Box>

      <Divider thickness="thick" spacing={0} />

      {/* Job Status Widget - own section below header */}
      <Box px={4} py={3} mt={6}>
        <JobStatusWidget
          onViewJobDetails={setSelectedJobId}
        />
      </Box>

      <Divider thickness="thick" spacing={0} />

      {/* Recently Added Section - Full bleed masonry grid */}
      <Box py={4}>
        <Box px={4} mb={3}>
          <Stack direction="row" align="center" justify="between">
            <Heading level={2}>RECENTLY ADDED</Heading>
            <Text variant="caption" color="muted">
              {recentlyAddedData?.items?.length || 0} ITEMS
            </Text>
          </Stack>
        </Box>

        {isLoading ? (
          <Box p={8} display="flex" className="justify-center">
            <Spinner size="lg" />
          </Box>
        ) : recentlyAddedData?.items && recentlyAddedData.items.length > 0 ? (
          <Box px={4}>
          <MediaGrid chaos>
            {recentlyAddedData.items.map((item: RecentlyAddedItem) => (
              <MediaCard
                key={`${item.type}-${item.id}`}
                id={item.id}
                title={item.type === 'episode' ? item.show_title || item.title : item.title}
                subtitle={item.type === 'episode' ? item.season_episode : item.year?.toString()}
                imageUrl={item.thumb}
                type={item.type}
                href={
                  item.type === 'episode'
                    ? `/episodes/${item.id}`
                    : `/movies/${item.id}`
                }
                badge={item.type === 'episode' ? item.season_episode : 'FILM'}
              />
            ))}
          </MediaGrid>
          </Box>
        ) : (
          <Box px={4}>
            <Card variant="outline" padding={4}>
              <Text color="muted" align="center">
                No recently added items found.
              </Text>
            </Card>
          </Box>
        )}
      </Box>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onJobComplete={() => {
            // Refresh data on job complete
          }}
        />
      )}
    </Box>
  );
}

// Keep default export for routing compatibility
export default Dashboard;
