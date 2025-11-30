/**
 * Dot (●) — Filled circle/bullet
 * Use for: Bullet points, separators, status indicators
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Dot = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <rect x="8" y="8" width="8" height="8" fill="currentColor" />
  </Icon>
));

Dot.displayName = 'Dot';
