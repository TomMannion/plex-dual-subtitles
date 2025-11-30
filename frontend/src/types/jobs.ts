/**
 * Shared job types for background task management
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobProgress {
  current_step: string;
  current_item: string;
  processed: number;
  total: number;
  percentage: number;
  estimated_time_remaining: string;
  details: Record<string, unknown>;
}

export interface JobResultItem {
  episode_id: string;
  episode_title: string;
  output_file?: string;
  output_path?: string;
  error?: string;
  reason?: string;
}

export interface JobResult {
  successful: JobResultItem[];
  failed: JobResultItem[];
  skipped: JobResultItem[];
}

export interface Job {
  id: string;
  type: string;
  title: string;
  description: string;
  status: JobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: JobProgress;
  result?: JobResult;
  error?: string;
  metadata?: Record<string, unknown>;
}
