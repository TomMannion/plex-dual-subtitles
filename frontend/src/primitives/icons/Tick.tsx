/**
 * Tick (✓) — Heavy checkmark
 * Use for: Success, Confirm, Yes, Done
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Tick = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M4 12L10 18L20 6"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Icon>
));

Tick.displayName = 'Tick';
