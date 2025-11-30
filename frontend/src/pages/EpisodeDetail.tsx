/**
 * EpisodeDetail — Episode detail page with subtitle management
 *
 * Brutalist asymmetric layout with upload, dual creation, and subtitle list.
 * Hard shadows, thick borders, aggressive typography.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Arrow, Stop, Layers, Dot, Play } from '../primitives';
import { apiClient } from '../lib/api';
import { SubtitleManager } from '../components/SubtitleManager';
import { useToast } from '../components/ui/Toaster';
import {
  Box,
  Stack,
  Heading,
  Card,
  Button,
  Badge,
  Spinner,
} from '../primitives';


export const EpisodeDetail: React.FC = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const { addToast } = useToast();

  // Fetch episode details
  const { data: episode, isLoading } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => apiClient.getEpisodeDetail(episodeId!),
    enabled: !!episodeId,
  });

  // Fetch episode subtitles
  const { data: subtitles, refetch: refetchSubtitles } = useQuery({
    queryKey: ['episode-subtitles', episodeId],
    queryFn: () => apiClient.getEpisodeSubtitles(episodeId!),
    enabled: !!episodeId,
  });

  // Handle subtitle upload
  const handleUpload = async (file: File, language: string) => {
    if (!episodeId) return;
    await apiClient.uploadSubtitle(episodeId, file, language);
    await refetchSubtitles();
  };

  // Handle embedded subtitle extraction
  const handleExtract = async (streamIndex: number, languageCode: string) => {
    if (!episodeId) return;
    await apiClient.extractEmbeddedSubtitle(
      episodeId,
      streamIndex,
      languageCode || 'unknown',
      'normal'
    );
    await refetchSubtitles();
  };

  // Handle subtitle deletion
  const handleDelete = async (filePath: string) => {
    await apiClient.deleteSubtitle(filePath);
    await refetchSubtitles();
  };

  // Handle dual subtitle creation
  const handleDualCreated = () => {
    refetchSubtitles();
    addToast({
      title: "Success",
      description: "Dual subtitle created successfully",
      type: "success"
    });
  };

  if (isLoading) {
    return (
      <Box p={4} display="flex" className="justify-center items-center" minHeight="screen">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!episode) {
    return (
      <Box p={4}>
        <Card variant="outline" padding={6}>
          <Stack gap={4} align="center">
            <Stop size="xl" className="text-muted" />
            <Heading level={2}>EPISODE NOT FOUND</Heading>
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

  // Count total available subtitles (external + embedded) for dual creation
  const totalSubtitleSources = (subtitles?.external_subtitles?.length || 0) + (subtitles?.embedded_subtitles?.length || 0);

  const showPath = episode.show_id ? `/shows/${episode.show_id}` : '/shows';

  return (
    <Box className="episode-detail" minHeight="screen">
      {/* Content */}
      <Box className="episode-detail-content">
        {/* Zine-Style Header */}
        <Box className="zine-header zine-header-detail" p={4}>
          <div className="zine-header-content">
            {/* Back button */}
            <Link to={showPath} className="zine-back-link">
              <Button variant="secondary" className="back-btn">
                <Arrow size="sm" rotate={180} />
              </Button>
            </Link>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-2" style={{ opacity: 0.7 }}>
              <Link to="/shows" className="hover:opacity-100 transition-opacity">Shows</Link>
              <span>/</span>
              <Link to={showPath} className="hover:opacity-100 transition-opacity">{episode.show}</Link>
              <span>/</span>
              <span style={{ opacity: 1 }}>{episode.season_episode}</span>
            </div>

            {/* Main title - giant */}
            <h1 className="zine-title zine-title-detail">{episode.title}</h1>

            {/* Metadata badges */}
            <Stack direction="row" gap={2} className="zine-meta" wrap>
              <Badge variant="default">
                <Dot size="xs" />
                {episode.season_episode}
              </Badge>
              {episode.duration && (
                <Badge variant="default">
                  <Play size="xs" />
                  {Math.round(episode.duration / 60000)} MIN
                </Badge>
              )}
              {totalSubtitleSources > 0 && (
                <Badge variant="accent">
                  <Layers size="xs" />
                  {totalSubtitleSources} SUBTITLES
                </Badge>
              )}
            </Stack>

            {/* Decorative pattern blocks */}
            <div className="zine-pattern zine-pattern-dots" aria-hidden="true" />
            <div className="zine-pattern zine-pattern-lines" aria-hidden="true" />
          </div>

          {/* Scattered stat stamps */}
          <div className="zine-stamps zine-stamps-detail">
            <div className="zine-stamp zine-stamp-1">
              <span className="zine-stamp-number">{subtitles?.external_subtitles?.length || 0}</span>
              <span className="zine-stamp-label">EXTERNAL</span>
            </div>
            <div className="zine-stamp zine-stamp-2">
              <span className="zine-stamp-number">{subtitles?.embedded_subtitles?.length || 0}</span>
              <span className="zine-stamp-label">EMBEDDED</span>
            </div>
            {/* Hash pattern behind stamps */}
            <div className="zine-pattern zine-pattern-hash" aria-hidden="true" />
          </div>
        </Box>


        {/* Subtitle Manager */}
        <SubtitleManager
          mediaId={episodeId!}
          mediaType="episode"
          subtitles={subtitles}
          onUpload={handleUpload}
          onExtract={handleExtract}
          onDelete={handleDelete}
          onDualCreated={handleDualCreated}
        />
      </Box>
    </Box>
  );
};
