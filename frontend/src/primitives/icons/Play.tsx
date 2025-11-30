/**
 * Play (▶) — Solid triangle
 * Use for: Play, Start, Go, Continue
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Play = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <polygon
      points="6,3 6,21 20,12"
      fill="currentColor"
    />
  </Icon>
));

Play.displayName = 'Play';
