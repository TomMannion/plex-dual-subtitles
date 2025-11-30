/**
 * Grid (▦) — 2×2 squares
 * Use for: Grid view, Layout
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const GridIcon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <rect x="3" y="3" width="8" height="8" fill="currentColor" />
    <rect x="13" y="3" width="8" height="8" fill="currentColor" />
    <rect x="3" y="13" width="8" height="8" fill="currentColor" />
    <rect x="13" y="13" width="8" height="8" fill="currentColor" />
  </Icon>
));

GridIcon.displayName = 'GridIcon';
