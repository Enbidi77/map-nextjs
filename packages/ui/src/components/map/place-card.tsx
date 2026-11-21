import * as React from 'react';
import { Star, Navigation, Bookmark, Share2, MapPin, Phone, Globe, Clock, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from '../button.js';
import { Badge } from '../badge.js';

export interface PlaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  subtitle?: string;
  category?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
  isOpenNow?: boolean;
  openingHours?: string;
  phone?: string;
  website?: string;
  onDirectionsClick?: () => void;
  onSaveClick?: () => void;
  onShareClick?: () => void;
  onClose?: () => void;
  isSaved?: boolean;
}

/**
 * Deduplicates location hierarchy text and avoids repeating the place name.
 * e.g., If name is "Việt Nam" and subtitle/address is "Việt Nam", returns null.
 * If subtitle is "Quảng Ninh, Việt Nam", returns "Quảng Ninh, Việt Nam".
 */
function cleanLocationHierarchy(name: string, rawText?: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const normalizedName = name.trim().toLowerCase();
  if (trimmed.toLowerCase() === normalizedName) {
    return null;
  }

  // Split by comma and deduplicate unique segments
  const segments = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const uniqueSegments: string[] = [];
  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    if (segLower === normalizedName) {
      continue;
    }
    if (!uniqueSegments.some((s) => s.toLowerCase() === segLower)) {
      uniqueSegments.push(seg);
    }
  }

  if (uniqueSegments.length === 0) {
    return null;
  }

  return uniqueSegments.join(', ');
}

export const PlaceCard = React.forwardRef<HTMLDivElement, PlaceCardProps>(
  (
    {
      className,
      name,
      subtitle,
      category,
      address,
      rating,
      reviewsCount,
      imageUrl,
      isOpenNow,
      openingHours,
      phone,
      website,
      onDirectionsClick,
      onSaveClick,
      onShareClick,
      onClose,
      isSaved = false,
      ...props
    },
    ref
  ) => {
    const cleanSubtitle = cleanLocationHierarchy(name, subtitle);
    const cleanAddress = cleanLocationHierarchy(name, address);

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-md transition-all',
          className
        )}
        {...props}
      >
        {/* Floating Bookmark Button on Top-Right Corner */}
        {onSaveClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSaveClick();
            }}
            className={cn(
              'absolute z-10 flex h-7 w-7 items-center justify-center bg-background/80 dark:bg-black/60 backdrop-blur-md rounded-full shadow-sm hover:scale-105 transition-all text-foreground/80 hover:text-foreground',
              onClose ? 'right-10 top-2' : 'right-2 top-2'
            )}
            aria-label={isSaved ? 'Saved' : 'Save'}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <Bookmark
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                isSaved ? 'fill-primary text-primary' : 'hover:text-primary'
              )}
            />
          </button>
        )}

        {/* Close Button if present */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 dark:bg-black/60 text-muted-foreground backdrop-blur-md hover:bg-background hover:text-foreground shadow-sm transition-colors"
            aria-label="Close place details"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Compact Cover Photo (16:9 / 2:1 density ~h-24 to h-28 max) */}
        {imageUrl && (
          <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-muted shrink-0">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        {/* Content details with slim padding */}
        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight text-foreground truncate">{name}</h3>
              {cleanSubtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{cleanSubtitle}</p>
              )}
            </div>
            {category && (
              <Badge variant="secondary" className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5">
                {category}
              </Badge>
            )}
          </div>

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center text-amber-500 font-semibold gap-0.5">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
              {reviewsCount !== undefined && (
                <span>({reviewsCount.toLocaleString()})</span>
              )}
              {isOpenNow !== undefined && (
                <>
                  <span>•</span>
                  <span className={isOpenNow ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-destructive font-medium'}>
                    {isOpenNow ? 'Open' : 'Closed'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Address if unique and not already rendered as subtitle */}
          {cleanAddress && cleanAddress !== cleanSubtitle && (
            <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span className="leading-tight line-clamp-1">{cleanAddress}</span>
            </div>
          )}

          {/* Hours / Phone / Web */}
          {(openingHours || phone || website) && (
            <div className="flex flex-col gap-1 border-t border-border/50 pt-1.5 mt-0.5 text-xs text-muted-foreground">
              {openingHours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{openingHours}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-primary transition-colors">
                    {phone}
                  </a>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 shrink-0" />
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate hover:text-primary transition-colors"
                  >
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Slim Action buttons */}
          {(onDirectionsClick || onShareClick) && (
            <div className="flex items-center gap-1.5 border-t border-border/50 pt-2 mt-0.5">
              {onDirectionsClick && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-7 text-xs px-2.5 gap-1.5"
                  onClick={onDirectionsClick}
                >
                  <Navigation className="h-3 w-3" />
                  <span>Directions</span>
                </Button>
              )}
              {onShareClick && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-7 w-7 shrink-0"
                  onClick={onShareClick}
                  aria-label="Share place"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
PlaceCard.displayName = 'PlaceCard';
