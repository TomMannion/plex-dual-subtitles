/**
 * Divider — Brutal horizontal/vertical line
 *
 * Hard-edged separation. No subtlety.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'base' | 'thick' | 'brutal';
  color?: 'primary' | 'secondary';
  spacing?: 0 | 1 | 2 | 3 | 4 | 6 | 8;
}

const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      className,
      orientation = 'horizontal',
      thickness = 'base',
      color = 'primary',
      spacing,
      ...props
    },
    ref
  ) => {
    const isHorizontal = orientation === 'horizontal';

    const thicknessStyles = {
      thin: isHorizontal ? 'border-t' : 'border-l',
      base: isHorizontal
        ? 'border-t-2'
        : 'border-l-2',
      thick: isHorizontal
        ? 'border-t-[3px]'
        : 'border-l-[3px]',
      brutal: isHorizontal
        ? 'border-t-4'
        : 'border-l-4',
    };

    const colorStyles = {
      primary: 'border-[var(--border-primary)]',
      secondary: 'border-[var(--border-secondary)]',
    };

    const classes = clsx(
      'border-0',
      thicknessStyles[thickness],
      colorStyles[color],
      isHorizontal ? 'w-full' : 'h-full',
      spacing !== undefined && (isHorizontal ? `my-${spacing}` : `mx-${spacing}`),
      className
    );

    return <hr ref={ref} className={classes} {...props} />;
  }
);

Divider.displayName = 'Divider';

export { Divider };
