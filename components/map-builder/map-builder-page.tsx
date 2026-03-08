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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseGooglePlaceInput } from "@/lib/google-place";
import {
  createBlankPlaceDraft,
  createEmptyHours,
  createStarterPlaces,
} from "@/lib/place-data";
import { getPlaceStatus } from "@/lib/place-status";
import {
  clearSavedMaps,
  loadSavedMaps,
  upsertSavedMap,
  writeSavedMaps,
} from "@/lib/storage";
import {
  type PinMode,
  type Place,
  type PlaceDraft,
  type SavedMap,
  type SortOption,
} from "@/lib/types";
import {
  clearMapStateFromUrl,
  readMapStateFromUrl,
  writeMapStateToUrl,
} from "@/lib/url-state";
import { createId, createUlid, getDateInputValue } from "@/lib/utils";

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
  const [currentMapId, setCurrentMapId] = useState(createUlid());
  const [mapName, setMapName] = useState(DEFAULT_MAP_NAME);
  const [places, setPlaces] = useState<Place[]>(createStarterPlaces());
  const [draft, setDraft] = useState<PlaceDraft>(createBlankPlaceDraft());
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
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
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedPlaceFocusRequest, setSelectedPlaceFocusRequest] = useState(0);
  const [locationFocusRequest, setLocationFocusRequest] = useState(0);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const skipNextAutosaveRef = useRef(false);
  const deferredFilterText = useDeferredValue(filterText);

  useEffect(() => {
    const storedMaps = loadSavedMaps();
    const urlMap = readMapStateFromUrl(
      new URLSearchParams(window.location.search),
    );
    const initialMap = urlMap
      ? {
          id: urlMap.mapId ?? createUlid(),
          name: urlMap.mapName,
          places: urlMap.places,
        }
      : (storedMaps[0] ?? {
          id: createUlid(),
          name: DEFAULT_MAP_NAME,
          places: createStarterPlaces(),
        });

    writeSavedMaps(storedMaps);
    setSavedMaps(storedMaps);
    setCurrentMapId(initialMap.id);
    setMapName(initialMap.name);
    setPlaces(initialMap.places);
    setSelectedPlaceId(initialMap.places[0]?.id ?? null);
    setPermalink(window.location.href);
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current || !currentMapId || !mapName.trim()) {
      return;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const effectiveMapName = getEffectiveMapName(mapName);
    const nextUrl = writeMapStateToUrl(currentMapId, effectiveMapName, places);
    const updatedAt = new Date().toISOString();

    setPermalink(nextUrl);
    setSavedMaps((currentSavedMaps) => {
      const nextSavedMaps = upsertSavedMap(currentSavedMaps, {
        id: currentMapId,
        name: effectiveMapName,
        places,
        updatedAt,
        source: {
          kind: "scratch",
        },
      });

      writeSavedMaps(nextSavedMaps);

      return nextSavedMaps;
    });
  }, [currentMapId, mapName, places]);

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

  function handleAddPlace() {
    const parsed = parseGooglePlaceInput(draft.googleInput);

    if (!parsed) {
      return;
    }

    const nextPlace: Place = {
      id: createId("place"),
      placeId: parsed.placeId,
      sourceUrl: parsed.sourceUrl,
      name: parsed.name,
      address: parsed.address,
      lat: parsed.lat,
      lng: parsed.lng,
      rating: 0,
      reviewCount: 0,
      hours: createEmptyHours(),
    };

    setPlaces((currentPlaces) => [...currentPlaces, nextPlace]);
    setSelectedPlaceId(nextPlace.id);
    setDraft(createBlankPlaceDraft());
    setActiveSidebarTab("places");
  }

  function handleRemovePlace(placeId: string) {
    setPlaces((currentPlaces) =>
      currentPlaces.filter((place) => place.id !== placeId),
    );
    setSelectedPlaceId((currentSelectedPlaceId) =>
      currentSelectedPlaceId === placeId ? null : currentSelectedPlaceId,
    );
  }

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    setSelectedPlaceFocusRequest((currentValue) => currentValue + 1);
  }

  function handleLoadMap(mapId: string) {
    const savedMap = savedMaps.find((entry) => entry.id === mapId);

    if (!savedMap) {
      return;
    }

    setCurrentMapId(savedMap.id);
    setMapName(savedMap.name);
    setPlaces(savedMap.places);
    setSelectedPlaceId(savedMap.places[0]?.id ?? null);
  }

  function handleDeleteMap(mapId: string) {
    const nextSavedMaps = savedMaps.filter((savedMap) => savedMap.id !== mapId);

    setSavedMaps(nextSavedMaps);
    writeSavedMaps(nextSavedMaps);
  }

  function handleCreateNewMap() {
    const nextName = createNewScratchMapName(savedMaps);

    setCurrentMapId(createUlid());
    setMapName(nextName);
    setPlaces([]);
    setSelectedPlaceId(null);
    setDraft(createBlankPlaceDraft());
    setFilterText("");
    setOpenOnly(false);
    setIsHeaderExpanded(true);
    setActiveSidebarTab("add");
  }

  function handleResetAllLocalData() {
    const starterPlaces = createStarterPlaces();

    clearSavedMaps();
    const nextUrl = clearMapStateFromUrl();
    skipNextAutosaveRef.current = true;

    setSavedMaps([]);
    setCurrentMapId(createUlid());
    setMapName(DEFAULT_MAP_NAME);
    setPlaces(starterPlaces);
    setSelectedPlaceId(starterPlaces[0]?.id ?? null);
    setDraft(createBlankPlaceDraft());
    setFilterText("");
    setOpenOnly(false);
    setSortOption("rating:desc");
    setPinMode("rating");
    setActiveSidebarTab("places");
    setPermalink(nextUrl);
    setIsHeaderExpanded(true);
  }

  async function handleCopyPermalink() {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function handleLocateUser() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationStatus("loading");
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
        setLocationFocusRequest((currentValue) => currentValue + 1);
      },
      () => {
        setLocationStatus("error");
        setLocationError("Unable to access your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  const normalizedFilter = deferredFilterText.trim().toLowerCase();
  const filteredPlaces = places
    .filter((place) => {
      if (normalizedFilter.length === 0) {
        return true;
      }

      const haystack = [place.name, place.address, place.notes, place.placeId]
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
  const ratedPlaces = places.filter((place) => place.rating > 0);
  const averageRating =
    ratedPlaces.length === 0
      ? 0
      : ratedPlaces.reduce((sum, place) => sum + place.rating, 0) /
        ratedPlaces.length;
  const visiblePlacesLabel =
    filteredPlaces.length === places.length
      ? `${places.length} places in view`
      : `${filteredPlaces.length} of ${places.length} places shown`;
  const decodedUrlState =
    typeof window !== "undefined" && permalink
      ? readMapStateFromUrl(new URL(permalink).searchParams)
      : null;
  const showDevPanel =
    process.env.NODE_ENV === "development" && isHeaderExpanded;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 p-3 sm:p-4 lg:p-6">
      <MapHeader
        mapName={mapName}
        selectedDate={selectedDate}
        permalink={permalink}
        copyState={copyState}
        savedMapCount={savedMaps.length}
        isExpanded={isHeaderExpanded}
        onMapNameChange={setMapName}
        onMapNameBlur={handleMapNameBlur}
        onSelectedDateChange={setSelectedDate}
        onCopyPermalink={handleCopyPermalink}
        onNewMap={handleCreateNewMap}
        onExpandedChange={setIsHeaderExpanded}
      />
      {isHeaderExpanded ? (
        <SummaryStrip
          placeCount={places.length}
          openCount={openCount}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
      ) : null}
      {showDevPanel ? (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decoded URL State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {JSON.stringify(decodedUrlState, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
      <div className="panel-grid lg:h-[calc(100vh-18rem)] lg:min-h-[42rem]">
        <div className="flex min-h-[24rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-card/90 shadow-panel backdrop-blur">
          <div className="border-b border-border/60 px-4 py-4">
            <div className="text-sm text-muted-foreground">
              {visiblePlacesLabel}
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
                selectedDate={selectedDate}
                isActive={activeSidebarTab === "places"}
                selectionFocusRequest={selectedPlaceFocusRequest}
                onSelectPlace={handleSelectPlace}
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
                onSubmit={handleAddPlace}
                onReset={() => setDraft(createBlankPlaceDraft())}
              />
            ) : null}
            {activeSidebarTab === "saved" ? (
              <SavedMapsPanel
                savedMaps={savedMaps}
                currentMapId={currentMapId}
                onLoadMap={handleLoadMap}
                onDeleteMap={handleDeleteMap}
                onResetAllLocalData={handleResetAllLocalData}
              />
            ) : null}
          </div>
        </div>
        <MapCanvas
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          pinMode={pinMode}
          selectedDate={selectedDate}
          selectedPlaceFocusRequest={selectedPlaceFocusRequest}
          currentLocation={currentLocation}
          locationFocusRequest={locationFocusRequest}
          locationStatus={locationStatus}
          locationError={locationError}
          onLocateUser={handleLocateUser}
          onSelectPlace={handleSelectPlace}
        />
      </div>
    </main>
  );
}
