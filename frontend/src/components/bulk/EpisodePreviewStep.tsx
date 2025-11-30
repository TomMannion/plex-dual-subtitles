import React, { useMemo } from 'react';
import { Tick, Bang, Cross, Layers } from '../../primitives';
import type { SubtitleAnalysis, EpisodeConfig } from '../../types/bulk';
import type { DualSubtitleConfig } from '../../types';
import { COMPREHENSIVE_LANGUAGES } from '../../data/languages';
import { SubtitleStyleForm } from '../SubtitleStyleForm';

interface EpisodePreviewStepProps {
  analysis: SubtitleAnalysis;
  primaryLanguage: string;
  secondaryLanguage: string;
  stylingConfig: DualSubtitleConfig;
  onStylingConfigChange: (config: DualSubtitleConfig) => void;
  onEpisodeConfigChange: (episodeId: string, config: EpisodeConfig) => void;
  episodeConfigs: Map<string, EpisodeConfig>;
  onStartProcessing: () => void;
}

export const EpisodePreviewStep: React.FC<EpisodePreviewStepProps> = ({
  analysis,
  primaryLanguage,
  secondaryLanguage,
  stylingConfig,
  onStylingConfigChange,
}) => {
  // Calculate episode statistics
  const stats = useMemo(() => {
    const primaryAvail = analysis.language_availability[primaryLanguage];
    const secondaryAvail = analysis.language_availability[secondaryLanguage];

    if (!primaryAvail || !secondaryAvail) {
      return { ready: 0, needsAttention: 0, willSkip: analysis.total_episodes, alreadyExists: 0 };
    }

    // Find episodes that have both languages available
    const episodesWithBoth = primaryAvail.episode_details.filter(ep =>
      secondaryAvail.episode_details.some(secEp => secEp.episode_id === ep.episode_id)
    );

    // Check which episodes already have the requested dual subtitle combination
    const episodesWithExistingDual = episodesWithBoth.filter(ep =>
      ep.existing_dual_subtitles?.some((dualSub) => {
        if (!dualSub.dual_languages || dualSub.dual_languages.length < 2) return false;
        const [lang1, lang2] = dualSub.dual_languages;
        return (lang1 === primaryLanguage && lang2 === secondaryLanguage) ||
               (lang1 === secondaryLanguage && lang2 === primaryLanguage);
      })
    );

    const alreadyExists = episodesWithExistingDual.length;
    const ready = episodesWithBoth.length - alreadyExists; // Subtract existing dual subtitles
    const maxAvailable = Math.max(primaryAvail.episodes_available, secondaryAvail.episodes_available);
    const needsAttention = maxAvailable - episodesWithBoth.length;
    const willSkip = analysis.total_episodes - maxAvailable;

    return { ready, needsAttention, willSkip, alreadyExists };
  }, [analysis, primaryLanguage, secondaryLanguage]);

  const primaryLangName = COMPREHENSIVE_LANGUAGES.find(l => l.code === primaryLanguage)?.name || primaryLanguage;
  const secondaryLangName = COMPREHENSIVE_LANGUAGES.find(l => l.code === secondaryLanguage)?.name || secondaryLanguage;

  return (
    <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h4)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-1)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          EPISODE CONFIGURATION
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Creating {primaryLangName} + {secondaryLangName} dual subtitles
        </p>
      </div>

      {/* Statistics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
        <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)', borderColor: 'var(--accent-success)' }}>
          <Tick size="lg" style={{ color: 'var(--accent-success)', margin: '0 auto var(--space-1)' }} />
          <div style={{
            fontSize: 'var(--text-h3)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-heading)',
            color: 'var(--accent-success)',
          }}>
            {stats.ready}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>READY</div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Both languages available</p>
        </div>

        {stats.needsAttention > 0 && (
          <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
            <Bang size="lg" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-1)' }} />
            <div style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-heading)',
            }}>
              {stats.needsAttention}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>PARTIAL</div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Missing one language</p>
          </div>
        )}

        {stats.alreadyExists > 0 && (
          <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
            <Tick size="lg" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-1)' }} />
            <div style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-heading)',
            }}>
              {stats.alreadyExists}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>EXISTS</div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Dual subtitles exist</p>
          </div>
        )}

        {stats.willSkip > 0 && (
          <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)', borderColor: 'var(--accent-primary)' }}>
            <Cross size="lg" style={{ color: 'var(--accent-primary)', margin: '0 auto var(--space-1)' }} />
            <div style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-primary)',
            }}>
              {stats.willSkip}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>SKIP</div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>No subtitles available</p>
          </div>
        )}
      </div>

      {/* Styling Options */}
      <div className="card-brutal" style={{ padding: 'var(--space-3)' }}>
        <h4 style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-body-sm)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-2)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          <Layers size="md" />
          STYLING OPTIONS
        </h4>

        <div style={{ background: 'var(--bg-secondary)', border: 'var(--border-thin) solid var(--border-secondary)', padding: 'var(--space-2)' }}>
          <SubtitleStyleForm
            config={{
              ...stylingConfig,
              primary_language: primaryLanguage,
              secondary_language: secondaryLanguage,
            }}
            onChange={onStylingConfigChange}
          />
        </div>
      </div>

    </div>
  );
};