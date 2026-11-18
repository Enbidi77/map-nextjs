'use client';

import * as React from 'react';
import { Bookmark, MapPin, Trash2, Navigation, Star, Plus } from 'lucide-react';
import { Button, CollectionCard, CollectionDialog } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import type { PlaceModel } from '@modern-maps/types';

export function SavedPlacesView() {
  const savedPlaces = useMapStore((state) => state.savedPlaces);
  const toggleSavePlace = useMapStore((state) => state.toggleSavePlace);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const setDestination = useMapStore((state) => state.setDestination);
  const setCamera = useMapStore((state) => state.setCamera);
  const collections = useMapStore((state) => state.collections);
  const createCollection = useMapStore((state) => state.createCollection);
  const deleteCollection = useMapStore((state) => state.deleteCollection);

  const [activeTab, setActiveTab] = React.useState<'places' | 'collections'>('places');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleSelectPlace = (place: PlaceModel) => {
    setSelectedPlace(place);
    setCamera({
      center: place.coordinates,
      zoom: 15,
    });
  };

  const handleDirections = (e: React.MouseEvent, place: PlaceModel) => {
    e.stopPropagation();
    setDestination(place.coordinates, place.name);
    setSidebarView('directions');
  };

  const handleRemove = (e: React.MouseEvent, place: PlaceModel) => {
    e.stopPropagation();
    toggleSavePlace(place);
  };

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Sub-tabs: Saved Pins vs Collections */}
      <div className="flex rounded-lg border border-border/50 bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${
            activeTab === 'places'
              ? 'bg-background text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Saved Places ({savedPlaces.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${
            activeTab === 'collections'
              ? 'bg-background text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Collections ({collections.length})
        </button>
      </div>

      {activeTab === 'places' ? (
        /* Places List */
        savedPlaces.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {savedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                {/* Thumbnail */}
                {place.photos?.[0] ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={place.photos[0]}
                      alt={place.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MapPin className="h-6 w-6" />
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <h4 className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                    {place.name}
                  </h4>

                  <p className="truncate text-[11px] text-muted-foreground">
                    {place.address}
                  </p>

                  {place.rating && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{place.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground font-normal">
                        ({place.reviewCount?.toLocaleString()})
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-1 flex items-center gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-6 w-6 text-primary hover:bg-primary/10"
                      onClick={(e) => handleDirections(e, place)}
                      title="Directions"
                      aria-label="Directions"
                    >
                      <Navigation className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleRemove(e, place)}
                      title="Remove from saved"
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Bookmark className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-sm text-foreground">No saved places yet</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">
              Bookmark interesting landmarks, restaurants, and attractions to access them quickly here.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => setSidebarView('search')}
            >
              Explore Places
            </Button>
          </div>
        )
      ) : (
        /* Collections Tab */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Custom Lists
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New List</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {collections.map((col) => (
              <CollectionCard
                key={col.id}
                id={col.id}
                name={col.name}
                description={col.description}
                color={col.color}
                icon={col.icon}
                placesCount={col.placesCount}
                onDelete={(id) => deleteCollection(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Collection Dialog */}
      <CollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={(data) => createCollection(data)}
      />
    </div>
  );
}
