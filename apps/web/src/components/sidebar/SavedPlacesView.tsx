'use client';

import * as React from 'react';
import {
  Bookmark,
  MapPin,
  Trash2,
  Navigation,
  Star,
  Plus,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogIn,
  Loader2,
} from 'lucide-react';
import { Button, CollectionCard, CollectionDialog } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import type { PlaceModel } from '@modern-maps/types';
import { useAuth } from '../../features/auth/useAuth';
import { createClient } from '../../lib/supabase/client';
import {
  getSavedPlaces,
  deleteSavedPlace,
  getCollections,
  createCollection as createCollectionSupabase,
  deleteCollection as deleteCollectionSupabase,
  type SavedPlace,
} from '@modern-maps/supabase';

function savedPlaceToPlaceModel(sp: SavedPlace): PlaceModel {
  const metadata = (sp.metadata as Record<string, unknown>) || {};
  return {
    id: sp.id,
    name: sp.name,
    address: sp.formattedAddress || sp.name,
    category: (sp.category as any) || 'landmark',
    coordinates: [sp.longitude, sp.latitude],
    rating: sp.rating ?? undefined,
    description: sp.notes || undefined,
    photos: Array.isArray(metadata.photos) ? (metadata.photos as string[]) : [],
    reviewCount: typeof metadata.reviewCount === 'number' ? metadata.reviewCount : undefined,
    metadata,
    createdAt: sp.createdAt,
    updatedAt: sp.updatedAt,
  };
}

export function SavedPlacesView() {
  const { user, openAuthModal } = useAuth();
  const [supabase] = React.useState(() => createClient());

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
  const [isSyncing, setIsSyncing] = React.useState(false);

  const syncWithSupabase = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      if (user) {
        // 1. Fetch saved places from Supabase for current user
        const dbPlaces = await getSavedPlaces(supabase, { userId: user.id });
        if (dbPlaces.length > 0) {
          useMapStore.setState({
            savedPlaces: dbPlaces.map(savedPlaceToPlaceModel),
          });
        }

        // 2. Fetch collections from Supabase for current user
        const dbCollections = await getCollections(supabase, { userId: user.id });
        if (dbCollections.length > 0) {
          useMapStore.setState({
            collections: dbCollections.map((col) => ({
              id: col.id,
              name: col.name,
              description: col.description || undefined,
              color: col.color || '#3b82f6',
              icon: col.icon || 'bookmark',
              placesCount: col.itemCount || 0,
              isPublic: col.isPublic,
              createdAt: col.createdAt,
              updatedAt: col.updatedAt,
            })),
          });
        }
      } else {
        // Unauthenticated mode: fetch public & seeded places from Supabase Postgres via API
        const [placesRes, colsRes] = await Promise.allSettled([
          fetch('/api/saved-places').then((r) => r.json()),
          fetch('/api/collections').then((r) => r.json()),
        ]);

        if (placesRes.status === 'fulfilled' && placesRes.value?.places?.length > 0) {
          useMapStore.setState({
            savedPlaces: placesRes.value.places.map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.formattedAddress || p.name,
              category: (p.category as any) || 'landmark',
              coordinates: [Number(p.longitude), Number(p.latitude)],
              description: p.notes || undefined,
              createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
            })),
          });
        }

        if (colsRes.status === 'fulfilled' && colsRes.value?.collections?.length > 0) {
          useMapStore.setState({
            collections: colsRes.value.collections.map((col: any) => ({
              id: col.id,
              name: col.name,
              description: col.description || undefined,
              color: col.color || '#3b82f6',
              icon: col.icon || 'bookmark',
              placesCount: col.itemCount || 0,
              isPublic: col.isPublic,
              createdAt: col.createdAt ? new Date(col.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: col.updatedAt ? new Date(col.updatedAt).toISOString() : new Date().toISOString(),
            })),
          });
        }
      }
    } catch (err: unknown) {
      console.warn('Could not sync with Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [supabase, user]);

  React.useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

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

  const handleRemove = async (e: React.MouseEvent, place: PlaceModel) => {
    e.stopPropagation();
    toggleSavePlace(place);

    if (user) {
      try {
        await deleteSavedPlace(supabase, place.id);
      } catch (err) {
        console.warn('Failed to delete saved place from Supabase:', err);
      }
    }
  };

  const handleCreateCollection = async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => {
    createCollection(data);

    if (user) {
      try {
        await createCollectionSupabase(supabase, {
          userId: user.id,
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
        });
      } catch (err) {
        console.warn('Failed to save collection to Supabase:', err);
      }
    }
  };

  const handleDeleteCollection = async (id: string) => {
    deleteCollection(id);

    if (user) {
      try {
        await deleteCollectionSupabase(supabase, id);
      } catch (err) {
        console.warn('Failed to delete collection from Supabase:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 py-1 w-full min-w-0 max-w-full">
      {/* Cloud Sync Status / Sign In Banner */}
      {user ? (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[11px] font-medium text-foreground">
              Synced with Supabase Cloud
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={syncWithSupabase}
            disabled={isSyncing}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Sync with cloud"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              Sign in to sync saved places across devices.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAuthModal('signin')}
            className="h-6 gap-1 px-2 text-[11px] font-medium"
          >
            <LogIn className="h-3 w-3" />
            <span>Sign In</span>
          </Button>
        </div>
      )}

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
                onDelete={(id) => handleDeleteCollection(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Collection Dialog */}
      <CollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleCreateCollection}
      />
    </div>
  );
}
