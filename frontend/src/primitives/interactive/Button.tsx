/**
 * Button — Primary interactive primitive
 *
 * Hard shadows. Thick borders. Physical feedback.
 * Translates on hover/press for brutal tactile feel.
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      disabled,
      icon,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn-brutal-primary',
      secondary: 'btn-brutal-secondary',
      ghost: 'btn-brutal-ghost',
      danger: 'btn-brutal-danger',
    };

    const sizeClasses = {
      sm: 'btn-brutal-sm',
      md: '', // Default size, no extra class needed
      lg: 'btn-brutal-lg',
    };

    const classes = clsx(
      'btn-brutal',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      (loading || disabled) && 'btn-brutal-disabled',
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="btn-brutal-loading" aria-label="Loading">
            ▓▓▓
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="btn-brutal-icon">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="btn-brutal-icon">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
