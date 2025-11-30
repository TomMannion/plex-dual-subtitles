/**
 * Film — Film reel / movie strip
 * Use for: Movies, films, cinema
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const Film = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Film strip body */}
    <rect x="4" y="3" width="16" height="18" fill="currentColor" />
    {/* Sprocket holes - left side */}
    <rect x="5" y="5" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="5" y="9" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="5" y="13" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="5" y="17" width="2" height="2" fill="var(--bg-primary, #fff)" />
    {/* Sprocket holes - right side */}
    <rect x="17" y="5" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="17" y="9" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="17" y="13" width="2" height="2" fill="var(--bg-primary, #fff)" />
    <rect x="17" y="17" width="2" height="2" fill="var(--bg-primary, #fff)" />
    {/* Frame window */}
    <rect x="9" y="7" width="6" height="10" fill="var(--bg-primary, #fff)" />
  </Icon>
));

Film.displayName = 'Film';
