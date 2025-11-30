/**
 * Spinner — Loading indicator primitive
 *
 * Brutal loading indicator. Block characters.
 * Terminal-style animation.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = 'md', label = 'Loading', ...props }, ref) => {
    const classes = clsx(
      'spinner-brutal',
      `spinner-brutal-${size}`,
      className
    );

    return (
      <span
        ref={ref}
        className={classes}
        role="status"
        aria-label={label}
        {...props}
      >
        <span className="spinner-brutal-blocks" aria-hidden="true">
          ▓▒░
        </span>
      </span>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
