/**
 * JobStatusWidget — Brutalist job status display
 *
 * Aggressive brutalist design using existing primitives.
 * Black backgrounds, thick borders, chaotic but intentional.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Job } from '../../types/jobs';
import {
  Box,
  Stack,
  Card,
  Text,
  Heading,
  Badge,
  Progress,
  Tick,
  Cross,
  Play,
  Stop,
  Bang,
  Target,
} from '../../primitives';

interface JobStatusWidgetProps {
  onViewJobDetails: (jobId: string) => void;
  compact?: boolean;
}

export const JobStatusWidget: React.FC<JobStatusWidgetProps> = ({ onViewJobDetails, compact = false }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setError(null);
      const response = await api.get('/api/jobs/');
      setJobs(response.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to fetch jobs');
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Bang size="sm" className="text-muted" />;
      case 'running':
        return <Play size="sm" className="text-accent" />;
      case 'completed':
        return <Tick size="sm" className="text-success" />;
      case 'failed':
        return <Cross size="sm" className="text-accent" />;
      case 'cancelled':
        return <Stop size="sm" className="text-muted" />;
      default:
        return <Bang size="sm" className="text-muted" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' => {
    switch (status) {
      case 'running': return 'accent';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'muted';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString();
  };

  // Filter to show only active jobs and recent completed/failed jobs (last 24 hours)
  const relevantJobs = jobs.filter(job => {
    if (['pending', 'running'].includes(job.status)) return true;

    const jobDate = new Date(job.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);

    return diffHours < 24;
  }).slice(0, 5);

  if (error) {
    return (
      <Card variant="outline" className="border-accent">
        <Stack direction="row" gap={2} align="center">
          <Cross size="sm" className="text-accent" />
          <Text variant="body-sm" color="muted">Failed to load jobs</Text>
        </Stack>
      </Card>
    );
  }

  if (relevantJobs.length === 0) {
    if (compact) return null;
    return (
      <Card variant="outline">
        <Stack direction="row" gap={2} align="center">
          <Tick size="sm" className="text-success" />
          <Text variant="body-sm" color="muted">No active tasks</Text>
        </Stack>
      </Card>
    );
  }

  const runningCount = jobs.filter(j => j.status === 'running').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  return (
    <Box className="card-brutal-outline" style={{ border: 'var(--border-base) solid var(--border-primary)' }}>
      {/* Header row - title and counters slotted together */}
      <Stack
        direction="row"
        justify="between"
        align="center"
        className="card-brutal-header bg-primary"
      >
        {/* Title block */}
        <Stack direction="row" align="center" gap={2}>
          {!compact && (
            <Box
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'var(--border-base) solid var(--border-primary)',
                background: 'var(--bg-primary)',
              }}
            >
              <Play size="md" />
            </Box>
          )}
          <Box>
            <Heading level={4}>TASKS</Heading>
            {!compact && <Text variant="caption" color="muted">Background processing</Text>}
          </Box>
        </Stack>

        {/* Counter stamps - like zine stamps */}
        <Stack direction="row" gap={2}>
          {runningCount > 0 && (
            <Box
              className="zine-stamp"
              style={{
                padding: 'var(--space-1) var(--space-2)',
                borderColor: 'var(--accent-primary)',
                background: 'var(--accent-primary)',
                transform: 'rotate(-2deg)',
              }}
            >
              <Text variant="caption" bold style={{ color: 'var(--color-black)', lineHeight: 1 }}>
                {runningCount}
              </Text>
              <Text variant="caption" style={{ color: 'var(--color-black)', fontSize: '9px', letterSpacing: '0.1em' }}>
                ACTIVE
              </Text>
            </Box>
          )}
          {completedCount > 0 && (
            <Box
              className="zine-stamp"
              style={{
                padding: 'var(--space-1) var(--space-2)',
                borderColor: 'var(--accent-success)',
                background: 'var(--accent-success)',
                transform: 'rotate(1deg)',
              }}
            >
              <Text variant="caption" bold style={{ color: 'var(--color-black)', lineHeight: 1 }}>
                {completedCount}
              </Text>
              <Text variant="caption" style={{ color: 'var(--color-black)', fontSize: '9px', letterSpacing: '0.1em' }}>
                DONE
              </Text>
            </Box>
          )}
          {failedCount > 0 && (
            <Box
              className="zine-stamp"
              style={{
                padding: 'var(--space-1) var(--space-2)',
                borderColor: 'var(--accent-primary)',
                transform: 'rotate(-1deg)',
              }}
            >
              <Text variant="caption" bold className="text-accent" style={{ lineHeight: 1 }}>
                {failedCount}
              </Text>
              <Text variant="caption" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>
                FAIL
              </Text>
            </Box>
          )}
        </Stack>
      </Stack>

      {/* Job list */}
      <Box className="card-brutal-body" style={{ background: 'var(--bg-primary)' }}>
        <Stack gap={2}>
          {relevantJobs.map((job, index) => (
            <Card
              key={job.id}
              variant="outline"
              interactive
              padding={3}
              onClick={() => onViewJobDetails(job.id)}
              style={{
                marginLeft: index % 2 === 1 ? '4px' : '0',
                background: 'var(--bg-primary)',
              }}
            >
              <Stack direction="row" gap={3} align="start">
                {/* Status icon block */}
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'var(--border-sm) solid var(--border-primary)',
                    flexShrink: 0,
                  }}
                >
                  {getStatusIcon(job.status)}
                </Box>

                {/* Content */}
                <Box className="flex-1 min-w-0">
                  {/* Title row with badge */}
                  <Stack direction="row" justify="between" align="center" gap={2}>
                    <Text bold className="truncate" style={{ flex: 1, minWidth: 0 }}>{job.title}</Text>
                    <Badge variant={getStatusBadgeVariant(job.status)} size="sm" style={{ flexShrink: 0 }}>
                      {job.status.toUpperCase()}
                    </Badge>
                  </Stack>

                  {/* Description */}
                  <Text variant="caption" color="muted">{job.description}</Text>

                  {/* Meta row */}
                  <Stack direction="row" align="center" gap={2} className="mt-1">
                    <Text variant="caption" color="muted">{formatDate(job.created_at)}</Text>
                    <Target size="sm" className="text-muted" />
                  </Stack>

                  {/* Progress for running jobs */}
                  {job.status === 'running' && (
                    <Box mt={2}>
                      <Stack direction="row" justify="between" align="center" gap={2}>
                        <Text variant="caption" color="muted" className="truncate">
                          {job.progress.current_step}
                        </Text>
                        <Text variant="caption" bold className="text-accent">
                          {Math.round(job.progress.percentage)}%
                        </Text>
                      </Stack>
                      <Box mt={1}>
                        <Progress value={job.progress.percentage} variant="accent" size="sm" />
                      </Box>
                      {job.progress.estimated_time_remaining && (
                        <Stack direction="row" gap={3} className="mt-1">
                          <Text variant="caption" className="text-accent">
                            {job.progress.estimated_time_remaining} left
                          </Text>
                          <Text variant="caption" color="muted">
                            {job.progress.processed}/{job.progress.total}
                          </Text>
                        </Stack>
                      )}
                    </Box>
                  )}

                  {/* Results for completed jobs */}
                  {job.status === 'completed' && job.result && (
                    <Stack direction="row" gap={3} className="mt-2">
                      <Text variant="body-sm" className="text-success">
                        +{job.result.successful?.length || 0} successful
                      </Text>
                      {job.result.failed?.length > 0 && (
                        <Text variant="body-sm" className="text-accent">
                          ×{job.result.failed.length} failed
                        </Text>
                      )}
                      {job.result.skipped?.length > 0 && (
                        <Text variant="body-sm" color="muted">
                          !{job.result.skipped.length} skipped
                        </Text>
                      )}
                    </Stack>
                  )}

                  {/* Error for failed jobs */}
                  {job.status === 'failed' && job.error && (
                    <Box mt={2} p={2} style={{ background: 'var(--accent-primary-bg)', border: 'var(--border-sm) solid var(--accent-primary)' }}>
                      <Text variant="caption" className="text-accent">
                        {job.error.split('\n')[0]}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
