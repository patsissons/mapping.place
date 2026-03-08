"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ListFilter,
  MapPinned,
  Plus,
  SquareStack,
  type LucideIcon,
} from "lucide-react";

import { MapCanvas } from "@/components/map-builder/map-canvas";
import { MapHeader } from "@/components/map-builder/map-header";
import { PlaceFilters } from "@/components/map-builder/place-filters";
import { PlaceForm } from "@/components/map-builder/place-form";
import { PlaceList } from "@/components/map-builder/place-list";
import { SavedMapsPanel } from "@/components/map-builder/saved-maps-panel";
import { SummaryStrip } from "@/components/map-builder/summary-strip";
import { Button } from "@/components/ui/button";
import { createBlankPlaceDraft, createStarterPlaces } from "@/lib/place-data";
import { getPlaceStatus } from "@/lib/place-status";
import { loadSavedMaps, upsertSavedMap, writeSavedMaps } from "@/lib/storage";
import {
  type OpeningHours,
  type PinMode,
  type Place,
  type PlaceDraft,
  type SavedMap,
  type SortOption,
} from "@/lib/types";
import { readMapStateFromUrl, writeMapStateToUrl } from "@/lib/url-state";
import { createId, getDateInputValue, parseNumber } from "@/lib/utils";

const DEFAULT_MAP_NAME = "Weekend shortlist";

type SidebarTab = "places" | "filters" | "add" | "saved";

const sidebarTabs: {
  id: SidebarTab;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    id: "places",
    label: "Places",
    icon: MapPinned,
  },
  {
    id: "filters",
    label: "Filters",
    icon: ListFilter,
  },
  {
    id: "add",
    label: "Add place",
    icon: Plus,
  },
  {
    id: "saved",
    label: "Saved maps",
    icon: SquareStack,
  },
];

