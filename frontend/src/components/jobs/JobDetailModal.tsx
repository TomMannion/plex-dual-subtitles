/**
 * JobDetailModal — Brutalist job detail view
 *
 * Shows detailed job information in a modal.
 */

import React, { useState, useEffect } from 'react';
import { Dot, Tick, Cross, Bang, Play, Stop, Skull } from '../../primitives';
import { api } from '../../lib/api';
import type { Job } from '../../types/jobs';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Card, Stack, Text, Heading, Button, Progress, Spinner
} from '../../primitives';

interface JobDetailModalProps {
  jobId: string;
  onClose: () => void;
  onJobComplete?: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  onClose,
  onJobComplete
}) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchJobDetails = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/jobs/${jobId}`);
      const newJob = response.data;

      if (job?.status !== 'completed' && newJob.status === 'completed' && onJobComplete) {
        onJobComplete();
      }

      setJob(newJob);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to fetch job details');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelJob = async () => {
    if (!job || isCancelling) return;

    setIsCancelling(true);
    try {
      await api.post(`/api/jobs/${job.id}/cancel`);
      await fetchJobDetails();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to cancel job');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();

    const interval = setInterval(() => {
      if (job?.status === 'running' || job?.status === 'pending') {
        fetchJobDetails();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Dot size="md" className="text-muted" />;
      case 'running':
        return <Play size="md" className="text-accent" />;
      case 'completed':
        return <Tick size="md" className="text-success" />;
      case 'failed':
        return <Cross size="md" className="text-accent" />;
      case 'cancelled':
        return <Stop size="md" className="text-muted" />;
      default:
        return <Bang size="md" className="text-muted" />;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const calculateDuration = (startStr?: string, endStr?: string) => {
    if (!startStr) return null;

    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const diffMs = end.getTime() - start.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} size="sm">
        <ModalBody>
          <Stack direction="row" align="center" gap={3} justify="center" className="py-8">
            <Spinner />
            <Text>Loading job details...</Text>
          </Stack>
        </ModalBody>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={true} onClose={onClose} size="sm" title="Error">
        <ModalBody>
          <div className="alert alert-error">
            <Text className="text-accent">{error}</Text>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} fullWidth>Close</Button>
        </ModalFooter>
      </Modal>
    );
  }

  if (!job) return null;

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      {/* Header */}
      <ModalHeader>
        <Stack direction="row" align="center" justify="between" className="w-full">
          <Stack direction="row" align="center" gap={3}>
            {getStatusIcon(job.status)}
            <div>
              <Heading level={4}>{job.title}</Heading>
              <Text variant="body-sm" color="muted">{job.description}</Text>
            </div>
          </Stack>
          <Stack direction="row" gap={2}>
            {(job.status === 'pending' || job.status === 'running') && (
              <Button
                variant="secondary"
                onClick={cancelJob}
                disabled={isCancelling}
                icon={<Skull size="sm" />}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
          </Stack>
        </Stack>
      </ModalHeader>

      {/* Content */}
      <ModalBody>
        <Stack gap={4}>
          {/* Job Info Grid */}
          <div className="episode-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Job Information */}
            <Card variant="outline" padding={3}>
              <Stack gap={3}>
                <Heading level={5}>Job Information</Heading>
                <Stack gap={2}>
                  <Stack direction="row" justify="between">
                    <Text variant="body-sm" color="muted">Status:</Text>
                    <Text variant="body-sm" className="capitalize">{job.status}</Text>
                  </Stack>
                  <Stack direction="row" justify="between">
                    <Text variant="body-sm" color="muted">Created:</Text>
                    <Text variant="body-sm">{formatDateTime(job.created_at)}</Text>
                  </Stack>
                  {job.started_at && (
                    <Stack direction="row" justify="between">
                      <Text variant="body-sm" color="muted">Started:</Text>
                      <Text variant="body-sm">{formatDateTime(job.started_at)}</Text>
                    </Stack>
                  )}
                  {job.completed_at && (
                    <Stack direction="row" justify="between">
                      <Text variant="body-sm" color="muted">Completed:</Text>
                      <Text variant="body-sm">{formatDateTime(job.completed_at)}</Text>
                    </Stack>
                  )}
                  {job.started_at && (
                    <Stack direction="row" justify="between">
                      <Text variant="body-sm" color="muted">Duration:</Text>
                      <Text variant="body-sm">{calculateDuration(job.started_at, job.completed_at)}</Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Card>

            {/* Progress */}
            {job.status === 'running' && (
              <Card variant="outline" padding={3}>
                <Stack gap={3}>
                  <Heading level={5}>Progress</Heading>
                  <Stack gap={2}>
                    <Stack direction="row" justify="between" align="center">
                      <Text variant="body-sm" color="muted">{job.progress.current_step}</Text>
                      <Text variant="body-sm" bold>{Math.round(job.progress.percentage)}%</Text>
                    </Stack>
                    <Progress value={job.progress.percentage} variant="accent" />
                    {job.progress.current_item && (
                      <Text variant="body-sm" color="muted">{job.progress.current_item}</Text>
                    )}
                    <Text variant="body-sm" color="muted">
                      {job.progress.processed} of {job.progress.total} completed
                    </Text>
                    {job.progress.estimated_time_remaining && (
                      <Text variant="body-sm" className="text-accent">
                        {job.progress.estimated_time_remaining} remaining
                      </Text>
                    )}
                  </Stack>
                </Stack>
              </Card>
            )}
          </div>

          {/* Results */}
          {job.result && job.status === 'completed' && (
            <Stack gap={3}>
              <Heading level={5}>Results</Heading>

              {/* Result Stats */}
              <div className="episode-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <Card variant="outline" padding={3} className="alert-success">
                  <Stack gap={2}>
                    <Stack direction="row" align="center" gap={2}>
                      <Tick size="sm" className="text-success" />
                      <Text bold className="text-success">Successful</Text>
                    </Stack>
                    <Heading level={2} className="text-success">
                      {job.result.successful?.length || 0}
                    </Heading>
                  </Stack>
                </Card>

                <Card variant="outline" padding={3} className="alert-error">
                  <Stack gap={2}>
                    <Stack direction="row" align="center" gap={2}>
                      <Cross size="sm" className="text-accent" />
                      <Text bold className="text-accent">Failed</Text>
                    </Stack>
                    <Heading level={2} className="text-accent">
                      {job.result.failed?.length || 0}
                    </Heading>
                  </Stack>
                </Card>

                <Card variant="outline" padding={3} className="alert-warning">
                  <Stack gap={2}>
                    <Stack direction="row" align="center" gap={2}>
                      <Bang size="sm" className="text-muted" />
                      <Text bold color="muted">Skipped</Text>
                    </Stack>
                    <Heading level={2} color="muted">
                      {job.result.skipped?.length || 0}
                    </Heading>
                  </Stack>
                </Card>
              </div>

              {/* Failed Episodes */}
              {job.result.failed && job.result.failed.length > 0 && (
                <Stack gap={2}>
                  <Text bold className="text-accent">Failed Episodes</Text>
                  <div className="subtitle-list-scroll" style={{ maxHeight: '160px' }}>
                    <Stack gap={2}>
                      {job.result.failed.map((item, index) => (
                        <Card key={index} variant="outline" padding={2} className="alert-error">
                          <Text bold variant="body-sm" className="text-accent">
                            {item.episode_title}
                          </Text>
                          <Text variant="caption" color="muted">{item.error}</Text>
                        </Card>
                      ))}
                    </Stack>
                  </div>
                </Stack>
              )}

              {/* Skipped Episodes */}
              {job.result.skipped && job.result.skipped.length > 0 && (
                <Stack gap={2}>
                  <Text bold color="muted">Skipped Episodes</Text>
                  <div className="subtitle-list-scroll" style={{ maxHeight: '160px' }}>
                    <Stack gap={2}>
                      {job.result.skipped.map((item, index) => (
                        <Card key={index} variant="outline" padding={2} className="alert-warning">
                          <Text bold variant="body-sm" color="muted">
                            {item.episode_title}
                          </Text>
                          <Text variant="caption" color="muted">{item.reason}</Text>
                        </Card>
                      ))}
                    </Stack>
                  </div>
                </Stack>
              )}
            </Stack>
          )}

          {/* Error Details */}
          {job.status === 'failed' && job.error && (
            <Stack gap={2}>
              <Heading level={5} className="text-accent">Error Details</Heading>
              <Card variant="outline" padding={3} className="alert-error">
                <pre className="text-sm text-accent" style={{ whiteSpace: 'pre-wrap', maxHeight: '160px', overflow: 'auto' }}>
                  {job.error}
                </pre>
              </Card>
            </Stack>
          )}
        </Stack>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
