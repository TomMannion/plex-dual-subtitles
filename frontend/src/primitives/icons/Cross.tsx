/**
 * Cross (✕) — Bold X
 * Use for: Close, Delete, Error, Cancel, No
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Cross = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="square"
    />
  </Icon>
));

Cross.displayName = 'Cross';
