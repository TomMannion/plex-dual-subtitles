/**
 * Plus (+) — Thick plus sign
 * Use for: Add, Create, New, Expand
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Plus = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M12 4V20M4 12H20"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="square"
    />
  </Icon>
));

Plus.displayName = 'Plus';
