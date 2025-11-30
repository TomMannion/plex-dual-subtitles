// API Response Types

export interface ConnectionStatus {
  connected: boolean;
  server_name?: string;
  version?: string;
  error?: string;
}

export interface Library {
  key: string;
  title: string;
  uuid: string;
  type: 'show' | 'movie';
  item_count: number;
}

export interface Show {
  id: string;
  title: string;
  year?: number;
  thumb?: string;
  episode_count: number;
  season_count: number;
}

export interface Season {
  id: string;
  index: number;
  title: string;
  episode_count: number;
}

export interface FileInfo {
  file_path: string;
  file_dir: string;
  file_name: string;
  embedded_subtitles: EmbeddedSubtitle[];
  external_subtitles: ExternalSubtitle[];
  has_subtitles: boolean;
}

export interface EmbeddedSubtitle {
  language?: string;
  languageCode?: string;
  codec: string;
  forced: boolean;
  title?: string;
  stream_index: number;
  id: string;
  display_name: string;
}

export interface ExternalSubtitle {
  file_path: string;
  file_name: string;
  language_code?: string;
  format: string;
  is_dual_subtitle?: boolean;
  dual_languages?: string[];
}

export interface Episode {
  id: string;
  title: string;
  show: string;
  show_id?: string;
  season: number;
  episode: number;
  season_episode: string;
  file_info?: FileInfo;
  naming_pattern: string;
  thumb?: string;
  duration?: number;
  viewed: boolean;
}

export interface ShowDetail extends Show {
  summary?: string;
  art?: string;
  episodes_with_subtitles: number;
  subtitle_coverage: string;
  total_external_subtitles: number;
  total_embedded_subtitles: number;
  seasons: Season[];
  episodes: Episode[];
}

export interface EpisodeSubtitles {
  episode: string;
  file_path?: string;
  has_subtitles: boolean;
  embedded_subtitles: EmbeddedSubtitle[];
  external_subtitles: ExternalSubtitle[];
  naming_pattern: string;
}

export interface DualSubtitleConfig {
  primary_language: string;
  secondary_language: string;
  enable_sync?: boolean;
  enable_language_prefix?: boolean;
}

export interface DualSubtitleResult {
  success: boolean;
  message: string;
  output_file: string;
  output_path: string;
  details: {
    primary_lines: number;
    secondary_lines: number;
    total_lines: number;
    format: string;
    sync_warnings?: string[];
  };
}

export interface SubtitlePreview {
  primary: {
    time: string;
    text: string;
  }[];
  secondary: {
    time: string;
    text: string;
  }[];
}

export interface UploadResult {
  success: boolean;
  message: string;
  filename: string;
  path: string;
  language: string;
}

export interface ExtractResult {
  success: boolean;
  message: string;
  output_file: string;
  output_path: string;
  stream_index: number;
}

// Movie Types
export interface Movie {
  id: string;
  title: string;
  year?: number;
  thumb?: string;
  summary?: string;
}

export interface MovieDetail extends Movie {
  art?: string;
  file_info?: FileInfo;
  naming_pattern: string;
  duration?: number;
  viewed: boolean;
}

export interface MovieSubtitles {
  movie: string;
  file_path?: string;
  has_file: boolean;
  has_subtitles?: boolean;
  embedded_subtitles: EmbeddedSubtitle[];
  external_subtitles: ExternalSubtitle[];
  naming_pattern?: string;
}

// Recently Added Types
export interface RecentlyAddedEpisode {
  type: 'episode';
  id: string;
  title: string;
  show_title: string;
  show_id: string;
  season: number;
  episode: number;
  season_episode: string;
  thumb?: string;
  added_at?: string;
}

export interface RecentlyAddedMovie {
  type: 'movie';
  id: string;
  title: string;
  year?: number;
  thumb?: string;
  added_at?: string;
}

export type RecentlyAddedItem = RecentlyAddedEpisode | RecentlyAddedMovie;