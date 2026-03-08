"use client";

import dynamic from "next/dynamic";

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
  onSelectPlace: (placeId: string) => void;
};

export function MapCanvas({
  places,
  selectedPlaceId,
  pinMode,
  selectedDate,
  onSelectPlace,
}: MapCanvasProps) {
  return (
    <Card className="h-full min-h-[24rem] overflow-hidden border-border/60">
      <CardContent className="h-full p-0">
        <div className="h-full min-h-[24rem]">
          <LeafletMapCanvas
            places={places}
            selectedPlaceId={selectedPlaceId}
            pinMode={pinMode}
            selectedDate={selectedDate}
            onSelectPlace={onSelectPlace}
          />
        </div>
      </CardContent>
    </Card>
  );
}
