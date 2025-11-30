/**
 * HalfDot (◐) — Half-filled circle
 * Use for: Partial status, in-progress indicators
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const HalfDot = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Outline square */}
    <rect x="8" y="8" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Left half filled */}
    <rect x="8" y="8" width="4" height="8" fill="currentColor" />
  </Icon>
));

HalfDot.displayName = 'HalfDot';
