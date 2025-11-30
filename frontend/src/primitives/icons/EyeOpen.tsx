/**
 * EyeOpen — Bold graphic open eye with lashes
 * Use for: Light mode toggle (awake/seeing)
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const EyeOpen = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Top lashes */}
    <rect x="4" y="4" width="2" height="4" fill="currentColor" />
    <rect x="8" y="2" width="2" height="5" fill="currentColor" />
    <rect x="11" y="1" width="2" height="5" fill="currentColor" />
    <rect x="14" y="2" width="2" height="5" fill="currentColor" />
    <rect x="18" y="4" width="2" height="4" fill="currentColor" />
    {/* Eye shape - almond/diamond */}
    <rect x="6" y="8" width="12" height="8" fill="currentColor" />
    <rect x="4" y="10" width="2" height="4" fill="currentColor" />
    <rect x="18" y="10" width="2" height="4" fill="currentColor" />
    {/* Pupil */}
    <rect x="10" y="10" width="4" height="4" fill="var(--bg-primary, #fff)" />
  </Icon>
));

EyeOpen.displayName = 'EyeOpen';
