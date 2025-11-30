/**
 * Application configuration
 */

// Dynamic API base - use current host with backend port
export const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : `http://${window.location.hostname}:8000`;

// API configuration
export const API_CONFIG = {
  baseURL: API_BASE,
  timeout: 30000,
} as const;

// Default subtitle styling
export const DEFAULT_SUBTITLE_STYLE = {
  primary_position: 'bottom' as const,
  secondary_position: 'top' as const,
  primary_color: '#FFFFFF',
  secondary_color: '#FFE135',
  primary_font_size: 20,
  secondary_font_size: 18,
  output_format: 'ass' as const,
} as const;
