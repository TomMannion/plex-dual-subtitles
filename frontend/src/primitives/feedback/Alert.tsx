/**
 * Alert — Feedback message primitive
 *
 * Hard-edged alert banners for user feedback.
 * Info, success, warning, error variants.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  onDismiss?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    { children, className, variant = 'info', title, icon, onDismiss, ...props },
    ref
  ) => {
    const variantClasses = {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-error',
    };

    const classes = clsx('alert', variantClasses[variant], className);

    return (
      <div ref={ref} className={classes} role="alert" {...props}>
        <div className="alert-content">
          {icon && <span className="alert-icon">{icon}</span>}
          <div className="alert-body">
            {title && <div className="alert-title">{title}</div>}
            <div className="alert-message">{children}</div>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            className="alert-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss alert"
          >
            X
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
