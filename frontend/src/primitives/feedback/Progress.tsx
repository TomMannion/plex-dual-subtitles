/**
 * Progress — Progress bar primitive
 *
 * Hard-edged progress indicator.
 * Shows completion percentage with brutalist styling.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type ProgressVariant = 'default' | 'accent' | 'success';
type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showValue?: boolean;
  label?: string;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      variant = 'default',
      size = 'md',
      showValue = false,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variantClasses = {
      default: '',
      accent: 'progress-brutal-accent',
      success: 'progress-brutal-success',
    };

    const sizeClasses = {
      sm: 'progress-brutal-sm',
      md: '',
      lg: 'progress-brutal-lg',
    };

    const classes = clsx(
      'progress-brutal',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        {...props}
      >
        <div
          className="progress-brutal-fill"
          style={{ width: `${percentage}%` }}
        />
        {showValue && (
          <span className="progress-brutal-value">{Math.round(percentage)}%</span>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
