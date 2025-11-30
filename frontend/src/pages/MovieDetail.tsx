/**
 * MovieDetail — Movie detail page with subtitle management
 *
 * Brutalist asymmetric layout with upload, dual creation, and subtitle list.
 * Hard shadows, thick borders, aggressive typography.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Arrow, Stop, Layers, File, Dot, Play } from '../primitives';
import { apiClient } from '../lib/api';
import { SubtitleManager } from '../components/SubtitleManager';
import { useToast } from '../components/ui/Toaster';
import { fixPlexImageUrl } from '../utils/imageUtils';
import {
  Box,
  Stack,
  Heading,
  Text,
  Card,
  Button,
  Badge,
  Spinner,
} from '../primitives';

export const MovieDetail: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { addToast } = useToast();

  // Fetch movie details
  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => apiClient.getMovieDetail(movieId!),
    enabled: !!movieId,
  });

  // Fetch movie subtitles
  const { data: subtitles, refetch: refetchSubtitles } = useQuery({
    queryKey: ['movie-subtitles', movieId],
    queryFn: () => apiClient.getMovieSubtitles(movieId!),
    enabled: !!movieId,
  });

  // Handle subtitle upload
  const handleUpload = async (file: File, language: string) => {
    if (!movieId) return;
    await apiClient.uploadMovieSubtitle(movieId, file, language);
    await refetchSubtitles();
  };

  // Handle embedded subtitle extraction
  const handleExtract = async (streamIndex: number, languageCode: string) => {
    if (!movieId) return;
    await apiClient.extractMovieEmbeddedSubtitle(
      movieId,
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

  if (!movie) {
    return (
      <Box p={4}>
        <Card variant="outline" padding={6}>
          <Stack gap={4} align="center">
            <Stop size="xl" className="text-muted" />
            <Heading level={2}>MOVIE NOT FOUND</Heading>
            <Link to="/">
              <Button variant="primary">
                <Arrow size="sm" rotate={180} />
                BACK TO DASHBOARD
              </Button>
            </Link>
          </Stack>
        </Card>
      </Box>
    );
  }

  // Count total available subtitles (external + embedded) for dual creation
  const totalSubtitleSources = (subtitles?.external_subtitles?.length || 0) + (subtitles?.embedded_subtitles?.length || 0);

  // Background image
  const backgroundImageUrl = fixPlexImageUrl(movie.art) || fixPlexImageUrl(movie.thumb);

  return (
    <Box className="movie-detail" minHeight="screen">
      {/* Background Image */}
      {backgroundImageUrl && (
        <div
          className="movie-detail-bg"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      {/* Content */}
      <Box className="movie-detail-content">
        {/* Zine-Style Header */}
        <Box className="zine-header zine-header-detail" p={4}>
          <div className="zine-header-content">
            {/* Back button */}
            <Link to="/movies" className="zine-back-link">
              <Button variant="secondary" className="back-btn">
                <Arrow size="sm" rotate={180} />
              </Button>
            </Link>

            {/* Main title - giant */}
            <h1 className="zine-title zine-title-detail">{movie.title}</h1>

            {/* Subtitle with year and metadata */}
            <Stack direction="row" gap={2} className="zine-meta" wrap>
              {movie.year && (
                <Badge variant="default">
                  <Dot size="xs" />
                  {movie.year}
                </Badge>
              )}
              {movie.duration && (
                <Badge variant="default">
                  <Play size="xs" />
                  {Math.round(movie.duration / 60000)} MIN
                </Badge>
              )}
              <Badge variant="accent">
                <Layers size="xs" />
                {totalSubtitleSources} SUBTITLES
              </Badge>
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

        {/* Summary */}
        {movie.summary && (
          <Box px={4} mt={4}>
            <Card variant="outline" padding={4}>
              <Text variant="body" color="secondary">
                {movie.summary}
              </Text>
            </Card>
          </Box>
        )}

        {/* File Info */}
        {movie.file_info && (
          <Box px={4} mt={3}>
            <Card variant="outline" padding={3}>
              <Stack direction="row" align="center" gap={2}>
                <File size="sm" className="text-accent" />
                <Text variant="caption" color="muted" className="truncate">
                  {movie.file_info.file_name}
                </Text>
              </Stack>
            </Card>
          </Box>
        )}

        {/* Subtitle Manager */}
        <SubtitleManager
          mediaId={movieId!}
          mediaType="movie"
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
