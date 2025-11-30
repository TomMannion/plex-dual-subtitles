/**
 * MediaListItem — Compact horizontal list item for movies/shows
 *
 * BRUTALIST DESIGN: Single-line horizontal layout with small thumbnail.
 * Thick borders between rows, grayscale images, red accent on hover.
 * Designed for quick scanning of large lists.
 */

import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { fixPlexImageUrl } from '../../utils/imageUtils';

export interface MediaListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  year?: number;
  metadata?: string;
  className?: string;
}

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 72"%3E%3Crect fill="%230A0A0A" width="48" height="72"/%3E%3Ctext fill="%23404040" font-family="monospace" font-size="8" x="50%25" y="50%25" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E';

export function MediaListItem({
  title,
  subtitle,
  imageUrl,
  href,
  year,
  metadata,
  className,
}: MediaListItemProps) {
  return (
    <Link
      to={href}
      className={clsx('list-item-brutal', className)}
    >
      {/* Thumbnail */}
      <div className="list-item-brutal-thumb">
        <img
          src={imageUrl ? (fixPlexImageUrl(imageUrl) ?? placeholderImage) : placeholderImage}
          alt=""
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </div>

      {/* Title */}
      <span className="list-item-brutal-title">{title}</span>

      {/* Subtitle (e.g., season/episode count) */}
      {subtitle && (
        <span className="list-item-brutal-subtitle">{subtitle}</span>
      )}

      {/* Year */}
      {year && (
        <span className="list-item-brutal-year">{year}</span>
      )}

      {/* Additional metadata */}
      {metadata && (
        <span className="list-item-brutal-meta">{metadata}</span>
      )}

      {/* Hover accent bar */}
      <div className="list-item-brutal-accent" aria-hidden="true" />
    </Link>
  );
}
