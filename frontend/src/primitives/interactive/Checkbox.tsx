/**
 * Checkbox — Checkbox input primitive
 *
 * Hard-edged checkbox with brutalist styling.
 * Supports indeterminate state.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, indeterminate, disabled, ...props }, ref) => {
    const checkboxRef = (node: HTMLInputElement | null) => {
      if (node) {
        node.indeterminate = indeterminate ?? false;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const classes = clsx(
      'checkbox-brutal-wrapper',
      disabled && 'checkbox-brutal-disabled',
      className
    );

    return (
      <label className={classes}>
        <input
          ref={checkboxRef}
          type="checkbox"
          className="checkbox-brutal"
          disabled={disabled}
          {...props}
        />
        <span className="checkbox-brutal-box">
          <span className="checkbox-brutal-check">X</span>
        </span>
        {label && <span className="checkbox-brutal-label">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
