/**
 * File — Simple document with corner fold
 * Use for: File displays, documents, media files
 */

import { forwardRef } from 'react';
import { Icon, type IconProps } from './Icon';

export const File = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    {/* Document body */}
    <rect x="5" y="2" width="14" height="20" fill="currentColor" />
    {/* Corner fold (cut out) */}
    <rect x="14" y="2" width="5" height="5" fill="var(--bg-primary, #fff)" />
    {/* Fold triangle */}
    <rect x="14" y="2" width="2" height="5" fill="currentColor" />
    <rect x="14" y="5" width="5" height="2" fill="currentColor" />
  </Icon>
));

File.displayName = 'File';
