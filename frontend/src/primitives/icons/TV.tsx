/**
 * TV — Retro television shape
 * Use for: TV shows, series, episodes
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const TV = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* TV body/frame */}
    <rect x="2" y="4" width="20" height="14" fill="currentColor" />
    {/* Screen (cut out) */}
    <rect x="4" y="6" width="12" height="10" fill="var(--bg-primary, #fff)" />
    {/* Control panel / buttons on right */}
    <rect x="18" y="8" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="18" y="12" width="2" height="2" fill="var(--bg-primary, #fff)" />
    {/* Stand/feet */}
    <rect x="6" y="18" width="3" height="2" fill="currentColor" />
    <rect x="15" y="18" width="3" height="2" fill="currentColor" />
  </Icon>
));

TV.displayName = 'TV';
