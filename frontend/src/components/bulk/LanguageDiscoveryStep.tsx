import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Arrow, Bang } from '../../primitives';
import { apiClient } from '../../lib/api';
import type { SubtitleAnalysis } from '../../types/bulk';
import { COMPREHENSIVE_LANGUAGES } from '../../data/languages';

interface LanguageDiscoveryStepProps {
  showId: string;
  analysis: SubtitleAnalysis | null;
  onAnalysisLoad: (analysis: SubtitleAnalysis) => void;
  onLanguageSelect: (primary: string, secondary: string) => void;
  selectedPrimary?: string;
  selectedSecondary?: string;
}

export const LanguageDiscoveryStep: React.FC<LanguageDiscoveryStepProps> = ({
  showId,
  analysis,
  onAnalysisLoad,
  onLanguageSelect,
  selectedPrimary = '',
  selectedSecondary = ''
}) => {
  const [primaryLanguage, setPrimaryLanguage] = useState(selectedPrimary);
  const [secondaryLanguage, setSecondaryLanguage] = useState(selectedSecondary);

  // Fetch subtitle analysis for the show
  const { data: analysisData, isLoading, error } = useQuery({
    queryKey: ['subtitle-analysis', showId],
    queryFn: () => apiClient.getSubtitleAnalysis(showId),
    enabled: !analysis, // Only fetch if we don't already have analysis
    staleTime: 0, // Always refetch to get updated language mappings
    gcTime: 0, // Don't cache for long
  });

  useEffect(() => {
    if (analysisData && !analysis && analysisData.total_episodes !== undefined) {
      onAnalysisLoad(analysisData);
    }
  }, [analysisData, analysis, onAnalysisLoad]);

  // Get sorted languages by availability
  const sortedLanguages = analysis ?
    Object.entries(analysis.language_availability)
      .sort(([, a], [, b]) => b.episodes_available - a.episodes_available)
      .slice(0, 6) // Show top 6 most available languages
    : [];

  // Auto-select most common languages if none selected
  useEffect(() => {
    if (sortedLanguages.length >= 2 && !primaryLanguage && !secondaryLanguage) {
      const [firstLang] = sortedLanguages[0];
      const [secondLang] = sortedLanguages[1];
      setPrimaryLanguage(firstLang);
      setSecondaryLanguage(secondLang);
    }
  }, [sortedLanguages, primaryLanguage, secondaryLanguage]);

  const handleContinue = () => {
    if (primaryLanguage && secondaryLanguage && primaryLanguage !== secondaryLanguage) {
      onLanguageSelect(primaryLanguage, secondaryLanguage);
    }
  };

  const canContinue = primaryLanguage &&
                     secondaryLanguage &&
                     primaryLanguage !== secondaryLanguage &&
                     analysis?.language_availability[primaryLanguage] &&
                     analysis?.language_availability[secondaryLanguage];

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto var(--space-3)' }} />
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h4)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-2)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          ANALYZING SUBTITLES
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Scanning episodes for available languages...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: 'var(--border-thick) solid var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-3)',
        }}>
          <Bang size="lg" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h4)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-2)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          ANALYSIS FAILED
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
          Unable to analyze subtitle availability for this show.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-brutal btn-brutal-primary"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const previewData = primaryLanguage && secondaryLanguage ? {
    primary: analysis.language_availability[primaryLanguage],
    secondary: analysis.language_availability[secondaryLanguage],
    compatible: Math.min(
      analysis.language_availability[primaryLanguage]?.episodes_available || 0,
      analysis.language_availability[secondaryLanguage]?.episodes_available || 0
    )
  } : null;

  return (
    <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Analysis Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Layers size="md" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 'var(--weight-bold)' }}>
            {Object.keys(analysis.language_availability).length} LANGUAGES FOUND
          </span>
        </div>
        <span className="badge-brutal badge-brutal-default">
          {analysis.total_episodes} EPISODES
        </span>
      </div>

      {/* Language Selection */}
      <div className="card-brutal" style={{ padding: 'var(--space-3)' }}>
        <h4 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-body-sm)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-2)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          SELECT LANGUAGES
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
          {/* Primary Language */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-caption)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: 'var(--tracking-widest)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-1)',
            }}>
              PRIMARY (MAIN)
            </label>
            <select
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              className="select-brutal"
            >
              <option value="">Select language...</option>
              {Object.entries(analysis.language_availability).map(([code, avail]) => {
                const language = COMPREHENSIVE_LANGUAGES.find(l => l.code === code);
                return (
                  <option key={code} value={code}>
                    {language?.name || code} ({avail.episodes_available}/{analysis.total_episodes})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Secondary Language */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-caption)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: 'var(--tracking-widest)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-1)',
            }}>
              SECONDARY (OVERLAY)
            </label>
            <select
              value={secondaryLanguage}
              onChange={(e) => setSecondaryLanguage(e.target.value)}
              className="select-brutal"
            >
              <option value="">Select language...</option>
              {Object.entries(analysis.language_availability)
                .filter(([code]) => code !== primaryLanguage)
                .map(([code, avail]) => {
                  const language = COMPREHENSIVE_LANGUAGES.find(l => l.code === code);
                  return (
                    <option key={code} value={code}>
                      {language?.name || code} ({avail.episodes_available}/{analysis.total_episodes})
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* Preview Results */}
        {previewData && (
          <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: 'var(--border-thin) solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-caption)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="status-dot status-dot-success" />
                <span style={{ color: 'var(--accent-success)', fontWeight: 'var(--weight-bold)' }}>{previewData.compatible} READY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="status-dot status-dot-pending" />
                <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--weight-bold)' }}>
                  {Math.max(previewData.primary.episodes_available, previewData.secondary.episodes_available) - previewData.compatible} PARTIAL
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="status-dot status-dot-error" />
                <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--weight-bold)' }}>
                  {analysis.total_episodes - Math.max(previewData.primary.episodes_available, previewData.secondary.episodes_available)} SKIP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Language Availability Chips */}
      <div>
        <h4 style={{
          fontSize: 'var(--text-caption)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: 'var(--tracking-widest)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-1)',
        }}>
          AVAILABLE LANGUAGES
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
          {sortedLanguages.map(([languageCode, availability]) => {
            const language = COMPREHENSIVE_LANGUAGES.find(l => l.code === languageCode);
            const percentage = Math.round((availability.episodes_available / analysis.total_episodes) * 100);
            const isSelected = languageCode === primaryLanguage || languageCode === secondaryLanguage;

            return (
              <button
                key={languageCode}
                onClick={() => {
                  if (!primaryLanguage) {
                    setPrimaryLanguage(languageCode);
                  } else if (!secondaryLanguage && languageCode !== primaryLanguage) {
                    setSecondaryLanguage(languageCode);
                  } else if (languageCode === primaryLanguage) {
                    setPrimaryLanguage('');
                  } else if (languageCode === secondaryLanguage) {
                    setSecondaryLanguage('');
                  }
                }}
                className={isSelected ? 'tag-brutal tag-brutal-selected' : 'tag-brutal'}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-primary)' :
                    percentage >= 90 ? 'var(--accent-success)' :
                    percentage >= 70 ? 'var(--border-primary)' : 'var(--border-secondary)',
                }}
              >
                <span style={{ fontWeight: 'var(--weight-bold)' }}>{language?.name || languageCode}</span>
                <span className="badge-brutal badge-brutal-sm badge-brutal-default">
                  {percentage}%
                </span>
                {isSelected && (
                  <span style={{ fontSize: '9px', letterSpacing: 'var(--tracking-widest)' }}>
                    {languageCode === primaryLanguage ? '1ST' : '2ND'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Show more languages link if there are more than 6 */}
        {Object.keys(analysis.language_availability).length > 6 && (
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            +{Object.keys(analysis.language_availability).length - 6} more languages available in dropdowns
          </p>
        )}
      </div>

      {/* Continue Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`btn-brutal ${canContinue ? 'btn-brutal-primary' : 'btn-brutal-disabled'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          CONTINUE
          <Arrow size="sm" />
        </button>
      </div>
    </div>
  );
};