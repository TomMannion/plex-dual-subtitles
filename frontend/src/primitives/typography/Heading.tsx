/**
 * Heading — Architectural heading primitive
 *
 * Space Grotesk headings. Bold. Tight tracking.
 * NO ITALICS. This is brutalism.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent';
type HeadingAlign = 'left' | 'center' | 'right';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  level?: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  display?: boolean; // Extra large display variant
  color?: HeadingColor;
  align?: HeadingAlign;
  truncate?: boolean;
}

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      children,
      level = 2,
      as,
      className,
      display,
      color,
      align,
      truncate,
      ...props
    },
    ref
  ) => {
    const Component = as || (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');

    const classes = clsx(
      display && 'text-display',
      !display && `text-h${level}`,
      color && `text-${color}`,
      align && `text-${align}`,
      truncate && 'truncate',
      className
    );

    return (
      <Component ref={ref as any} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';

export { Heading };
