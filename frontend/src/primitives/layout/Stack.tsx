/**
 * Stack — Vertical/horizontal stacking primitive
 *
 * Flexbox-based layout for stacking elements with consistent gaps.
 */

import { forwardRef, type ReactNode } from 'react';
import clsx from 'clsx';

type GapValue = 0 | 1 | 2 | 3 | 4 | 6 | 8;
type AlignItems = 'start' | 'center' | 'end' | 'stretch';
type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackProps {
  children?: ReactNode;
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol' | 'nav';
  className?: string;

  // Direction
  direction?: 'column' | 'row';
  wrap?: boolean;

  // Gap
  gap?: GapValue;

  // Alignment
  align?: AlignItems;
  justify?: JustifyContent;

  // Full sizing
  fullWidth?: boolean;
  fullHeight?: boolean;
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      as = 'div',
      className,
      direction = 'column',
      wrap,
      gap,
      align,
      justify,
      fullWidth,
      fullHeight,
    },
    ref
  ) => {
    const classes = clsx(
      'flex',
      direction === 'column' ? 'flex-col' : 'flex-row',
      wrap && 'flex-wrap',
      gap !== undefined && `gap-${gap}`,
      align && `items-${align}`,
      justify && `justify-${justify}`,
      fullWidth && 'w-full',
      fullHeight && 'h-full',
      className
    );

    const Component = as;

    return (
      <Component ref={ref as any} className={classes}>
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';

export { Stack };
