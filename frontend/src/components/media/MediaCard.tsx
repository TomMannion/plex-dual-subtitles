/**
 * MediaCard — Show/Movie/Episode card component
 *
 * BRUTALIST DESIGN: Full-bleed image with overlay text.
 * No separate content box - everything overlays the poster.
 * Hard shadows, thick borders, aggressive hover states.
 *
 * Used inside MediaGrid which handles sizing via CSS grid.
 */

import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { fixPlexImageUrl } from '../../utils/imageUtils';

export type MediaType = 'show' | 'movie' | 'episode';

export interface MediaCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  type: MediaType;
  href: string;
  badge?: string;
  metadata?: ReactNode;
  className?: string;
}

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"%3E%3Crect fill="%230A0A0A" width="200" height="300"/%3E%3Ctext fill="%23404040" font-family="monospace" font-size="14" x="50%25" y="50%25" text-anchor="middle"%3ENO IMAGE%3C/text%3E%3C/svg%3E';

export function MediaCard({
  title,
  subtitle,
  imageUrl,
  href,
  badge,
  metadata,
  className,
}: MediaCardProps) {
  return (
    <Link
      to={href}
      className={clsx('media-card-brutal', className)}
    >
      {/* Full-bleed image */}
      <div className="media-card-brutal-image">
        <img
          src={imageUrl ? (fixPlexImageUrl(imageUrl) ?? placeholderImage) : placeholderImage}
          alt={title}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />

        {/* Gradient overlay for text readability */}
        <div className="media-card-brutal-gradient" />
      </div>

      {/* Badge - top left corner */}
      {badge && (
        <span className="media-card-brutal-badge">
          {badge}
        </span>
      )}

      {/* Content overlay - bottom of card */}
      <div className="media-card-brutal-content">
        <span className="media-card-brutal-title">
          {title}
        </span>
        {subtitle && (
          <span className="media-card-brutal-subtitle">
            {subtitle}
          </span>
        )}
        {metadata}
      </div>

      {/* Hover border effect */}
      <div className="media-card-brutal-border" />
    </Link>
  );
}
