"use client";

import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type PinMode, type Place } from "@/lib/types";

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/map-builder/open-map-canvas").then(
      (module) => module.OpenMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[24rem] items-center justify-center text-sm text-muted-foreground">
        Loading map canvas...
      </div>
    ),
  },
);

type MapCanvasProps = {
  places: Place[];
  selectedPlaceId: string | null;
  pinMode: PinMode;
  selectedDate: string;
  currentLocation: { lat: number; lng: number } | null;
  locationFocusRequest: number;
  locationStatus: "idle" | "loading" | "ready" | "error";
  locationError: string | null;
  onLocateUser: () => void;
  onSelectPlace: (placeId: string) => void;
};

export function MapCanvas({
  places,
  selectedPlaceId,
  pinMode,
  selectedDate,
  currentLocation,
  locationFocusRequest,
  locationStatus,
  locationError,
  onLocateUser,
  onSelectPlace,
}: MapCanvasProps) {
  return (
    <div className="relative h-full min-h-[24rem]">
      <Card className="h-full min-h-[24rem] overflow-hidden border-border/60">
        <CardContent className="h-full p-0">
          <div className="h-full min-h-[24rem]">
            <LeafletMapCanvas
              places={places}
              selectedPlaceId={selectedPlaceId}
              pinMode={pinMode}
              selectedDate={selectedDate}
              currentLocation={currentLocation}
              locationFocusRequest={locationFocusRequest}
              onSelectPlace={onSelectPlace}
            />
          </div>
        </CardContent>
      </Card>
      <div className="pointer-events-none absolute right-3 top-3 z-[500]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-auto bg-card/95 backdrop-blur"
          onClick={onLocateUser}
          title={locationError ?? "Zoom to your current position"}
        >
          <LocateFixed className="size-4" />
          {locationStatus === "loading" ? "Locating..." : "My location"}
        </Button>
      </div>
    </div>
  );
}
