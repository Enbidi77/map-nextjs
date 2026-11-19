'use client';

import * as React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { PlaceCard, Badge, Button } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { useTranslation } from '../../features/i18n';

export function SearchPanel() {
  const { t } = useTranslation();
  const searchQuery = useMapStore((state) => state.searchQuery);
  const selectedCategory = useMapStore((state) => state.selectedCategory);
  const setSelectedCategory = useMapStore((state) => state.setSelectedCategory);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const isPlaceSaved = useMapStore((state) => state.isPlaceSaved);
  const toggleSavePlace = useMapStore((state) => state.toggleSavePlace);
  const setSidebarView = useMapStore((state) => state.setSidebarView);
  const setDestination = useMapStore((state) => state.setDestination);
  const liveSearchResults = useMapStore((state) => state.liveSearchResults);
  const isSearching = useMapStore((state) => state.isSearching);

  const categories = [
    { id: 'all', label: t('search.all'), icon: '📍' },
    { id: 'attraction', label: t('search.attraction'), icon: '🏛️' },
    { id: 'nature', label: t('search.nature'), icon: '🌲' },
    { id: 'food_drink', label: t('search.foodDrink'), icon: '🍽️' },
    { id: 'entertainment', label: t('search.entertainment'), icon: '🎭' },
  ];

  return (
    <div className="flex flex-col gap-3 py-1 w-full min-w-0 max-w-full">
      {/* Category Pills Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {categories.map((cat) => {
          const isActive =
            (!selectedCategory && cat.id === 'all') || selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              suppressHydrationWarning
              onClick={() =>
                setSelectedCategory(cat.id === 'all' ? null : cat.id)
              }
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-0.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          <span>
            {searchQuery
              ? t('search.resultsFor', { query: searchQuery })
              : selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.label
              : t('search.popularHighlights')}
          </span>
        </span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {liveSearchResults.length === 1
            ? t('search.placeCountSingle')
            : t('search.placesCount', { count: liveSearchResults.length })}
        </Badge>
      </div>

      {/* Results List */}
      {liveSearchResults.length > 0 ? (
        <div className="flex flex-col gap-3">
          {liveSearchResults.map(({ place }) => (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlaceCard
                name={place.name}
                category={place.category.replace('_', ' ')}
                address={place.address}
                rating={place.rating}
                reviewsCount={place.reviewCount}
                imageUrl={place.photos?.[0]}
                isOpenNow={place.openingHours?.openNow}
                isSaved={isPlaceSaved(place.id)}
                onSaveClick={() => toggleSavePlace(place)}
                onDirectionsClick={() => {
                  setSelectedPlace(place);
                  setDestination(place.coordinates, place.name);
                  setSidebarView('directions');
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-sm text-foreground">{t('search.noResults')}</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">
            {t('search.noResultsDesc')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => {
              useMapStore.getState().setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}