function createNewScratchMapName(savedMaps: SavedMap[]) {
  const baseName = "Untitled map";

  if (!savedMaps.some((savedMap) => savedMap.name === baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (
    savedMaps.some((savedMap) => savedMap.name === `${baseName} ${suffix}`)
  ) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
}

function getEffectiveMapName(value: string) {
  return value.trim() || DEFAULT_MAP_NAME;
}

export function MapBuilderPage() {
  const [mapName, setMapName] = useState(DEFAULT_MAP_NAME);
  const [places, setPlaces] = useState<Place[]>(createStarterPlaces());
  const [draft, setDraft] = useState<PlaceDraft>(createBlankPlaceDraft());
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    getDateInputValue(new Date()),
  );
  const [filterText, setFilterText] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("rating:desc");
  const [pinMode, setPinMode] = useState<PinMode>("rating");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<SidebarTab>("places");
  const [permalink, setPermalink] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const initializedRef = useRef(false);
  const previousMapNameRef = useRef(DEFAULT_MAP_NAME);
  const deferredFilterText = useDeferredValue(filterText);

  useEffect(() => {
    const storedMaps = loadSavedMaps();
    const urlMap = readMapStateFromUrl(
      new URLSearchParams(window.location.search),
    );
    const initialMap = urlMap
      ? {
          name: urlMap.mapName,
          places: urlMap.places,
        }
      : (storedMaps[0] ?? {
          name: DEFAULT_MAP_NAME,
          places: createStarterPlaces(),
        });

    setSavedMaps(storedMaps);
    setMapName(initialMap.name);
    setPlaces(initialMap.places);
    setSelectedPlaceId(initialMap.places[0]?.id ?? null);
    setPermalink(window.location.href);
    previousMapNameRef.current = initialMap.name;
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current || !mapName.trim()) {
      return;
    }

    const effectiveMapName = getEffectiveMapName(mapName);
    const nextUrl = writeMapStateToUrl(effectiveMapName, places);
    const updatedAt = new Date().toISOString();

    setPermalink(nextUrl);
    setSavedMaps((currentSavedMaps) => {
      const previousMapName = previousMapNameRef.current;
      const withoutPrevious =
        previousMapName !== effectiveMapName
          ? currentSavedMaps.filter(
              (savedMap) => savedMap.name !== previousMapName,
            )
          : currentSavedMaps;
      const nextSavedMaps = upsertSavedMap(withoutPrevious, {
        name: effectiveMapName,
        places,
        updatedAt,
        source: {
          kind: "scratch",
        },
      });

      previousMapNameRef.current = effectiveMapName;
      writeSavedMaps(nextSavedMaps);

      return nextSavedMaps;
    });
  }, [mapName, places]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 1800);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  function handleMapNameBlur() {
    if (!mapName.trim()) {
      setMapName(DEFAULT_MAP_NAME);
    }
  }

  function handleHoursChange(hours: OpeningHours) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      hours,
    }));
  }

  function handleAddPlace() {
    const nextPlace: Place = {
      id: createId("place"),
      name: draft.name.trim(),
      placeId: draft.placeId.trim() || undefined,
      address: draft.address.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      lat: parseNumber(draft.lat),
      lng: parseNumber(draft.lng),
      rating: parseNumber(draft.rating, 4),
      reviewCount: parseNumber(draft.reviewCount, 0),
      hours: draft.hours,
    };

    setPlaces((currentPlaces) => [...currentPlaces, nextPlace]);
    setSelectedPlaceId(nextPlace.id);
    setDraft(createBlankPlaceDraft());
  }

  function handleRemovePlace(placeId: string) {
    setPlaces((currentPlaces) =>
      currentPlaces.filter((place) => place.id !== placeId),
    );
    setSelectedPlaceId((currentSelectedPlaceId) =>
      currentSelectedPlaceId === placeId ? null : currentSelectedPlaceId,
    );
  }

  function handleLoadMap(name: string) {
    const savedMap = savedMaps.find((entry) => entry.name === name);

    if (!savedMap) {
      return;
    }

    setMapName(savedMap.name);
    setPlaces(savedMap.places);
    setSelectedPlaceId(savedMap.places[0]?.id ?? null);
  }

  function handleDeleteMap(name: string) {
    const nextSavedMaps = savedMaps.filter(
      (savedMap) => savedMap.name !== name,
    );

    setSavedMaps(nextSavedMaps);
    writeSavedMaps(nextSavedMaps);

    if (name === previousMapNameRef.current) {
      previousMapNameRef.current = getEffectiveMapName(mapName);
    }
  }

  function handleCreateNewMap() {
    const nextName = createNewScratchMapName(savedMaps);

    setMapName(nextName);
    setPlaces([]);
    setSelectedPlaceId(null);
    setDraft(createBlankPlaceDraft());
    setFilterText("");
    setOpenOnly(false);
  }

  async function handleCopyPermalink() {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const normalizedFilter = deferredFilterText.trim().toLowerCase();
  const filteredPlaces = places
    .filter((place) => {
      if (normalizedFilter.length === 0) {
        return true;
      }

      const haystack = [place.name, place.address, place.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedFilter);
    })
    .filter((place) => {
      if (!openOnly) {
        return true;
      }

      return getPlaceStatus(place, selectedDate).isOpen;
    })
    .sort((left, right) => {
      switch (sortOption) {
        case "name:asc":
          return left.name.localeCompare(right.name);
        case "name:desc":
          return right.name.localeCompare(left.name);
        case "rating:asc":
          return left.rating - right.rating;
        case "reviews:asc":
          return left.reviewCount - right.reviewCount;
        case "reviews:desc":
          return right.reviewCount - left.reviewCount;
        case "rating:desc":
        default:
          return right.rating - left.rating;
      }
    });

  const openCount = places.filter(
    (place) => getPlaceStatus(place, selectedDate).isOpen,
  ).length;
  const totalReviews = places.reduce(
    (sum, place) => sum + place.reviewCount,
    0,
  );
  const averageRating =
    places.length === 0
      ? 0
      : places.reduce((sum, place) => sum + place.rating, 0) / places.length;
  const visiblePlacesLabel =
    filteredPlaces.length === places.length
      ? `${places.length} places in view`
      : `${filteredPlaces.length} of ${places.length} places shown`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 p-3 sm:p-4 lg:p-6">
      <MapHeader
        mapName={mapName}
        selectedDate={selectedDate}
        permalink={permalink}
        copyState={copyState}
        savedMapCount={savedMaps.length}
        onMapNameChange={setMapName}
        onMapNameBlur={handleMapNameBlur}
        onSelectedDateChange={setSelectedDate}
        onCopyPermalink={handleCopyPermalink}
        onNewMap={handleCreateNewMap}
      />
      <SummaryStrip
        placeCount={places.length}
        openCount={openCount}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />
      <div className="panel-grid lg:h-[calc(100vh-18rem)] lg:min-h-[42rem]">
        <div className="flex min-h-[24rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-card/90 shadow-panel backdrop-blur">
          <div className="border-b border-border/60 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Sidebar
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {visiblePlacesLabel}
                </div>
              </div>
              <div className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {getEffectiveMapName(mapName)}
              </div>
            </div>
            <div
              className="mt-4 grid grid-cols-2 gap-2"
              role="tablist"
              aria-label="Sidebar panels"
            >
              {sidebarTabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={activeSidebarTab === tab.id ? "default" : "outline"}
                    className="justify-start"
                    role="tab"
                    aria-selected={activeSidebarTab === tab.id}
                    onClick={() => setActiveSidebarTab(tab.id)}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeSidebarTab === "places" ? (
              <PlaceList
                places={filteredPlaces}
                selectedPlaceId={selectedPlaceId}
                pinMode={pinMode}
                selectedDate={selectedDate}
                onSelectPlace={setSelectedPlaceId}
                onRemovePlace={handleRemovePlace}
              />
            ) : null}
            {activeSidebarTab === "filters" ? (
              <PlaceFilters
                filterText={filterText}
                openOnly={openOnly}
                pinMode={pinMode}
                sortOption={sortOption}
                selectedDate={selectedDate}
                onFilterTextChange={setFilterText}
                onOpenOnlyChange={setOpenOnly}
                onPinModeChange={setPinMode}
                onSortOptionChange={setSortOption}
              />
            ) : null}
            {activeSidebarTab === "add" ? (
              <PlaceForm
                draft={draft}
                onDraftChange={setDraft}
                onHoursChange={handleHoursChange}
                onSubmit={handleAddPlace}
                onReset={() => setDraft(createBlankPlaceDraft())}
              />
            ) : null}
            {activeSidebarTab === "saved" ? (
              <SavedMapsPanel
                savedMaps={savedMaps}
                currentMapName={getEffectiveMapName(mapName)}
                onLoadMap={handleLoadMap}
                onDeleteMap={handleDeleteMap}
              />
            ) : null}
          </div>
        </div>
        <MapCanvas
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          pinMode={pinMode}
          selectedDate={selectedDate}
          onSelectPlace={setSelectedPlaceId}
        />
      </div>
    </main>
  );
}
