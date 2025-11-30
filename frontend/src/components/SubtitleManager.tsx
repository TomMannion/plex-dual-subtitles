/**
 * SubtitleManager — Reusable subtitle management component
 *
 * Shared UI for upload, dual creation, and subtitle list.
 * Used by both MovieDetail and EpisodeDetail pages.
 */

import React, { useState, useEffect, useRef } from 'react';
import { DualSubtitleCreator } from './DualSubtitleCreator';
import { useToast } from './ui/Toaster';
import { COMPREHENSIVE_LANGUAGES, getLanguageByCode, searchLanguages } from '../data/languages';
import { extractLanguageFromFilename } from '../utils/languageDetection';
import {
  Box,
  Grid,
  Stack,
  Heading,
  Text,
  Input,
  Card,
  Button,
  Badge,
  Plus,
  Arrow,
  Skull,
  Layers,
  File,
  Tick,
} from '../primitives';
import type { EpisodeSubtitles, MovieSubtitles } from '../types/api';

type SubtitlesData = EpisodeSubtitles | MovieSubtitles;

/**
 * Parse dual subtitle filename to extract both language codes
 * Format: name.dual.{lang1}-{lang2}.srt
 * Example: "Movie Name.dual.zh-TW-en.srt" -> ["zh-TW", "en"]
 */
