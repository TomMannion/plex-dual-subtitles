/**
 * Arrow (→) — Chunky directional arrow
 * Use for: Navigate, Next, Action direction
 * Use rotate prop: 0=right, 90=down, 180=left, 270=up
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Arrow = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M4 12H18M12 6L18 12L12 18"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Icon>
));

Arrow.displayName = 'Arrow';
