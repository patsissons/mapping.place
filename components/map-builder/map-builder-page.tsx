"use client";

import {
  useCallback,
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SummaryStrip } from "@/components/map-builder/summary-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  markGooglePlaceHydrationFailed,
  markGooglePlaceHydrationPending,
  placeNeedsGoogleHydration,
} from "@/lib/google-place";
import {
  DEFAULT_MAP_NAME,
  createBlankPlaceDraft,
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
  type InitialMapState,
  type PinMode,
  type Place,
  type PlaceDraft,
  type SavedMap,
  type SortOption,
} from "@/lib/types";
import {
  buildMapStateUrl,
  clearMapStateFromUrl,
  readMapPayloadFromUrl,
} from "@/lib/url-state";
import { createId, createUlid, getDateInputValue } from "@/lib/utils";

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

type MapBuilderPageProps = {
  initialMap: InitialMapState;
  isAuthenticated: boolean;
};

type HydratePlaceApiResponse = {
  error?: string;
  place: Place;
};

type ResolvePlaceApiResponse = HydratePlaceApiResponse & {
  placeId?: string;
  inputType?: "place-id" | "google-url" | "short-url";
};

function shouldStartWithExpandedHeader(initialMap: InitialMapState) {
  return initialMap.source !== "url";
}

function toRelativeUrl(href: string) {
  const url = new URL(href);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function MapBuilderPage({
  initialMap,
  isAuthenticated,
}: MapBuilderPageProps) {
  const [currentMapId, setCurrentMapId] = useState(initialMap.mapId);
  const [mapName, setMapName] = useState(initialMap.mapName);
  const [mapEmoji, setMapEmoji] = useState(initialMap.mapEmoji ?? "");
  const [places, setPlaces] = useState<Place[]>(initialMap.places);
  const [draft, setDraft] = useState<PlaceDraft>(createBlankPlaceDraft());
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(() =>
    shouldStartWithExpandedHeader(initialMap),
  );
  const [selectedDate, setSelectedDate] = useState(
    getDateInputValue(new Date()),
  );
  const [filterText, setFilterText] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("rating:desc");
  const [pinMode, setPinMode] = useState<PinMode>("rating");
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
  const [addPlaceError, setAddPlaceError] = useState<string | null>(null);
  const [isGoogleListImportModalOpen, setIsGoogleListImportModalOpen] =
    useState(false);
  const [googleListImportUrl, setGoogleListImportUrl] = useState("");
  const [googleListImportError, setGoogleListImportError] = useState<
    string | null
  >(null);
  const [isResolvingPlaceInput, setIsResolvingPlaceInput] = useState(false);
  const [isImportingGoogleList, setIsImportingGoogleList] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    initialMap.places[0]?.id ?? null,
  );
  const initializedRef = useRef(false);
  const pendingHydrationIdsRef = useRef(new Set<string>());
  const permalinkRequestIdRef = useRef(0);
  const skipNextAutosaveRef = useRef(false);
  const deferredFilterText = useDeferredValue(filterText);
  const [decodedUrlState, setDecodedUrlState] =
    useState<Awaited<ReturnType<typeof readMapPayloadFromUrl>>>(null);

  const redirectToLogin = useCallback(async () => {
    const loginUrl = new URL("/login", window.location.origin);

    try {
      const callbackUrl = await buildMapStateUrl(
        window.location.href,
        currentMapId,
        getEffectiveMapName(mapName),
        places,
        mapEmoji.trim() || undefined,
      );

      loginUrl.searchParams.set("callbackUrl", toRelativeUrl(callbackUrl));
    } catch {
      loginUrl.searchParams.set(
        "callbackUrl",
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    }

    window.location.assign(loginUrl.toString());
  }, [currentMapId, mapEmoji, mapName, places]);

  const hydratePlaceById = useCallback(
    async (localPlaceId: string, googlePlaceId: string) => {
    try {
      const response = await fetch(
        `/api/places/${encodeURIComponent(googlePlaceId)}`,
        {
          method: "POST",
          headers: {
            "x-mapping-place-client": "web",
          },
        },
      );

      if (response.status === 401) {
        await redirectToLogin();
        return;
      }

      const payload = (await response.json()) as HydratePlaceApiResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Unable to hydrate this Google place.",
        );
      }

      startTransition(() => {
        setPlaces((currentPlaces) =>
          currentPlaces.map((place) =>
            place.id === localPlaceId
              ? {
                  ...payload.place,
                  id: place.id,
                  notes: place.notes,
                  sourceUrl: payload.place.sourceUrl ?? place.sourceUrl,
                }
              : place,
          ),
        );
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to hydrate this Google place.";

      startTransition(() => {
        setPlaces((currentPlaces) =>
          currentPlaces.map((place) =>
            place.id === localPlaceId
              ? markGooglePlaceHydrationFailed(place, message)
              : place,
          ),
        );
      });
    } finally {
      pendingHydrationIdsRef.current.delete(localPlaceId);
    }
    },
    [redirectToLogin],
  );

  useEffect(() => {
    const storedMaps = loadSavedMaps();

    writeSavedMaps(storedMaps);
    setSavedMaps(storedMaps);

    if (initialMap.source === "default" && storedMaps[0]) {
      setCurrentMapId(storedMaps[0].id);
      setMapName(storedMaps[0].name);
      setMapEmoji(storedMaps[0].emoji ?? "");
      setPlaces(storedMaps[0].places);
      setSelectedPlaceId(storedMaps[0].places[0]?.id ?? null);
    } else {
      setCurrentMapId(initialMap.mapId);
      setMapName(initialMap.mapName);
      setMapEmoji(initialMap.mapEmoji ?? "");
      setPlaces(initialMap.places);
      setSelectedPlaceId(initialMap.places[0]?.id ?? null);
    }

    setIsHeaderExpanded(shouldStartWithExpandedHeader(initialMap));
    setPermalink(window.location.href);
    initializedRef.current = true;
  }, [initialMap]);

  useEffect(() => {
    if (!initializedRef.current || !currentMapId || !mapName.trim()) {
      return;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const effectiveMapName = getEffectiveMapName(mapName);
    const effectiveMapEmoji = mapEmoji.trim() || undefined;
    const updatedAt = new Date().toISOString();
    const requestId = permalinkRequestIdRef.current + 1;
    const currentUrl = window.location.href;

    permalinkRequestIdRef.current = requestId;

    setSavedMaps((currentSavedMaps) => {
      const nextSavedMaps = upsertSavedMap(currentSavedMaps, {
        id: currentMapId,
        name: effectiveMapName,
        emoji: effectiveMapEmoji,
        places,
        updatedAt,
        source: {
          kind: "scratch",
        },
      });

      writeSavedMaps(nextSavedMaps);

      return nextSavedMaps;
    });

    let cancelled = false;

    async function syncPermalink() {
      const nextUrl = await buildMapStateUrl(
        currentUrl,
        currentMapId,
        effectiveMapName,
        places,
        effectiveMapEmoji,
      );

      if (cancelled || requestId !== permalinkRequestIdRef.current) {
        return;
      }

      setPermalink(nextUrl);

      if (isAuthenticated) {
        window.history.replaceState({}, "", nextUrl);
      }
    }

    void syncPermalink();

    return () => {
      cancelled = true;
    };
  }, [currentMapId, isAuthenticated, mapEmoji, mapName, places]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 1800);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (!isGoogleListImportModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isImportingGoogleList) {
        setIsGoogleListImportModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGoogleListImportModalOpen, isImportingGoogleList]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!initializedRef.current) {
      return;
    }

    const candidates = places.filter(
      (place) =>
        placeNeedsGoogleHydration(place) &&
        place.placeId &&
        !pendingHydrationIdsRef.current.has(place.id),
    );

    if (candidates.length === 0) {
      return;
    }

    const candidateIds = new Set(candidates.map((place) => place.id));

    for (const candidate of candidates) {
      pendingHydrationIdsRef.current.add(candidate.id);
    }

    startTransition(() => {
      setPlaces((currentPlaces) =>
        currentPlaces.map((place) =>
          candidateIds.has(place.id)
            ? markGooglePlaceHydrationPending(place)
            : place,
        ),
      );
    });

    for (const candidate of candidates) {
      void hydratePlaceById(candidate.id, candidate.placeId!);
    }
  }, [hydratePlaceById, isAuthenticated, places]);

  useEffect(() => {
    if (!permalink) {
      setDecodedUrlState(null);
      return;
    }

    let cancelled = false;

    async function decodePermalink() {
      const decodedPayload = await readMapPayloadFromUrl(
        new URL(permalink).searchParams,
      );

      if (!cancelled) {
        setDecodedUrlState(decodedPayload);
      }
    }

    void decodePermalink();

    return () => {
      cancelled = true;
    };
  }, [permalink]);

  function handleMapNameBlur() {
    if (!mapName.trim()) {
      setMapName(DEFAULT_MAP_NAME);
    }
  }

  async function handleAddPlace() {
    const input = draft.googleInput.trim();

    if (!input || isResolvingPlaceInput) {
      return;
    }

    if (!isAuthenticated) {
      await redirectToLogin();
      return;
    }

    setIsResolvingPlaceInput(true);
    setAddPlaceError(null);

    try {
      const response = await fetch("/api/places/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mapping-place-client": "web",
        },
        body: JSON.stringify({
          input,
        }),
      });

      if (response.status === 401) {
        await redirectToLogin();
        return;
      }

      const payload = (await response.json()) as ResolvePlaceApiResponse;

      if (!response.ok || !payload.place) {
        throw new Error(
          payload.error ?? "Unable to resolve this Google place.",
        );
      }

      const nextPlace: Place = {
        ...payload.place,
        id: createId("place"),
      };

      setPlaces((currentPlaces) => [...currentPlaces, nextPlace]);
      setSelectedPlaceId(nextPlace.id);
      setDraft(createBlankPlaceDraft());
      setActiveSidebarTab("places");
    } catch (error) {
      setAddPlaceError(
        error instanceof Error
          ? error.message
          : "Unable to resolve this Google place.",
      );
    } finally {
      setIsResolvingPlaceInput(false);
    }
  }

  type ImportGoogleListApiResponse = {
    error?: string;
    mapUrl?: string;
    placeCount?: number;
    map?: InitialMapState;
  };

  async function handleImportGoogleList() {
    const input = googleListImportUrl.trim();

    if (!input || isImportingGoogleList) {
      return;
    }

    if (!isAuthenticated) {
      await redirectToLogin();
      return;
    }

    setIsImportingGoogleList(true);
    setGoogleListImportError(null);

    try {
      const response = await fetch("/api/maps/import/google-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mapping-place-client": "web",
        },
        body: JSON.stringify({
          url: input,
        }),
      });

      if (response.status === 401) {
        await redirectToLogin();
        return;
      }

      const payload = (await response.json()) as ImportGoogleListApiResponse;

      if (!response.ok || !payload.mapUrl) {
        throw new Error(payload.error ?? "Unable to import this Google list.");
      }

      window.location.assign(payload.mapUrl);
    } catch (error) {
      setGoogleListImportError(
        error instanceof Error
          ? error.message
          : "Unable to import this Google list.",
      );
      setIsImportingGoogleList(false);
    }
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
    setMapEmoji(savedMap.emoji ?? "");
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
    setMapEmoji("");
    setPlaces([]);
    setSelectedPlaceId(null);
    setDraft(createBlankPlaceDraft());
    setAddPlaceError(null);
    setIsGoogleListImportModalOpen(false);
    setGoogleListImportUrl("");
    setGoogleListImportError(null);
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
    setMapEmoji("");
    setPlaces(starterPlaces);
    setSelectedPlaceId(starterPlaces[0]?.id ?? null);
    setDraft(createBlankPlaceDraft());
    setAddPlaceError(null);
    setIsGoogleListImportModalOpen(false);
    setGoogleListImportUrl("");
    setGoogleListImportError(null);
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
  const showDevPanel =
    process.env.NODE_ENV === "development" && isHeaderExpanded;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 p-3 sm:p-4 lg:p-6">
      <MapHeader
        mapName={mapName}
        mapEmoji={mapEmoji}
        permalink={permalink}
        copyState={copyState}
        isExpanded={isHeaderExpanded}
        authControls={isAuthenticated ? <SignOutButton /> : null}
        onMapNameChange={setMapName}
        onMapEmojiChange={setMapEmoji}
        onMapNameBlur={handleMapNameBlur}
        onCopyPermalink={handleCopyPermalink}
        onImportGoogleList={() => {
          if (!isAuthenticated) {
            void redirectToLogin();
            return;
          }

          setIsGoogleListImportModalOpen(true);
          setGoogleListImportError(null);
        }}
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
        <Card className="max-h-[400px] overflow-hidden border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decoded URL State</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <pre className="max-h-[320px] overflow-auto rounded-lg bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {JSON.stringify(decodedUrlState, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
      <div className="panel-grid lg:h-[calc(100vh-18rem)] lg:min-h-[42rem]">
        <div className="order-2 flex min-h-[24rem] flex-col overflow-hidden rounded-lg border border-border/60 bg-card/90 shadow-panel backdrop-blur lg:order-1">
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
                    variant={
                      activeSidebarTab === tab.id ? "default" : "outline"
                    }
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
                onSelectedDateChange={setSelectedDate}
              />
            ) : null}
            {activeSidebarTab === "add" ? (
              <PlaceForm
                draft={draft}
                onDraftChange={(nextDraft) => {
                  setDraft(nextDraft);
                  setAddPlaceError(null);
                }}
                onSubmit={handleAddPlace}
                onReset={() => {
                  setDraft(createBlankPlaceDraft());
                  setAddPlaceError(null);
                }}
                error={addPlaceError}
                isSubmitting={isResolvingPlaceInput}
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
          className="order-1 lg:order-2"
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
          onClearSelectedPlace={() => setSelectedPlaceId(null)}
          onSelectPlace={handleSelectPlace}
        />
      </div>
      {isGoogleListImportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl border-border/60 bg-background/95 shadow-2xl">
            <CardHeader className="space-y-2">
              <CardTitle>Import Google list</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste a shared Google Maps list URL. We&apos;ll resolve each
                entry to a Google Place ID, create a custom map URL, and let SSR
                hydrate the places on load.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleImportGoogleList();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="google-list-import-url">
                    Google list URL
                  </Label>
                  <Input
                    id="google-list-import-url"
                    value={googleListImportUrl}
                    onChange={(event) => {
                      setGoogleListImportUrl(event.target.value);
                      setGoogleListImportError(null);
                    }}
                    placeholder="https://maps.app.goo.gl/..."
                    autoFocus
                  />
                </div>
                {googleListImportError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {googleListImportError}
                  </div>
                ) : null}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isImportingGoogleList}
                    onClick={() => setIsGoogleListImportModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      googleListImportUrl.trim().length === 0 ||
                      isImportingGoogleList
                    }
                  >
                    {isImportingGoogleList ? "Importing..." : "Import list"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
