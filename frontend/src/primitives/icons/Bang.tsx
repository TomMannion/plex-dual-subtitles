/**
 * Bang (!) — Warning triangle with exclamation
 * Use for: Warning, Alert, Important
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Bang = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Triangle */}
    <path
      d="M12 2L2 22H22L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="miter"
    />
    {/* Exclamation */}
    <path
      d="M12 9V14"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
    />
    <rect x="10.5" y="17" width="3" height="3" fill="currentColor" />
  </Icon>
));

Bang.displayName = 'Bang';
