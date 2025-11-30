import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cross, Arrow, Tick } from '../../primitives';
import type { WizardStep, SubtitleAnalysis, EpisodeConfig, JobStatus } from '../../types/bulk';
import type { DualSubtitleConfig } from '../../types';
import { LanguageDiscoveryStep } from './LanguageDiscoveryStep';
import { EpisodePreviewStep } from './EpisodePreviewStep';
import { ProcessingStep } from './ProcessingStep';
import { ResultsStep } from './ResultsStep';

interface BulkDualSubtitleWizardProps {
  showId: string;
  showTitle: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const BulkDualSubtitleWizard: React.FC<BulkDualSubtitleWizardProps> = ({
  showId,
  showTitle,
  onClose,
  onComplete
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('discovery');
  const [analysis, setAnalysis] = useState<SubtitleAnalysis | null>(null);
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('');
  const [secondaryLanguage, setSecondaryLanguage] = useState<string>('');
  const [stylingConfig, setStylingConfig] = useState<DualSubtitleConfig>({
    primary_language: '',
    secondary_language: '',
    enable_sync: false,
    enable_language_prefix: true,
  });
  const [episodeConfigs, setEpisodeConfigs] = useState<Map<string, EpisodeConfig>>(new Map());
  const [jobId, setJobId] = useState<string>('');
  const [results, setResults] = useState<JobStatus['results'] | null>(null);

  const handleLanguageSelect = useCallback((primary: string, secondary: string) => {
    setPrimaryLanguage(primary);
    setSecondaryLanguage(secondary);
    setStylingConfig(prev => ({
      ...prev,
      primary_language: primary,
      secondary_language: secondary
    }));
    setCurrentStep('preview');
  }, []);

  const handleEpisodeConfigChange = useCallback((episodeId: string, config: EpisodeConfig) => {
    setEpisodeConfigs(prev => new Map(prev.set(episodeId, config)));
  }, []);

  const handleStartProcessing = useCallback(() => {
    setCurrentStep('processing');
  }, []);

  const handleJobStarted = useCallback((startedJobId: string) => {
    setJobId(startedJobId);
    setCurrentStep('results'); // Reuse results step for job started confirmation
  }, []);

  const handleProcessingComplete = useCallback((jobResults: JobStatus['results']) => {
    setResults(jobResults);
    // No longer needed - jobs run in background
  }, []);

  const handleBack = () => {
    switch (currentStep) {
      case 'preview':
        setCurrentStep('discovery');
        break;
      case 'processing':
        // Allow going back if job hasn't started yet
        setCurrentStep('preview');
        break;
      case 'results':
        // Don't allow going back from job started confirmation
        break;
      default:
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'discovery':
        return 'LANGUAGE DISCOVERY';
      case 'preview':
        return 'EPISODE CONFIGURATION';
      case 'processing':
        return 'STARTING JOB';
      case 'results':
        return jobId ? 'JOB STARTED' : 'COMPLETE';
      default:
        return 'BULK DUAL SUBTITLES';
    }
  };

  const canGoBack = currentStep === 'preview' || (currentStep === 'processing' && !jobId);

  // Calculate ready count for the preview step footer
  const readyCount = useMemo(() => {
    if (!analysis || !primaryLanguage || !secondaryLanguage) return 0;

    const primaryAvail = analysis.language_availability[primaryLanguage];
    const secondaryAvail = analysis.language_availability[secondaryLanguage];

    if (!primaryAvail || !secondaryAvail) return 0;

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

    return episodesWithBoth.length - episodesWithExistingDual.length;
  }, [analysis, primaryLanguage, secondaryLanguage]);

  // Determine if we should show the footer
  const showFooter = currentStep === 'preview';

  return (
    <div className="modal-brutal-overlay" style={{ zIndex: 60, alignItems: 'flex-start', paddingTop: 'var(--space-8)' }}>
      <div className="modal-brutal modal-brutal-xl" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="modal-brutal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
            {canGoBack && (
              <button
                onClick={handleBack}
                className="btn-brutal btn-brutal-secondary btn-icon btn-icon-sm"
              >
                <Arrow size="sm" rotate={180} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 className="modal-brutal-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getStepTitle()}
              </h2>
              <p className="text-sm text-secondary" style={{ marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-brutal-close"
          >
            <Cross size="md" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div style={{
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: 'var(--border-base) solid var(--border-primary)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {(['discovery', 'preview', 'results'] as WizardStep[]).map((step, index) => {
              const stepLabels = ['LANGUAGES', 'CONFIGURE', 'PROCESS'];
              const isActive = step === currentStep || (currentStep === 'processing' && step === 'results');
              const isCompleted =
                (step === 'discovery' && ['preview', 'processing', 'results'].includes(currentStep)) ||
                (step === 'preview' && ['processing', 'results'].includes(currentStep));

              return (
                <div
                  key={step}
                  style={{ display: 'flex', alignItems: 'center', flex: index < 2 ? 1 : 'none' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'var(--border-base) solid',
                        borderColor: isActive ? 'var(--accent-primary)' : isCompleted ? 'var(--accent-success)' : 'var(--border-primary)',
                        background: isActive ? 'var(--accent-primary)' : isCompleted ? 'var(--accent-success)' : 'transparent',
                        color: isActive ? 'var(--color-black)' : isCompleted ? 'var(--color-black)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: 'var(--weight-bold)',
                      }}
                    >
                      {isCompleted ? <Tick size="sm" /> : index + 1}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: 'var(--tracking-widest)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginTop: 'var(--space-1)'
                    }}>
                      {stepLabels[index]}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      style={{
                        height: '2px',
                        margin: '0 var(--space-2)',
                        flex: 1,
                        background: isCompleted ? 'var(--accent-success)' : 'var(--border-secondary)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="modal-brutal-content" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {currentStep === 'discovery' && (
            <LanguageDiscoveryStep
              showId={showId}
              analysis={analysis}
              onAnalysisLoad={setAnalysis}
              onLanguageSelect={handleLanguageSelect}
              selectedPrimary={primaryLanguage}
              selectedSecondary={secondaryLanguage}
            />
          )}

          {currentStep === 'preview' && analysis && (
            <EpisodePreviewStep
              analysis={analysis}
              primaryLanguage={primaryLanguage}
              secondaryLanguage={secondaryLanguage}
              stylingConfig={stylingConfig}
              onStylingConfigChange={setStylingConfig}
              onEpisodeConfigChange={handleEpisodeConfigChange}
              episodeConfigs={episodeConfigs}
              onStartProcessing={handleStartProcessing}
            />
          )}

          {currentStep === 'processing' && (
            <ProcessingStep
              showId={showId}
              showTitle={showTitle}
              primaryLanguage={primaryLanguage}
              secondaryLanguage={secondaryLanguage}
              stylingConfig={stylingConfig}
              episodeConfigs={episodeConfigs}
              onComplete={handleProcessingComplete}
              onJobIdReceived={handleJobStarted}
            />
          )}

          {currentStep === 'results' && jobId && (
            <JobStartedStep
              jobId={jobId}
              showTitle={showTitle}
              primaryLanguage={primaryLanguage}
              secondaryLanguage={secondaryLanguage}
              onClose={() => {
                onComplete?.();
                onClose();
              }}
              onMonitorProgress={() => {
                onClose();
                navigate(`/?job=${jobId}`);
              }}
            />
          )}

          {currentStep === 'results' && !jobId && results && (
            <ResultsStep
              results={results}
              onClose={() => {
                onComplete?.();
                onClose();
              }}
              onViewEpisode={(episodeId) => {
                onClose();
                navigate(`/episodes/${episodeId}`);
              }}
              onRetryFailed={() => {
                // Retry not implemented - user can re-run wizard
                setCurrentStep('preview');
              }}
            />
          )}
        </div>

        {/* Footer - sticky at bottom */}
        {showFooter && (
          <div className="modal-brutal-footer">
            <button
              onClick={onClose}
              className="btn-brutal btn-brutal-secondary"
            >
              CANCEL
            </button>
            <button
              onClick={handleStartProcessing}
              disabled={readyCount === 0}
              className={`btn-brutal ${readyCount > 0 ? 'btn-brutal-primary' : 'btn-brutal-disabled'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              START PROCESSING {readyCount} EPISODES
              <Arrow size="sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface JobStartedStepProps {
  jobId: string;
  showTitle: string;
  primaryLanguage: string;
  secondaryLanguage: string;
  onClose: () => void;
  onMonitorProgress: () => void;
}

const JobStartedStep: React.FC<JobStartedStepProps> = ({
  jobId,
  showTitle,
  primaryLanguage,
  secondaryLanguage,
  onClose,
  onMonitorProgress
}) => {
  return (
    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          border: 'var(--border-thick) solid var(--accent-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)',
          background: 'var(--accent-success)',
        }}>
          <Tick size="xl" style={{ color: 'var(--color-white)' }} />
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--accent-success)',
          marginBottom: 'var(--space-3)',
          letterSpacing: 'var(--tracking-tight)',
        }}>
          JOB STARTED SUCCESSFULLY
        </h3>

        {/* Details */}
        <div className="card-brutal" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left' }}>
              <span style={{ color: 'var(--text-muted)' }}>SHOW:</span>
              <span style={{ fontWeight: 'var(--weight-bold)' }}>{showTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left' }}>
              <span style={{ color: 'var(--text-muted)' }}>LANGUAGES:</span>
              <span style={{ fontWeight: 'var(--weight-bold)' }}>{primaryLanguage} + {secondaryLanguage}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left' }}>
              <span style={{ color: 'var(--text-muted)' }}>JOB ID:</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)' }}>{jobId.substring(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)' }}>
            <strong>Your job is now running in the background.</strong><br />
            You can safely close this window and monitor progress from the dashboard.
            The background job will continue processing your dual subtitles.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            className="btn-brutal btn-brutal-primary"
          >
            CLOSE & RETURN TO SHOW
          </button>
          <button
            onClick={onMonitorProgress}
            className="btn-brutal btn-brutal-secondary"
          >
            MONITOR PROGRESS
          </button>
        </div>
      </div>
    </div>
  );
};