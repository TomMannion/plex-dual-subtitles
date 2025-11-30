/**
 * Minus (−) — Thick horizontal line
 * Use for: Remove, Collapse, Less
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Minus = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M4 12H20"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="square"
    />
  </Icon>
));

Minus.displayName = 'Minus';
