import { Clock3, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type SavedMap } from "@/lib/types";

type SavedMapsPanelProps = {
  savedMaps: SavedMap[];
  currentMapName: string;
  onLoadMap: (name: string) => void;
  onDeleteMap: (name: string) => void;
};

export function SavedMapsPanel({
  savedMaps,
  currentMapName,
  onLoadMap,
  onDeleteMap,
}: SavedMapsPanelProps) {
  return (
    <div className="space-y-3">
      {savedMaps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Save a few places and the map will start appearing here.
        </div>
      ) : (
        savedMaps.map((savedMap) => {
          const isActive = savedMap.name === currentMapName;

          return (
            <div
              key={savedMap.name}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => onLoadMap(savedMap.name)}
                >
                  {savedMap.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isActive}
                  onClick={() => onDeleteMap(savedMap.name)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : "Saved"}
                </Badge>
                <span>{savedMap.places.length} places</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {new Date(savedMap.updatedAt).toLocaleString()}
                </span>
              </div>
              <Button
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                className="mt-3 w-full"
                disabled={isActive}
                onClick={() => onLoadMap(savedMap.name)}
              >
                {isActive ? "Current map" : "Load map"}
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}
