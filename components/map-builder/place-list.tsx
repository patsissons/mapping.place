import { useEffect, useRef } from "react";
import { MapPin, MessageSquareMore, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlaceStatus } from "@/lib/place-status";
import { type Place } from "@/lib/types";
import { cn, formatCompactNumber } from "@/lib/utils";

type PlaceListProps = {
  places: Place[];
  selectedPlaceId: string | null;
  selectedDate: string;
  isActive: boolean;
  selectionFocusRequest: number;
  onSelectPlace: (placeId: string) => void;
  onRemovePlace: (placeId: string) => void;
};

function hasCoordinates(place: Place) {
  return (
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function hasConfiguredHours(place: Place) {
  return Object.values(place.hours).some((hours) => hours.enabled);
}

function getPlaceDetail(place: Place, selectedDate: string) {
  if (place.hydration?.status === "pending") {
    return "Hydrating Google Place details...";
  }

  if (place.hydration?.status === "failed") {
    return place.hydration.error ?? "Google Place lookup failed.";
  }

  if (!hasCoordinates(place)) {
    return place.placeId
      ? `Saved Google reference ${place.placeId}. Coordinates and place details will populate after hydration succeeds.`
      : "Saved Google link. Coordinates will appear when the link exposes them or hydration is added.";
  }

  if (!hasConfiguredHours(place)) {
    return "Coordinates available on the map.";
  }

  return getPlaceStatus(place, selectedDate).detail;
}

export function PlaceList({
  places,
  selectedPlaceId,
  selectedDate,
  isActive,
  selectionFocusRequest,
  onSelectPlace,
  onRemovePlace,
}: PlaceListProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!isActive || !selectedPlaceId || selectionFocusRequest === 0) {
      return;
    }

    itemRefs.current[selectedPlaceId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [isActive, selectedPlaceId, selectionFocusRequest]);

  return (
    <div className="space-y-3 snap-y snap-proximity">
      {places.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No places match the current filter yet.
        </div>
      ) : (
        places.map((place) => {
          const status = getPlaceStatus(place, selectedDate);
          const showRating = place.rating > 0;
          const showReviews = place.reviewCount > 0;
          const showStatus = hasConfiguredHours(place);

          return (
            <div
              key={place.id}
              ref={(node) => {
                itemRefs.current[place.id] = node;
              }}
              className={cn(
                "snap-start rounded-lg border p-4 transition-colors",
                selectedPlaceId === place.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-secondary/70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectPlace(place.id)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <div className="truncate font-medium">{place.name}</div>
                  </div>
                  {place.address ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {place.address}
                    </p>
                  ) : null}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemovePlace(place.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <button
                type="button"
                className="mt-3 w-full text-left"
                onClick={() => onSelectPlace(place.id)}
              >
                <div className="flex flex-wrap gap-2">
                  {showRating ? (
                    <Badge variant="outline">
                      Rating {place.rating.toFixed(1)}
                    </Badge>
                  ) : null}
                  {showReviews ? (
                    <Badge variant="outline">
                      {formatCompactNumber(place.reviewCount)} reviews
                    </Badge>
                  ) : null}
                  {showStatus ? (
                    <Badge variant={status.isOpen ? "default" : "secondary"}>
                      {status.label}
                    </Badge>
                  ) : null}
                  {place.hydration?.status === "pending" ? (
                    <Badge variant="secondary">Hydrating</Badge>
                  ) : null}
                  {place.hydration?.status === "failed" ? (
                    <Badge variant="secondary">Lookup failed</Badge>
                  ) : null}
                  {!hasCoordinates(place) ? (
                    <Badge variant="secondary">Location pending</Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquareMore className="size-3.5" />
                  <span>{getPlaceDetail(place, selectedDate)}</span>
                </div>
                {place.notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {place.notes}
                  </p>
                ) : null}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
