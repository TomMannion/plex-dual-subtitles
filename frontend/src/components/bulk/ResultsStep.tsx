import React from 'react';
import { Tick, Cross, Arrow, Target } from '../../primitives';
import type { JobStatus } from '../../types/bulk';

interface ResultsStepProps {
  results: JobStatus['results'];
  onClose: () => void;
  onViewEpisode: (episodeId: string) => void;
  onRetryFailed: (episodeIds: string[]) => void;
}

export const ResultsStep: React.FC<ResultsStepProps> = ({
  results,
  onClose,
  onViewEpisode,
  onRetryFailed
}) => {
  if (!results) return null;

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: `var(--border-thick) solid ${results.failed.length === 0 ? 'var(--accent-success)' : 'var(--accent-primary)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-3)',
          background: results.failed.length === 0 ? 'var(--accent-success)' : 'var(--accent-primary)',
          position: 'relative',
        }}>
          <Tick size="lg" style={{ color: 'var(--color-white)' }} />
          {results.failed.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              background: 'var(--accent-primary)',
              border: 'var(--border-base) solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', color: 'var(--color-white)' }}>!</span>
            </div>
          )}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h4)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-1)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          PROCESSING COMPLETE
        </h3>

        <p style={{ color: 'var(--text-muted)' }}>
          {results.failed.length === 0
            ? `Successfully created ${results.successful.length} dual subtitles`
            : `Created ${results.successful.length} dual subtitles with ${results.failed.length} failures`
          }
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)', borderColor: 'var(--accent-success)' }}>
          <Tick size="lg" style={{ color: 'var(--accent-success)', margin: '0 auto var(--space-1)' }} />
          <div style={{
            fontSize: 'var(--text-h3)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-heading)',
            color: 'var(--accent-success)',
          }}>
            {results.successful.length}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>SUCCESSFUL</div>
        </div>

        {results.failed.length > 0 && (
          <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)', borderColor: 'var(--accent-primary)' }}>
            <Cross size="lg" style={{ color: 'var(--accent-primary)', margin: '0 auto var(--space-1)' }} />
            <div style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-primary)',
            }}>
              {results.failed.length}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>FAILED</div>
          </div>
        )}

        {results.skipped.length > 0 && (
          <div className="card-brutal" style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
            <Arrow size="lg" style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-1)' }} />
            <div style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-heading)',
            }}>
              {results.skipped.length}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-widest)' }}>SKIPPED</div>
          </div>
        )}
      </div>

      {/* Failed Episodes Details */}
      {results.failed.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-bold)',
            marginBottom: 'var(--space-2)',
            letterSpacing: 'var(--tracking-widest)',
          }}>
            FAILED EPISODES
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {results.failed.map((failure) => (
              <div
                key={failure.episode_id}
                className="card-brutal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2)',
                  borderColor: 'var(--accent-primary)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 'var(--weight-bold)' }}>
                    Episode {failure.episode_id}
                  </p>
                  <p style={{ fontSize: 'var(--text-caption)', color: 'var(--accent-primary)' }}>
                    {failure.error}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <button
                    onClick={() => onViewEpisode(failure.episode_id)}
                    className="btn-brutal btn-brutal-ghost btn-icon btn-icon-sm"
                    title="View Episode"
                  >
                    <Target size="sm" />
                  </button>
                  <button
                    onClick={() => onRetryFailed([failure.episode_id])}
                    className="btn-brutal btn-brutal-ghost btn-icon btn-icon-sm"
                    title="Retry"
                  >
                    <Arrow size="sm" rotate={180} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
        <button
          onClick={onClose}
          className="btn-brutal btn-brutal-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          DONE
          <Cross size="sm" />
        </button>
      </div>
    </div>
  );
};