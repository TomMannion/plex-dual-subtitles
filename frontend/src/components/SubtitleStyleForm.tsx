/**
 * SubtitleStyleForm — Brutalist subtitle style configuration
 *
 * Configure sync and language prefix options for dual subtitles.
 */

import React from 'react';
import type { DualSubtitleConfig } from '../types';
import { Stack, Text, Checkbox } from '../primitives';

interface SubtitleStyleFormProps {
  config: DualSubtitleConfig;
  onChange: (config: DualSubtitleConfig) => void;
  showSyncOption?: boolean;
}

export const SubtitleStyleForm: React.FC<SubtitleStyleFormProps> = ({
  config,
  onChange,
  showSyncOption = true,
}) => {
  return (
    <Stack gap={3}>
      {/* Synchronization Option */}
      {showSyncOption && (
        <Checkbox
          checked={config.enable_sync || false}
          onChange={(e) => onChange({ ...config, enable_sync: e.target.checked })}
          label={<Text bold>Auto-sync timing</Text>}
        />
      )}

      {/* Language Prefix Option */}
      <Checkbox
        checked={config.enable_language_prefix !== false}
        onChange={(e) => onChange({ ...config, enable_language_prefix: e.target.checked })}
        label={<Text bold>Show language prefixes [EN] [JA]</Text>}
      />
    </Stack>
  );
};
