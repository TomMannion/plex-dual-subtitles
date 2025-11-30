/**
 * Stop (■) — Solid square
 * Use for: Stop, Pause, End
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Stop = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <rect x="4" y="4" width="16" height="16" fill="currentColor" />
  </Icon>
));

Stop.displayName = 'Stop';
