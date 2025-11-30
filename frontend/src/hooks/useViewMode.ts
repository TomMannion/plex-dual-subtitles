/**
 * useViewMode — Persists grid/list view preference to sessionStorage
 */

import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'media-view-mode';

export function useViewMode(defaultMode: ViewMode = 'grid'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'grid' || stored === 'list') {
        return stored;
      }
    }
    return defaultMode;
  });

  // Sync to sessionStorage when viewMode changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode];
}
