import { MapPin, MessageSquareMore, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type PinMode, type Place } from "@/lib/types";
import { getPlaceStatus } from "@/lib/place-status";
import { cn, formatCompactNumber } from "@/lib/utils";

type PlaceListProps = {
  places: Place[];
  selectedPlaceId: string | null;
  selectedDate: string;
  pinMode: PinMode;
  onSelectPlace: (placeId: string) => void;
  onRemovePlace: (placeId: string) => void;
};

function getPinModeCopy(pinMode: PinMode) {
  switch (pinMode) {
    case "reviews":
      return "Pins show review volume with a red-to-green gradient.";
    case "status":
      return "Pins show open/closed status for the selected date.";
    default:
      return "Pins show rating with a red-to-green gradient and one decimal point.";
  }
}

export function PlaceList({
  places,
  selectedPlaceId,
  selectedDate,
  pinMode,
  onSelectPlace,
  onRemovePlace,
}: PlaceListProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Places in this map</CardTitle>
        <CardDescription>{getPinModeCopy(pinMode)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {places.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No places match the current filter yet.
          </div>
        ) : (
          places.map((place) => {
            const status = getPlaceStatus(place, selectedDate);

            return (
              <div
                key={place.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
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
                      <p className="mt-1 text-sm text-muted-foreground">
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
                    <Badge variant="outline">
                      Rating {place.rating.toFixed(1)}
                    </Badge>
                    <Badge variant="outline">
                      {formatCompactNumber(place.reviewCount)} reviews
                    </Badge>
                    <Badge variant={status.isOpen ? "default" : "secondary"}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquareMore className="size-3.5" />
                    <span>{status.detail}</span>
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
      </CardContent>
    </Card>
  );
}
