/**
 * Target (⌖) — Crosshairs
 * Use for: Search, Find, Focus
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Target = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Crosshairs */}
    <path
      d="M12 2V8M12 16V22M2 12H8M16 12H22"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
    />
    {/* Center dot */}
    <rect x="10" y="10" width="4" height="4" fill="currentColor" />
  </Icon>
));

Target.displayName = 'Target';
