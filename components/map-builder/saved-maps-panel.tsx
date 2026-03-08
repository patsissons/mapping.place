import { Clock3, FolderOpen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Saved maps</CardTitle>
        <CardDescription>
          Every named map auto-saves locally. Load one back in without leaving
          the page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedMaps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Save a few places and the map will start appearing here.
          </div>
        ) : (
          savedMaps.map((savedMap, index) => (
            <div key={savedMap.name}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                      onClick={() => onLoadMap(savedMap.name)}
                    >
                      {savedMap.name}
                    </button>
                    {savedMap.name === currentMapName ? (
                      <span className="bg-primary/12 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{savedMap.places.length} places</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" />
                      {new Date(savedMap.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadMap(savedMap.name)}
                  >
                    <FolderOpen className="size-4" />
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={savedMap.name === currentMapName}
                    onClick={() => onDeleteMap(savedMap.name)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
              {index < savedMaps.length - 1 ? (
                <Separator className="mt-3" />
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
