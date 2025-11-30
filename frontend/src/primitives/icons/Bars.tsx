/**
 * Bars (☰) — Three horizontal lines
 * Use for: Menu, List view, Options
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Bars = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <path
      d="M3 6H21M3 12H21M3 18H21"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
    />
  </Icon>
));

Bars.displayName = 'Bars';
