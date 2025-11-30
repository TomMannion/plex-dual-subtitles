import React, { useEffect, useState } from 'react';
import { Tick, Bang } from '../../primitives';
import type { EpisodeConfig, JobStatus } from '../../types/bulk';
import type { DualSubtitleConfig } from '../../types';
import { api } from '../../lib/api';

interface ProcessingStepProps {
  showId: string;
  showTitle: string;
  primaryLanguage: string;
  secondaryLanguage: string;
  stylingConfig: DualSubtitleConfig;
  episodeConfigs: Map<string, EpisodeConfig>;
  onComplete: (results: JobStatus['results']) => void;
  onJobIdReceived: (jobId: string) => void;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  showId,
  showTitle,
  primaryLanguage,
  secondaryLanguage,
  stylingConfig,
  episodeConfigs,
  onComplete,
  onJobIdReceived
}) => {
  const [progress, setProgress] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState<string>('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const [averageTime, setAverageTime] = useState<number>(45);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start background job and monitor its progress
  useEffect(() => {
    const startBackgroundJob = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        const jobResponse = await api.post('/api/jobs/bulk-dual-subtitle', {
          show_id: showId,
          show_title: showTitle,
          primary_language: primaryLanguage,
          secondary_language: secondaryLanguage,
          styling_config: stylingConfig,
          episode_configs: Object.fromEntries(episodeConfigs) // Convert Map to object
        });

        const jobId = jobResponse.data.job_id;

        // Notify parent that job has started
        onJobIdReceived(jobId);

        // Poll for job progress
        const pollInterval = setInterval(async () => {
          try {
            const jobDetails = await api.get(`/api/jobs/${jobId}`);
            const job = jobDetails.data;

            // Update progress
            if (job.progress) {
              setProgress(job.progress.percentage || 0);
              setCurrentEpisode(job.progress.current_item || '');
              setEstimatedTimeRemaining(job.progress.estimated_time_remaining || '');
              if (job.progress.details?.average_time_per_episode) {
                setAverageTime(parseInt(job.progress.details.average_time_per_episode) || 45);
              }
            }

            // Check if job is completed
            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setProgress(100);
              setIsProcessing(false);

              // Small delay to show completion state
              setTimeout(() => {
                onComplete(job.result || { successful: [], failed: [], skipped: [] });
              }, 1000);

            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              setError(job.error || 'Job failed');
              setIsProcessing(false);

            } else if (job.status === 'cancelled') {
              clearInterval(pollInterval);
              setError('Job was cancelled');
              setIsProcessing(false);
            }

          } catch {
            // Polling error - will retry on next interval
          }
        }, 1000); // Poll every second

        // Store the interval for cleanup
        return pollInterval;

      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
        setError(axiosError.response?.data?.detail || axiosError.message || 'Failed to start processing');
        setIsProcessing(false);
      }
    };

    const intervalPromise = startBackgroundJob();

    // Cleanup function
    return () => {
      if (intervalPromise instanceof Promise) {
        intervalPromise.then(interval => {
          if (interval) clearInterval(interval);
        });
      } else if (intervalPromise) {
        clearInterval(intervalPromise);
      }
    };
  }, [showId, primaryLanguage, secondaryLanguage, stylingConfig, episodeConfigs, onComplete, onJobIdReceived]);

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center' }}>
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
            PROCESSING FAILED
          </h3>

          <p style={{ color: 'var(--accent-primary)', marginBottom: 'var(--space-3)' }}>
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="btn-brutal btn-brutal-primary"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: `var(--border-thick) solid ${isProcessing ? 'var(--border-primary)' : 'var(--accent-success)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-3)',
          background: isProcessing ? 'transparent' : 'var(--accent-success)',
        }}>
          {isProcessing ? (
            <div className="spinner" />
          ) : (
            <Tick size="lg" style={{ color: 'var(--color-white)' }} />
          )}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h4)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-1)',
          letterSpacing: 'var(--tracking-widest)',
        }}>
          {isProcessing ? 'CREATING DUAL SUBTITLES' : 'PROCESSING COMPLETE'}
        </h3>

        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
          {isProcessing
            ? `Processing ${primaryLanguage} + ${secondaryLanguage} subtitles...`
            : 'All episodes have been processed'
          }
        </p>

        {isProcessing && (
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
            Using hybrid sync: primary to video, secondary to primary
          </p>
        )}

        {/* Current Episode */}
        {currentEpisode && isProcessing && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--accent-primary)', marginBottom: 'var(--space-1)' }}>
              Currently processing: {currentEpisode}
            </p>
            {estimatedTimeRemaining && (
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p>Estimated time remaining: <span style={{ fontWeight: 'var(--weight-bold)' }}>{estimatedTimeRemaining}</span></p>
                <p>Average per episode: <span style={{ fontWeight: 'var(--weight-bold)' }}>{averageTime}s</span></p>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="progress-brutal progress-brutal-accent" style={{ marginBottom: 'var(--space-2)' }}>
          <div
            className="progress-brutal-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="progress-brutal-value">{Math.round(progress)}%</span>
        </div>

        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
};