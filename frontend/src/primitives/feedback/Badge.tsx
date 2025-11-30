/**
 * Badge — Status/count indicator primitive
 *
 * Small, bold indicators for counts, status, labels.
 * Hard borders. No rounded corners.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  outline?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, variant = 'default', size = 'md', outline, ...props }, ref) => {
    const classes = clsx(
      'badge-brutal',
      `badge-brutal-${variant}`,
      size === 'sm' && 'badge-brutal-sm',
      outline && 'badge-brutal-outline',
      className
    );

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
