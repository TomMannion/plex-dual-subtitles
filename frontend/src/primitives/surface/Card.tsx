/**
 * Card — Container surface primitive
 *
 * Hard-edged container with border and shadow.
 * The fundamental building block for content grouping.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: 'div' | 'article' | 'section' | 'aside';
  variant?: CardVariant;
  interactive?: boolean; // Adds hover state
  selected?: boolean;
  padding?: 0 | 1 | 2 | 3 | 4 | 6;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      as: Component = 'div',
      className,
      variant = 'default',
      interactive,
      selected,
      padding = 3,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      'card-brutal',
      `card-brutal-${variant}`,
      interactive && 'card-brutal-interactive',
      selected && 'card-brutal-selected',
      padding !== undefined && `p-${padding}`,
      className
    );

    return (
      <Component ref={ref} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Compound components for card sections
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('card-brutal-header', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'Card.Header';

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('card-brutal-body', className)} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'Card.Body';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('card-brutal-footer', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'Card.Footer';

export { Card, CardHeader, CardBody, CardFooter };
