/**
 * Layers — Stacked horizontal bars with offset
 * Use for: Subtitle tracks, stacked items, multiple sources
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Layers = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Three stacked bars with slight offset to show depth */}
    <rect x="6" y="5" width="14" height="3" fill="currentColor" />
    <rect x="4" y="10" width="14" height="3" fill="currentColor" />
    <rect x="6" y="15" width="14" height="3" fill="currentColor" />
  </Icon>
));

Layers.displayName = 'Layers';
