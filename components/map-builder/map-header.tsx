import { Copy, Link2, Plus, SquareStack } from "lucide-react";

import { ThemeToggle } from "@/components/map-builder/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MapHeaderProps = {
  mapName: string;
  selectedDate: string;
  permalink: string;
  copyState: "idle" | "copied" | "error";
  savedMapCount: number;
  onMapNameChange: (value: string) => void;
  onMapNameBlur: () => void;
  onSelectedDateChange: (value: string) => void;
  onCopyPermalink: () => void;
  onNewMap: () => void;
};

export function MapHeader({
  mapName,
  selectedDate,
  permalink,
  copyState,
  savedMapCount,
  onMapNameChange,
  onMapNameBlur,
  onSelectedDateChange,
  onCopyPermalink,
  onNewMap,
}: MapHeaderProps) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-card/80 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>mapping.place</Badge>
            <Badge variant="outline">Local-first map builder</Badge>
          </div>
          <div>
            <CardTitle className="text-2xl md:text-3xl">
              Build richer place collections than a plain saved map.
            </CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              The map renderer stays open and lightweight while the place data
              model stays ready for future Google Places or custom-map imports.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="secondary" onClick={onNewMap}>
            <Plus className="size-4" />
            New map
          </Button>
          <ThemeToggle />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-5 md:grid-cols-[minmax(0,1fr)_14rem_11rem]">
        <div className="space-y-2">
          <Label htmlFor="map-name">Map name</Label>
          <Input
            id="map-name"
            value={mapName}
            onBlur={onMapNameBlur}
            onChange={(event) => onMapNameChange(event.target.value)}
            placeholder="Weekend coffee crawl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selected-date">Status date</Label>
          <Input
            id="selected-date"
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-secondary/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SquareStack className="size-4 text-primary" />
            Saved maps
          </div>
          <div className="mt-2 text-2xl font-semibold">{savedMapCount}</div>
          <p className="text-xs text-muted-foreground">
            Stored in local storage on this device.
          </p>
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="permalink">Shareable permalink</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="permalink"
                value={permalink}
                readOnly
                className="pl-9 pr-4 text-xs sm:text-sm"
              />
            </div>
            <Button variant="outline" onClick={onCopyPermalink}>
              <Copy className="size-4" />
              {copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy link"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
