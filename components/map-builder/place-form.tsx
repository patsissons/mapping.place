import { Link2, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseGooglePlaceInput } from "@/lib/google-place";
import { type PlaceDraft } from "@/lib/types";

type PlaceFormProps = {
  draft: PlaceDraft;
  onDraftChange: (draft: PlaceDraft) => void;
  onSubmit: () => void | Promise<void>;
  onReset: () => void;
  error: string | null;
  isSubmitting: boolean;
};

export function PlaceForm({
  draft,
  onDraftChange,
  onSubmit,
  onReset,
  error,
  isSubmitting,
}: PlaceFormProps) {
  const parsed = parseGooglePlaceInput(draft.googleInput);
  const formIsValid = draft.googleInput.trim().length > 0 && !isSubmitting;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Add from Google</CardTitle>
        <CardDescription>
          Paste a Google Place ID or a Google Maps share URL. The server
          resolves that input into a Google Place ID, then hydrates the place
          from Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google-input">Google Place ID or URL</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="google-input"
              value={draft.googleInput}
              onChange={(event) =>
                onDraftChange({
                  googleInput: event.target.value,
                })
              }
              className="pl-9"
              placeholder="ChIJ... or https://www.google.com/maps/place/..."
            />
          </div>
        </div>
        {parsed ? (
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm">
            <div className="font-medium text-foreground">{parsed.name}</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div>
                Place ID:{" "}
                {parsed.placeId
                  ? parsed.placeId
                  : "Will be resolved on the server if this is a Google Maps URL"}
              </div>
              <div>
                Coordinates:{" "}
                {typeof parsed.lat === "number" && typeof parsed.lng === "number"
                  ? `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`
                  : "Not exposed by this input"}
              </div>
              <div>
                Address: {parsed.address ?? "Not exposed by this input"}
              </div>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={!formIsValid} onClick={onSubmit}>
            <Plus className="size-4" />
            {isSubmitting ? "Resolving..." : "Add google place"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
