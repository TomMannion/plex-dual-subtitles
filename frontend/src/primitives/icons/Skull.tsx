/**
 * Skull (☠) — Danger symbol
 * Use for: Danger, Fatal error, Delete confirm
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Skull = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Skull - blocky brutalist style, rounder head */}
    {/* Top of skull - stepped for roundness */}
    <rect x="8" y="1" width="8" height="2" fill="currentColor" />
    <rect x="5" y="3" width="14" height="2" fill="currentColor" />
    <rect x="3" y="5" width="18" height="3" fill="currentColor" />
    {/* Eyes row - left side, nose bridge, right side */}
    <rect x="3" y="8" width="4" height="4" fill="currentColor" />
    <rect x="11" y="8" width="2" height="4" fill="currentColor" />
    <rect x="17" y="8" width="4" height="4" fill="currentColor" />
    {/* Cheeks/sides */}
    <rect x="4" y="12" width="16" height="1" fill="currentColor" />
    {/* Nose row with small square hole */}
    <rect x="4" y="13" width="7" height="2" fill="currentColor" />
    <rect x="13" y="13" width="7" height="2" fill="currentColor" />
    {/* Jaw */}
    <rect x="7" y="15" width="10" height="1" fill="currentColor" />
    {/* Teeth row - 3 teeth with gaps */}
    <rect x="8" y="16" width="2" height="4" fill="currentColor" />
    <rect x="11" y="16" width="2" height="4" fill="currentColor" />
    <rect x="14" y="16" width="2" height="4" fill="currentColor" />
  </Icon>
));

Skull.displayName = 'Skull';