const parseDualLanguages = (fileName: string): [string, string] | null => {
  const match = fileName.match(/\.dual\.([a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?)-([a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?)\.[^.]+$/);
  if (match) {
    return [match[1], match[2]];
  }
  return null;
};

interface SubtitleManagerProps {
  mediaId: string;
  mediaType: 'movie' | 'episode';
  subtitles?: SubtitlesData;
  onUpload: (file: File, language: string) => Promise<void>;
  onExtract: (streamIndex: number, languageCode: string) => Promise<void>;
  onDelete: (filePath: string, fileName: string) => Promise<void>;
  onDualCreated: () => void;
}

export const SubtitleManager: React.FC<SubtitleManagerProps> = ({
  mediaId,
  mediaType,
  subtitles,
  onUpload,
  onExtract,
  onDelete,
  onDualCreated,
}) => {
  const { addToast } = useToast();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLanguage, setUploadLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractingStreams, setExtractingStreams] = useState<Set<number>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [rightColMaxHeight, setRightColMaxHeight] = useState<number | undefined>(undefined);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(srt|ass|vtt|sub)$/i)) {
        setUploadFile(file);

        // Try to detect language from filename
        const detectedLang = extractLanguageFromFilename(file.name);
        if (detectedLang && getLanguageByCode(detectedLang)) {
          setDetectedLanguage(detectedLang);
          setUploadLanguage(detectedLang);
        } else {
          setDetectedLanguage(null);
        }
      } else {
        addToast({
          title: "Invalid file type",
          description: "Please upload a subtitle file (.srt, .ass, .vtt, .sub)",
          type: "error"
        });
      }
    }
  };

  // Handle subtitle upload
  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      await onUpload(uploadFile, uploadLanguage);

      // Reset form
      setUploadFile(null);
      setUploadLanguage('en');
      setDetectedLanguage(null);

      addToast({
        title: "Success",
        description: `Subtitle uploaded successfully as ${uploadLanguage}`,
        type: "success"
      });
    } catch (error) {
      addToast({
        title: "Upload failed",
        description: "There was an error uploading the subtitle file",
        type: "error"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle embedded subtitle extraction
  const handleExtract = async (streamIndex: number, languageCode: string) => {
    setExtractingStreams(prev => new Set(prev).add(streamIndex));

    try {
      await onExtract(streamIndex, languageCode || 'unknown');

      addToast({
        title: "Success",
        description: `Embedded subtitle extracted as ${languageCode || 'unknown'}`,
        type: "success"
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'Unknown error';
      addToast({
        title: "Extraction failed",
        description: errorMessage,
        type: "error"
      });
    } finally {
      setExtractingStreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(streamIndex);
        return newSet;
      });
    }
  };

  // Handle subtitle deletion
  const handleDelete = async (filePath: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingFiles(prev => new Set(prev).add(filePath));

    try {
      await onDelete(filePath, fileName);

      addToast({
        title: "Subtitle deleted",
        description: `${fileName} has been deleted`,
        type: "success"
      });
    } catch (error) {
      addToast({
        title: "Delete failed",
        description: "There was an error deleting the subtitle file",
        type: "error"
      });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }
  };

  const hasSubtitles = subtitles && (
    (subtitles.embedded_subtitles && subtitles.embedded_subtitles.length > 0) ||
    (subtitles.external_subtitles && subtitles.external_subtitles.length > 0)
  );

  const totalSubtitleSources = (subtitles?.external_subtitles?.length || 0) + (subtitles?.embedded_subtitles?.length || 0);
  const canCreateDual = totalSubtitleSources >= 2;

  // Sync right column height to left column
  useEffect(() => {
    const syncHeights = () => {
      if (leftColumnRef.current && window.innerWidth >= 640) {
        const leftHeight = leftColumnRef.current.offsetHeight;
        setRightColMaxHeight(leftHeight);
      } else {
        setRightColMaxHeight(undefined);
      }
    };

    syncHeights();
    window.addEventListener('resize', syncHeights);

    // Use ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(syncHeights);
    if (leftColumnRef.current) {
      resizeObserver.observe(leftColumnRef.current);
    }

    return () => {
      window.removeEventListener('resize', syncHeights);
      resizeObserver.disconnect();
    };
  }, [subtitles, canCreateDual]);

  return (
    <div className="subtitle-manager-grid mt-4">
        {/* LEFT COLUMN - Dual Subtitle & Upload */}
        <div className="subtitle-manager-col" ref={leftColumnRef}>
          <div className="stack-vertical">
            {/* Create Dual Subtitle Card */}
            {canCreateDual && (
              <Card variant="outline" padding={0}>
                <Box className="card-header" p={3}>
                  <Stack direction="row" align="center" gap={2}>
                    <Plus size="md" className="text-accent" />
                    <Heading level={3}>CREATE DUAL SUBTITLE</Heading>
                  </Stack>
                </Box>

                <Box p={4}>
                  <DualSubtitleCreator
                    mediaId={mediaId}
                    mediaType={mediaType}
                    externalSubtitles={subtitles?.external_subtitles || []}
                    embeddedSubtitles={subtitles?.embedded_subtitles || []}
                    onCreated={onDualCreated}
                  />
                </Box>
              </Card>
            )}

            {/* Upload Card */}
            <Card variant="outline" padding={0}>
              <Box className="card-header" p={3}>
                <Stack direction="row" align="center" gap={2}>
                  <Arrow size="md" rotate={270} className="text-accent" />
                  <Heading level={3}>UPLOAD SUBTITLE</Heading>
                </Stack>
              </Box>

              <Box p={4}>
                <Grid variant="brutal">
                  {/* Drag and Drop Zone */}
                  <Box colSpan={10}>
                    <div
                      className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Arrow size="lg" rotate={270} className="text-muted" />

                      {uploadFile ? (
                        <Stack gap={1} align="center">
                          <Text variant="label" className="truncate">
                            {uploadFile.name}
                          </Text>
                          <button
                            onClick={() => setUploadFile(null)}
                            className="text-xs text-muted hover:text-accent"
                          >
                            Remove
                          </button>
                        </Stack>
                      ) : (
                        <>
                          <Text variant="label">DROP FILE HERE</Text>
                          <Text variant="caption" color="muted">
                            or click to browse
                          </Text>
                          <input
                            type="file"
                            accept=".srt,.ass,.vtt,.sub"
                            className="upload-input"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setUploadFile(file);

                              if (file) {
                                const detectedLang = extractLanguageFromFilename(file.name);
                                if (detectedLang && getLanguageByCode(detectedLang)) {
                                  setDetectedLanguage(detectedLang);
                                  setUploadLanguage(detectedLang);
                                } else {
                                  setDetectedLanguage(null);
                                }
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  </Box>

                  {/* Language & Upload Button */}
                  <Box colSpan={10}>
                    <Stack gap={3}>
                      {detectedLanguage && (
                        <Stack direction="row" align="center" gap={2}>
                          <Tick size="xs" className="text-success" />
                          <Text variant="caption" className="text-success">
                            Detected: {getLanguageByCode(detectedLanguage)?.name}
                          </Text>
                        </Stack>
                      )}

                      {/* Language Dropdown */}
                      <div className="language-dropdown-container" ref={languageDropdownRef}>
                        <Input
                          placeholder="SEARCH LANGUAGES..."
                          value={showLanguageDropdown ? languageSearchTerm : (uploadLanguage ? `${getLanguageByCode(uploadLanguage)?.name} (${uploadLanguage})` : '')}
                          onChange={(e) => {
                            setLanguageSearchTerm(e.target.value);
                            setShowLanguageDropdown(true);
                          }}
                          onFocus={() => {
                            setLanguageSearchTerm('');
                            setShowLanguageDropdown(true);
                          }}
                        />

                        {showLanguageDropdown && (
                          <div className="language-dropdown">
                            {(languageSearchTerm ? searchLanguages(languageSearchTerm) : COMPREHENSIVE_LANGUAGES)
                              .map(lang => (
                                <button
                                  key={lang.code}
                                  className="language-option"
                                  onClick={() => {
                                    setUploadLanguage(lang.code);
                                    setLanguageSearchTerm('');
                                    setShowLanguageDropdown(false);
                                  }}
                                >
                                  {lang.name} ({lang.code})
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={!uploadFile || isUploading}
                        className="w-full"
                      >
                        <Arrow size="sm" rotate={270} />
                        {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                      </Button>

                      <Text variant="caption" color="muted" align="center">
                        SRT, ASS, VTT, SUB
                      </Text>
                    </Stack>
                  </Box>
                </Grid>
              </Box>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN - Current Subtitles */}
        <div
          className="subtitle-manager-col"
          ref={rightColumnRef}
          style={rightColMaxHeight ? { maxHeight: rightColMaxHeight } : undefined}
        >
          <Card variant="outline" padding={0}>
            <Box className="card-header" p={3}>
              <Stack direction="row" align="center" gap={2}>
                <Layers size="md" className="text-accent" />
                <Heading level={3}>CURRENT SUBTITLES</Heading>
              </Stack>
            </Box>

            <Box p={4} className="subtitle-list-scroll">
              {!hasSubtitles ? (
                <Stack gap={3} align="center" className="p-6">
                  <Layers size="xl" className="text-muted" />
                  <Heading level={4}>NO SUBTITLES YET</Heading>
                  <Text variant="body" color="secondary" align="center">
                    Upload subtitle files or extract embedded subtitles to get started
                  </Text>
                </Stack>
              ) : (
                <Stack gap={4}>
                  {/* External Subtitles */}
                  {subtitles?.external_subtitles && subtitles.external_subtitles.length > 0 && (
                    <Stack gap={2}>
                      <Stack direction="row" align="center" gap={2}>
                        <Arrow size="sm" rotate={90} className="text-muted" />
                        <Text variant="label">EXTERNAL FILES</Text>
                        <Badge variant="accent">
                          {subtitles.external_subtitles.length}
                        </Badge>
                      </Stack>
                      <Stack gap={2}>
                        {subtitles.external_subtitles.map((sub, index) => {
                          const isDeleting = deletingFiles.has(sub.file_path);
                          const isDual = sub.file_name.includes('.dual.');
                          const dualLanguages = isDual ? parseDualLanguages(sub.file_name) : null;
                          return (
                            <Card key={index} variant="outline" padding={2} className="subtitle-item">
                              <Stack direction="row" align="center" justify="between">
                                <Stack direction="row" align="center" gap={2} className="flex-1 min-w-0">
                                  {isDual ? (
                                    <File size="sm" className="text-accent" />
                                  ) : (
                                    <File size="sm" className="text-muted" />
                                  )}
                                  <Stack gap={0} className="min-w-0">
                                    <Text variant="label" className="truncate">
                                      {sub.file_name}
                                    </Text>
                                    <Stack direction="row" gap={1} align="center">
                                      <Text variant="caption" color={isDual ? undefined : "muted"} className={isDual ? "text-success" : undefined}>
                                        {isDual && dualLanguages
                                          ? `${dualLanguages[0]} + ${dualLanguages[1]}`
                                          : (sub.language_code || 'unknown')
                                        }
                                      </Text>
                                      {isDual && (
                                        <Text variant="caption" className="text-success" style={{ textDecoration: 'underline' }}>
                                          + dual
                                        </Text>
                                      )}
                                    </Stack>
                                  </Stack>
                                </Stack>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleDelete(sub.file_path, sub.file_name)}
                                  disabled={isDeleting}
                                  className="delete-btn"
                                >
                                  <Skull size="sm" />
                                </Button>
                              </Stack>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Stack>
                  )}

                  {/* Embedded Subtitles */}
                  {subtitles?.embedded_subtitles && subtitles.embedded_subtitles.length > 0 && (
                    <Stack gap={2}>
                      <Stack direction="row" align="center" gap={2}>
                        <Arrow size="sm" rotate={90} className="text-muted" />
                        <Text variant="label">EMBEDDED</Text>
                        <Badge variant="default">
                          {subtitles.embedded_subtitles.length}
                        </Badge>
                      </Stack>
                      <Stack gap={2}>
                        {subtitles.embedded_subtitles.map((sub, index) => {
                          const isExtracting = extractingStreams.has(sub.stream_index);
                          return (
                            <Card key={index} variant="outline" padding={2} className="subtitle-item">
                              <Stack direction="row" align="center" justify="between">
                                <Stack direction="row" align="center" gap={2} className="flex-1 min-w-0">
                                  <File size="sm" className="text-muted" />
                                  <Stack gap={0} className="min-w-0">
                                    <Text variant="label" className="truncate">
                                      {sub.display_name}
                                    </Text>
                                    <Text variant="caption" color="muted">
                                      Stream #{sub.stream_index}
                                    </Text>
                                  </Stack>
                                </Stack>
                                <Button
                                  variant="primary"
                                  onClick={() => handleExtract(sub.stream_index, sub.languageCode || 'und')}
                                  disabled={isExtracting}
                                >
                                  {isExtracting ? '...' : 'EXTRACT'}
                                </Button>
                              </Stack>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>
          </Card>
        </div>
    </div>
  );
};
