/**
 * EyeClosed — Bold graphic closed eye
 * Use for: Dark mode toggle (asleep/blind)
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const EyeClosed = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Closed eyelid - horizontal line */}
    <rect x="4" y="10" width="16" height="3" fill="currentColor" />
    {/* Bottom lashes */}
    <rect x="4" y="13" width="2" height="4" fill="currentColor" />
    <rect x="8" y="13" width="2" height="5" fill="currentColor" />
    <rect x="11" y="13" width="2" height="6" fill="currentColor" />
    <rect x="14" y="13" width="2" height="5" fill="currentColor" />
    <rect x="18" y="13" width="2" height="4" fill="currentColor" />
  </Icon>
));

EyeClosed.displayName = 'EyeClosed';
