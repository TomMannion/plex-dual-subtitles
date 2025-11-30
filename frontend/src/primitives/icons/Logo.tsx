/**
 * Logo — PLEX DUALSUB brand icon
 *
 * Brutalist dual subtitle mark: Two offset text bars with
 * diagonal slash and accent markers. Aggressive. Unapologetic.
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Logo = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Top subtitle bar - offset right */}
    <rect x="6" y="6" width="14" height="4" fill="currentColor" />
    {/* Bottom subtitle bar - offset left */}
    <rect x="4" y="14" width="14" height="4" fill="currentColor" />

    {/* Diagonal slash - aggressive cut through */}
    <rect
      x="11"
      y="2"
      width="3"
      height="20"
      fill="currentColor"
      transform="rotate(15 12 12)"
    />

    {/* Language marker dots */}
    <rect x="2" y="7" width="2" height="2" fill="currentColor" />
    <rect x="20" y="15" width="2" height="2" fill="currentColor" />
  </Icon>
));

Logo.displayName = 'Logo';
