/**
 * Box — Base layout primitive
 *
 * The foundational container for the 20×20 grid system.
 * All grid positioning flows through this component.
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 'full';
type GridStart = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
type GridEnd = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 'full';
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 6 | 8;

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside' | 'main' | 'header' | 'footer' | 'nav';

  // Grid placement
  colSpan?: GridSpan;
  colStart?: GridStart;
  colEnd?: GridEnd;
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowStart?: 1 | 2 | 3 | 4;

  // Spacing
  p?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;
  pt?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;
  pr?: SpacingValue;
  m?: SpacingValue;
  mx?: SpacingValue | 'auto';
  my?: SpacingValue;
  mt?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;
  mr?: SpacingValue;

  // Display
  display?: 'block' | 'inline-block' | 'flex' | 'inline' | 'none';
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';

  // Backgrounds
  bg?: 'primary' | 'secondary' | 'elevated' | 'inverse' | 'accent' | 'success';

  // Borders
  border?: boolean;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;

  // Overflow
  overflow?: 'hidden' | 'auto' | 'scroll';

  // Sizing
  fullWidth?: boolean;
  fullHeight?: boolean;
  minHeight?: 'screen';
}

const Box = forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      children,
      as: Component = 'div',
      className,

      // Grid
      colSpan,
      colStart,
      colEnd,
      rowSpan,
      rowStart,

      // Padding
      p,
      px,
      py,
      pt,
      pb,
      pl,
      pr,

      // Margin
      m,
      mx,
      my,
      mt,
      mb,
      ml,
      mr,

      // Display
      display,
      position,

      // Background
      bg,

      // Borders
      border,
      borderTop,
      borderBottom,
      borderLeft,
      borderRight,

      // Overflow
      overflow,

      // Sizing
      fullWidth,
      fullHeight,
      minHeight,

      ...props
    },
    ref
  ) => {
    const classes = clsx(
      // Grid span
      colSpan && (colSpan === 'full' ? 'col-span-full' : `col-span-${colSpan}`),
      colStart && `col-start-${colStart}`,
      colEnd && (colEnd === 'full' ? 'col-end-full' : `col-end-${colEnd}`),
      rowSpan && `row-span-${rowSpan}`,
      rowStart && `row-start-${rowStart}`,

      // Padding
      p !== undefined && `p-${p}`,
      px !== undefined && `px-${px}`,
      py !== undefined && `py-${py}`,
      pt !== undefined && `pt-${pt}`,
      pb !== undefined && `pb-${pb}`,
      pl !== undefined && `pl-${pl}`,
      pr !== undefined && `pr-${pr}`,

      // Margin
      m !== undefined && `m-${m}`,
      mx === 'auto' ? 'mx-auto' : mx !== undefined && `mx-${mx}`,
      my !== undefined && `my-${my}`,
      mt !== undefined && `mt-${mt}`,
      mb !== undefined && `mb-${mb}`,
      ml !== undefined && `ml-${ml}`,
      mr !== undefined && `mr-${mr}`,

      // Display
      display,
      position,

      // Background
      bg && `bg-${bg}`,

      // Borders
      border && 'border',
      borderTop && 'border-t',
      borderBottom && 'border-b',
      borderLeft && 'border-l',
      borderRight && 'border-r',

      // Overflow
      overflow && `overflow-${overflow}`,

      // Sizing
      fullWidth && 'w-full',
      fullHeight && 'h-full',
      minHeight === 'screen' && 'min-h-screen',

      className
    );

    return (
      <Component ref={ref} className={classes || undefined} {...props}>
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';

export { Box };
