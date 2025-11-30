/**
 * ShowDetail — TV Show detail page
 *
 * Brutalist zine-style header with episode grid.
 * Hard shadows, thick borders, aggressive typography.
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Arrow, Dot, Play, Layers, Tick, Cross, Target, Plus } from '../primitives';
import { apiClient } from '../lib/api';
import { BulkDualSubtitleWizard } from '../components/bulk/BulkDualSubtitleWizard';
import { fixPlexImageUrl } from '../utils/imageUtils';
import {
  Box,
  Stack,
  Heading,
  Text,
  Input,
  Select,
  Card,
  Button,
  Badge,
  Spinner,
  Divider,
} from '../primitives';
import type { Episode } from '../types';

export const ShowDetail: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [showBulkWizard, setShowBulkWizard] = useState(false);

  // Fetch show details
  const { data: show, isLoading } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => apiClient.getShowDetail(showId!),
    enabled: !!showId,
  });

  // Filter episodes
  const filteredEpisodes =
    show?.episodes.filter((episode: Episode) => {
      const matchesSearch = episode.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSeason =
        !selectedSeason || episode.season.toString() === selectedSeason;
      return matchesSearch && matchesSeason;
    }) || [];

  // Group episodes by season
  const episodesBySeason = filteredEpisodes.reduce((acc, episode) => {
    const season = episode.season;
    if (!acc[season]) acc[season] = [];
    acc[season].push(episode);
    return acc;
  }, {} as Record<number, Episode[]>);

  if (isLoading) {
    return (
      <Box p={4} display="flex" className="justify-center items-center" minHeight="screen">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!show) {
    return (
      <Box p={4}>
        <Card variant="outline" padding={6}>
          <Stack gap={4} align="center">
            <Heading level={2}>SHOW NOT FOUND</Heading>
            <Link to="/shows">
              <Button variant="primary">
                <Arrow size="sm" rotate={180} />
                BACK TO SHOWS
              </Button>
            </Link>
          </Stack>
        </Card>
      </Box>
    );
  }

  const backgroundImageUrl = fixPlexImageUrl(show.art) || fixPlexImageUrl(show.thumb);

  return (
    <Box className="show-detail" minHeight="screen">
      {/* Background Image */}
      {backgroundImageUrl && (
        <div
          className="show-detail-bg"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      {/* Content */}
      <Box className="show-detail-content">
        {/* Zine-Style Header */}
        <Box className="zine-header zine-header-detail" p={4}>
          <div className="zine-header-content">
            {/* Back button */}
            <Link to="/shows" className="zine-back-link">
              <Button variant="secondary" className="back-btn">
                <Arrow size="sm" rotate={180} />
              </Button>
            </Link>

            {/* Main title - giant */}
            <h1 className="zine-title zine-title-detail">{show.title}</h1>

            {/* Subtitle with year and metadata */}
            <Stack direction="row" gap={2} className="zine-meta" wrap>
              <Badge variant="default">
                <Dot size="xs" />
                {show.year}
              </Badge>
              <Badge variant="default">
                <Play size="xs" />
                {show.episode_count} EPISODES
              </Badge>
              <Badge variant="accent">
                <Layers size="xs" />
                {show.subtitle_coverage} COVERAGE
              </Badge>
            </Stack>

            {/* Decorative pattern blocks */}
            <div className="zine-pattern zine-pattern-dots" aria-hidden="true" />
            <div className="zine-pattern zine-pattern-lines" aria-hidden="true" />
          </div>

          {/* Scattered stat stamps */}
          <div className="zine-stamps zine-stamps-detail">
            <div className="zine-stamp zine-stamp-1">
              <span className="zine-stamp-number">{show.episode_count}</span>
              <span className="zine-stamp-label">EPISODES</span>
            </div>
            <div className="zine-stamp zine-stamp-2">
              <span className="zine-stamp-number">{show.episodes_with_subtitles}</span>
              <span className="zine-stamp-label">WITH SUBS</span>
            </div>
            {/* Hash pattern behind stamps */}
            <div className="zine-pattern zine-pattern-hash" aria-hidden="true" />
          </div>
        </Box>

        {/* Summary */}
        {show.summary && (
          <Box px={4} mt={4}>
            <Card variant="outline" padding={4}>
              <Text variant="body" color="secondary">
                {show.summary}
              </Text>
            </Card>
          </Box>
        )}

        {/* Stats Row */}
        <Box px={4} mt={4} className="mobile-px-2">
          <div className="stats-grid-responsive">
            <Card variant="elevated" padding={3} className="stat-card-mini">
              <Stack direction="row" gap={2} align="center">
                <Heading level={3} className="text-accent">{show.total_external_subtitles}</Heading>
                <Text variant="caption" color="muted">EXTERNAL</Text>
              </Stack>
            </Card>
            <Card variant="elevated" padding={3} className="stat-card-mini">
              <Stack direction="row" gap={2} align="center">
                <Heading level={3}>{show.total_embedded_subtitles}</Heading>
                <Text variant="caption" color="muted">EMBEDDED</Text>
              </Stack>
            </Card>
          </div>
        </Box>

        {/* Bulk Action CTA */}
        <Box px={4} mt={4} mb={4} className="mobile-px-2">
          <Card
            variant="outline"
            padding={4}
            interactive
            className="bulk-cta cta-card-responsive"
            onClick={() => setShowBulkWizard(true)}
          >
            <Stack direction="row" align="center" gap={4} className="cta-card-responsive">
              <Box className="bulk-cta-icon cta-icon">
                <Plus size="lg" />
              </Box>
              <Stack gap={1} className="flex-1">
                <Heading level={3}>CREATE BULK DUAL SUBTITLES</Heading>
                <Text variant="body" color="secondary">
                  Generate dual-language subtitles for the entire series with
                  smart language detection.
                </Text>
              </Stack>
              <Arrow size="lg" className="bulk-cta-arrow mobile-hidden" />
            </Stack>
          </Card>
        </Box>

        <Divider thickness="thick" spacing={4} />

        {/* Controls bar */}
        <Box px={4} py={3} className="zine-controls-bar mobile-px-2">
          <div className="controls-bar-responsive">
            <Box className="search-container mobile-full-width">
              <Target size="sm" className="search-icon" />
              <Input
                placeholder="SEARCH EPISODES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </Box>
            <div className="controls-row">
              <Select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="mobile-full-width"
              >
                <option value="">ALL SEASONS</option>
                {show.seasons.map((season) => (
                  <option key={season.id} value={season.index}>
                    SEASON {season.index} ({season.episode_count} EPS)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Box>

        <Divider thickness="thick" spacing={0} />

        {/* Episodes */}
        <Box p={4}>
          {Object.keys(episodesBySeason).length > 0 ? (
            <Stack gap={6}>
              {Object.entries(episodesBySeason)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([season, episodes]) => (
                  <Box key={season}>
                    <Stack direction="row" align="center" gap={2} className="mb-3">
                      <Play size="md" className="text-accent" />
                      <Heading level={3}>SEASON {season}</Heading>
                      <Badge variant="default">{episodes.length} EPS</Badge>
                    </Stack>
                    <div className="episode-grid">
                      {episodes.map((episode) => (
                        <EpisodeCard key={episode.id} episode={episode} />
                      ))}
                    </div>
                  </Box>
                ))}
            </Stack>
          ) : (
            <Card variant="outline" padding={6}>
              <Stack gap={3} align="center">
                <Play size="xl" className="text-muted" />
                <Heading level={3}>NO EPISODES FOUND</Heading>
                <Text variant="body" color="secondary">
                  Try adjusting your search or season filter.
                </Text>
              </Stack>
            </Card>
          )}
        </Box>

        {/* Bulk Wizard Modal */}
        {showBulkWizard && (
          <BulkDualSubtitleWizard
            showId={showId!}
            showTitle={show.title}
            onClose={() => setShowBulkWizard(false)}
            onComplete={() => {}}
          />
        )}
      </Box>
    </Box>
  );
};

const EpisodeCard: React.FC<{ episode: Episode }> = ({ episode }) => {
  const hasSubtitles = episode.file_info?.has_subtitles || false;
  const externalCount = episode.file_info?.external_subtitles?.length || 0;
  const embeddedCount = episode.file_info?.embedded_subtitles?.length || 0;

  return (
    <Link to={`/episodes/${episode.id}`} className="episode-card">
      <Card variant="outline" padding={3} interactive className="h-full">
        <Stack gap={2}>
          <Stack direction="row" justify="between" align="start">
            <Stack gap={0} className="flex-1">
              <Text variant="label" className="episode-title">
                {episode.season_episode}: {episode.title}
              </Text>
              <Stack direction="row" gap={2} align="center">
                {episode.viewed && (
                  <Badge variant="success" className="episode-badge">
                    <Tick size="xs" />
                    WATCHED
                  </Badge>
                )}
                {episode.duration && (
                  <Text variant="caption" color="muted">
                    {Math.round(episode.duration / 60000)} MIN
                  </Text>
                )}
              </Stack>
            </Stack>

            <Box>
              {hasSubtitles ? (
                <Badge variant="success">
                  <Tick size="xs" />
                  {externalCount + embeddedCount}
                </Badge>
              ) : (
                <Badge variant="accent">
                  <Cross size="xs" />
                  0
                </Badge>
              )}
            </Box>
          </Stack>

          {hasSubtitles && (
            <Stack direction="row" gap={3}>
              {externalCount > 0 && (
                <Text variant="caption" color="muted">
                  <Arrow size="xs" rotate={90} /> {externalCount} EXT
                </Text>
              )}
              {embeddedCount > 0 && (
                <Text variant="caption" color="muted">
                  <Layers size="xs" /> {embeddedCount} EMB
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
    </Link>
  );
};
