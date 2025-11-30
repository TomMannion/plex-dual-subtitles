/**
 * Select — Dropdown primitive
 *
 * Brutal dropdown with thick borders.
 * Custom arrow indicator.
 */

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  error?: boolean;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, error, fullWidth, ...props }, ref) => {
    const classes = clsx(
      'select-brutal',
      error && 'select-brutal-error',
      fullWidth && 'w-full',
      className
    );

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
