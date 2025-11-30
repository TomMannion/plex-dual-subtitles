/**
 * SubtitlePreviewModal — Brutalist subtitle preview
 *
 * Preview dual subtitle styling with real content.
 */

import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Card, Stack, Text, Heading, Button } from '../primitives';

export interface PreviewLine {
  time: string;
  text: string;
}

export interface PreviewData {
  config?: {
    primary_color?: string;
    secondary_color?: string;
    primary_position?: string;
    secondary_position?: string;
  };
  primary?: PreviewLine[];
  secondary?: PreviewLine[];
}

interface SubtitlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PreviewData | null;
}

export const SubtitlePreviewModal: React.FC<SubtitlePreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
}) => {
  if (!previewData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <div>
          <Heading level={3}>Subtitle Preview</Heading>
          <Text variant="body-sm" color="muted">Preview of your dual subtitle styling</Text>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="episode-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Primary Subtitles Column */}
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <div
                className="status-dot"
                style={{ backgroundColor: previewData.config?.primary_color || '#ffffff' }}
              />
              <Text bold>Primary ({previewData.config?.primary_position})</Text>
            </Stack>
            <Stack gap={2}>
              {previewData.primary?.map((line, index) => (
                <Card key={index} variant="outline" padding={3}>
                  <Text variant="caption" className="text-accent font-mono mb-2">{line.time}</Text>
                  <Text
                    variant="body-sm"
                    style={{ color: previewData.config?.primary_color || '#ffffff' }}
                  >
                    {line.text}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Stack>

          {/* Secondary Subtitles Column */}
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <div
                className="status-dot"
                style={{ backgroundColor: previewData.config?.secondary_color || '#ffff00' }}
              />
              <Text bold>Secondary ({previewData.config?.secondary_position})</Text>
            </Stack>
            <Stack gap={2}>
              {previewData.secondary?.map((line, index) => (
                <Card key={index} variant="outline" padding={3}>
                  <Text variant="caption" className="text-accent font-mono mb-2">{line.time}</Text>
                  <Text
                    variant="body-sm"
                    style={{ color: previewData.config?.secondary_color || '#ffff00' }}
                  >
                    {line.text}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Stack>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Close Preview</Button>
      </ModalFooter>
    </Modal>
  );
};
