import * as React from 'react';
import { Star, Navigation, Bookmark, Share2, MapPin, Phone, Globe, Clock, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from '../button.js';
import { Badge } from '../badge.js';

export interface PlaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
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

export const PlaceCard = React.forwardRef<HTMLDivElement, PlaceCardProps>(
  (
    {
      className,
      name,
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
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-lg transition-all',
          className
        )}
        {...props}
      >
        {/* Close button if present */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-md hover:bg-background hover:text-foreground shadow-sm transition-colors"
            aria-label="Close place details"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Image banner if present */}
        {imageUrl && (
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content details */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight text-foreground">{name}</h3>
              {category && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                    {category}
                  </Badge>
                </div>
              )}
            </div>
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

          {/* Address */}
          {address && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span className="leading-tight">{address}</span>
            </div>
          )}

          {/* Hours / Phone / Web */}
          {(openingHours || phone || website) && (
            <div className="flex flex-col gap-1 border-t border-border/50 pt-2 mt-1 text-xs text-muted-foreground">
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 border-t border-border/50 pt-3 mt-1">
            {onDirectionsClick && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={onDirectionsClick}
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Directions</span>
              </Button>
            )}
            {onSaveClick && (
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={onSaveClick}
              >
                <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-current text-primary')} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            )}
            {onShareClick && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onShareClick}
                aria-label="Share place"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
PlaceCard.displayName = 'PlaceCard';
