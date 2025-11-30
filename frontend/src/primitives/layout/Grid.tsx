/**
 * Grid — 20-column brutalist grid container
 *
 * The primary layout container for the chaotic 20×20 grid system.
 * Use `gap` variant for spaced grids, default uses borders for separation.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: 'div' | 'section' | 'main' | 'article';

  // Grid variant
  variant?: 'brutal' | 'gap';

  // Container
  container?: boolean;
  containerSize?: 'sm' | 'lg' | 'full';
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      as: Component = 'div',
      className,
      variant = 'brutal',
      container,
      containerSize,
      ...props
    },
    ref
  ) => {
    const gridClass = {
      brutal: 'grid-brutal',
      gap: 'grid-brutal-gap',
    }[variant];

    const classes = clsx(
      gridClass,
      container && 'container',
      containerSize === 'sm' && 'container-sm',
      containerSize === 'lg' && 'container-lg',
      containerSize === 'full' && 'container-full',
      className
    );

    return (
      <Component ref={ref} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Grid.displayName = 'Grid';

export { Grid };
