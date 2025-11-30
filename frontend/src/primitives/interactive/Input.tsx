/**
 * Input — Text input primitive
 *
 * Thick-bordered input field. Monospace text.
 * Hard focus ring. No rounded corners.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, fullWidth, ...props }, ref) => {
    const classes = clsx(
      'input-brutal',
      error && 'input-brutal-error',
      fullWidth && 'w-full',
      className
    );

    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = 'Input';

export { Input };
