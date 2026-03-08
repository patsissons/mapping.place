"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PinMode, type Place } from "@/lib/types";

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/map-builder/open-map-canvas").then(
      (module) => module.OpenMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[24rem] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground">
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
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Map canvas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[32rem] min-h-[28rem] overflow-hidden rounded-lg border border-border/70 sm:h-[36rem]">
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
