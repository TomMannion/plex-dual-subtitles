/**
 * DualSubtitleCreator — Brutalist dual subtitle creation form
 *
 * Select primary and secondary subtitles to create merged dual subtitles.
 */

import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { ExternalSubtitle, EmbeddedSubtitle, DualSubtitleConfig } from '../types';
import { SubtitleStyleForm } from './SubtitleStyleForm';
import { SubtitlePreviewModal, type PreviewData } from './SubtitlePreviewModal';
import { Stack, Text, Select, Button, Alert, Divider, Spinner, Tick, Cross, EyeOpen, EyeClosed } from '../primitives';

// Unified subtitle option for selection
interface SubtitleOption {
  id: string;
  label: string;
  language_code?: string;
  type: 'external' | 'embedded';
  file_path?: string;
  stream_index?: number;
  codec?: string;
}

interface DualSubtitleCreatorProps {
  mediaId: string;
  mediaType: 'episode' | 'movie';
  externalSubtitles: ExternalSubtitle[];
  embeddedSubtitles: EmbeddedSubtitle[];
  onCreated?: () => void;
}

export const DualSubtitleCreator: React.FC<DualSubtitleCreatorProps> = ({
  mediaId,
  mediaType,
  externalSubtitles,
  embeddedSubtitles,
  onCreated
}) => {
  // Convert all subtitle sources into unified options
  const subtitleOptions = useMemo<SubtitleOption[]>(() => {
    const options: SubtitleOption[] = [];

    externalSubtitles?.forEach((sub, index) => {
      options.push({
        id: `external_${index}`,
        label: sub.file_name,
        language_code: sub.language_code,
        type: 'external',
        file_path: sub.file_path,
      });
    });

    embeddedSubtitles?.forEach((sub) => {
      options.push({
        id: `embedded_${sub.stream_index}`,
        label: sub.display_name || sub.title || `Stream ${sub.stream_index}`,
        language_code: sub.languageCode || sub.language,
        type: 'embedded',
        stream_index: sub.stream_index,
        codec: sub.codec,
      });
    });

    return options;
  }, [externalSubtitles, embeddedSubtitles]);

  const [config, setConfig] = useState<DualSubtitleConfig & {
    primary_subtitle: string;
    secondary_subtitle: string;
  }>({
    primary_subtitle: '',
    secondary_subtitle: '',
    primary_language: '',
    secondary_language: '',
    enable_sync: false,
    enable_language_prefix: true,
  });

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const primarySubtitle = useMemo(() =>
    subtitleOptions.find(s => s.id === config.primary_subtitle),
    [subtitleOptions, config.primary_subtitle]
  );
  const secondarySubtitle = useMemo(() =>
    subtitleOptions.find(s => s.id === config.secondary_subtitle),
    [subtitleOptions, config.secondary_subtitle]
  );

  const buildRequestData = () => {
    return {
      ...config,
      primary_subtitle: primarySubtitle?.file_path || config.primary_subtitle,
      secondary_subtitle: secondarySubtitle?.file_path || config.secondary_subtitle,
      primary_source_type: primarySubtitle?.type || 'external',
      primary_stream_index: primarySubtitle?.stream_index,
      primary_codec: primarySubtitle?.codec,
      primary_language: primarySubtitle?.language_code || config.primary_language,
      secondary_source_type: secondarySubtitle?.type || 'external',
      secondary_stream_index: secondarySubtitle?.stream_index,
      secondary_codec: secondarySubtitle?.codec,
      secondary_language: secondarySubtitle?.language_code || config.secondary_language,
    };
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const requestData = buildRequestData();
      return mediaType === 'movie'
        ? apiClient.createMovieDualSubtitle(mediaId, requestData)
        : apiClient.createDualSubtitle(mediaId, requestData);
    },
    onSuccess: () => {
      onCreated?.();
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => apiClient.previewDualSubtitle(buildRequestData()),
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
  });

  const handlePreview = () => {
    if (!config.primary_subtitle || !config.secondary_subtitle) return;
    previewMutation.mutate();
  };

  const handleCreate = () => {
    if (!config.primary_subtitle || !config.secondary_subtitle) return;
    createMutation.mutate();
  };

  const usesEmbedded = primarySubtitle?.type === 'embedded' || secondarySubtitle?.type === 'embedded';
  const canProceed = config.primary_subtitle && config.secondary_subtitle &&
                    config.primary_subtitle !== config.secondary_subtitle;

  return (
    <Stack gap={4}>
      {/* Subtitle Selection */}
      <div className="episode-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Primary Subtitle */}
        <Stack gap={2}>
          <Text variant="label">Primary (Top)</Text>
          <Select
            value={config.primary_subtitle}
            onChange={(e) => setConfig({ ...config, primary_subtitle: e.target.value })}
          >
            <option value="">Select subtitle...</option>
            {subtitleOptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.type === 'embedded' ? '[EMB] ' : '[EXT] '}
                {sub.label} ({sub.language_code || 'unknown'})
              </option>
            ))}
          </Select>
        </Stack>

        {/* Secondary Subtitle */}
        <Stack gap={2}>
          <Text variant="label">Secondary (Bottom)</Text>
          <Select
            value={config.secondary_subtitle}
            onChange={(e) => setConfig({ ...config, secondary_subtitle: e.target.value })}
          >
            <option value="">Select subtitle...</option>
            {subtitleOptions
              .filter((sub) => sub.id !== config.primary_subtitle)
              .map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.type === 'embedded' ? '[EMB] ' : '[EXT] '}
                  {sub.label} ({sub.language_code || 'unknown'})
                </option>
              ))}
          </Select>
        </Stack>
      </div>

      {/* Styling Options */}
      {canProceed && (
        <>
          <Divider />
          <SubtitleStyleForm
            config={config}
            onChange={(newConfig) => setConfig({ ...config, ...newConfig })}
          />
        </>
      )}

      {/* Actions */}
      {canProceed && (
        <>
          <Divider />
          <Stack direction="row" gap={3} className="dual-subtitle-actions">
            <Button
              variant="secondary"
              onClick={handlePreview}
              disabled={previewMutation.isPending || usesEmbedded}
              icon={previewMutation.isPending ? <Spinner size="sm" /> : usesEmbedded ? <EyeClosed size="sm" /> : <EyeOpen size="sm" />}
            >
              {previewMutation.isPending ? 'Loading...' : usesEmbedded ? 'Preview Unavailable' : 'Preview'}
            </Button>

            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              icon={createMutation.isPending ? <Spinner size="sm" /> : <Tick size="sm" />}
            >
              Create Dual Subtitle
            </Button>
          </Stack>
        </>
      )}

      {/* Error Messages */}
      {(createMutation.error || previewMutation.error) && (
        <Alert variant="error" icon={<Cross size="md" />}>
          <Text bold className="text-accent">Error</Text>
          <Text variant="body-sm" color="muted">
            {createMutation.error?.message || previewMutation.error?.message}
          </Text>
          <details className="mt-2">
            <summary className="text-caption text-accent cursor-pointer">Debug Info</summary>
            <pre className="text-caption text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(createMutation.error || previewMutation.error, null, 2)}
            </pre>
          </details>
        </Alert>
      )}

      {/* Success Message */}
      {createMutation.isSuccess && (
        <Alert variant="success" icon={<Tick size="md" />}>
          <Text bold className="text-success">Success!</Text>
          <Text variant="body-sm" color="muted">
            Dual subtitle created successfully. The new file has been saved to your media directory.
          </Text>
        </Alert>
      )}

      {/* Preview Modal */}
      <SubtitlePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
      />
    </Stack>
  );
};
