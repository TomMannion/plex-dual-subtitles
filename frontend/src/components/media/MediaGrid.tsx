/**
 * MediaGrid — Masonry grid with varied panel sizes
 *
 * Uses CSS Grid with column spanning for true varying-width layouts.
 * Each panel gets a random size that determines both its column span
 * and row span, creating a dynamic panel aesthetic.
 *
 * Responsive: column count and sizes adapt to screen width.
 */

import { Children, type ReactNode, useMemo } from 'react';
import clsx from 'clsx';

export interface MediaGridProps {
  children: ReactNode;
  className?: string;
  chaos?: boolean;
}

// Panel size definitions: col = column span, row = row span
// These determine how many grid cells the panel occupies
const PANEL_SIZES = {
  small:    { col: 1, row: 2 },    // Single column, 2 rows
  medium:   { col: 1, row: 3 },    // Single column, 3 rows (standard poster)
  large:    { col: 1, row: 4 },    // Single column, 4 rows (tall)
  wide:     { col: 2, row: 2 },    // 2 columns, 2 rows (landscape)
  hero:     { col: 2, row: 3 },    // 2 columns, 3 rows (featured)
  feature:  { col: 2, row: 4 },    // 2 columns, 4 rows (big feature)
} as const;

type SizeKey = keyof typeof PANEL_SIZES;

// Weighted distribution: mostly standard sizes with occasional wide/hero
const SIZE_WEIGHTS: SizeKey[] = [
  'small', 'small',
  'medium', 'medium', 'medium', 'medium', 'medium',
  'large', 'large',
  'wide', 'wide',
  'hero',
  'feature',
];

// Seeded random for consistent layouts across renders
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function assignSizes(itemCount: number): SizeKey[] {
  const random = seededRandom(itemCount * 7919);
  return Array.from({ length: itemCount }, () => {
    const index = Math.floor(random() * SIZE_WEIGHTS.length);
    return SIZE_WEIGHTS[index];
  });
}

export function MediaGrid({ children, className, chaos }: MediaGridProps) {
  const childArray = Children.toArray(children);

  const sizes = useMemo(
    () => chaos ? assignSizes(childArray.length) : [],
    [chaos, childArray.length]
  );

  if (!chaos) {
    return (
      <div className={clsx('media-grid-regular', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={clsx('masonry-grid', className)}>
      {childArray.map((child, index) => {
        const size = sizes[index] || 'medium';
        const { col, row } = PANEL_SIZES[size];

        return (
          <div
            key={index}
            className={clsx('masonry-panel', `masonry-panel-${size}`)}
            style={{
              gridColumn: `span ${col}`,
              gridRow: `span ${row}`,
            }}
          >
            <div className="masonry-panel-inner">
              {child}
            </div>
          </div>
        );
      })}
    </div>
  );
}
