/**
 * Icon — Base wrapper for brutalist SVG icons
 *
 * Provides consistent sizing, color, and rotation.
 */

import { forwardRef, type SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  rotate?: 0 | 90 | 180 | 270;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon = forwardRef<SVGSVGElement, IconProps & { children: React.ReactNode }>(
  ({ size = 'md', rotate = 0, children, style, ...props }, ref) => {
    const dimension = typeof size === 'number' ? size : sizeMap[size];

    return (
      <svg
        ref={ref}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
          flexShrink: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';
