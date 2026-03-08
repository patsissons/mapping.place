import { Plus, RotateCcw } from "lucide-react";

import { OpeningHoursEditor } from "@/components/map-builder/opening-hours-editor";
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
import { Textarea } from "@/components/ui/textarea";
import { type OpeningHours, type PlaceDraft } from "@/lib/types";

type PlaceFormProps = {
  draft: PlaceDraft;
  onDraftChange: (draft: PlaceDraft) => void;
  onHoursChange: (hours: OpeningHours) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function PlaceForm({
  draft,
  onDraftChange,
  onHoursChange,
  onSubmit,
  onReset,
}: PlaceFormProps) {
  function updateField<K extends keyof PlaceDraft>(
    key: K,
    value: PlaceDraft[K],
  ) {
    onDraftChange({
      ...draft,
      [key]: value,
    });
  }

  const formIsValid =
    draft.name.trim().length > 0 &&
    draft.lat.trim().length > 0 &&
    draft.lng.trim().length > 0;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Add a place</CardTitle>
        <CardDescription>
          Start from scratch today. Keep the optional Google `placeId` so this
          data can be hydrated or imported later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="place-name">Place name</Label>
          <Input
            id="place-name"
            value={draft.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Sightglass Coffee"
          />
        </div>
        <div className="field-grid">
          <div className="space-y-2">
            <Label htmlFor="place-rating">Rating</Label>
            <Input
              id="place-rating"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={draft.rating}
              onChange={(event) => updateField("rating", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="place-reviews">Review count</Label>
            <Input
              id="place-reviews"
              type="number"
              min="0"
              step="1"
              value={draft.reviewCount}
              onChange={(event) =>
                updateField("reviewCount", event.target.value)
              }
            />
          </div>
        </div>
        <div className="field-grid">
          <div className="space-y-2">
            <Label htmlFor="place-lat">Latitude</Label>
            <Input
              id="place-lat"
              type="number"
              step="0.000001"
              value={draft.lat}
              onChange={(event) => updateField("lat", event.target.value)}
              placeholder="37.77659"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="place-lng">Longitude</Label>
            <Input
              id="place-lng"
              type="number"
              step="0.000001"
              value={draft.lng}
              onChange={(event) => updateField("lng", event.target.value)}
              placeholder="-122.42418"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-id">Google Place ID (optional)</Label>
          <Input
            id="place-id"
            value={draft.placeId}
            onChange={(event) => updateField("placeId", event.target.value)}
            placeholder="ChIJ..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-address">Address (optional)</Label>
          <Input
            id="place-address"
            value={draft.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="736 Divisadero St, San Francisco, CA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-notes">Notes (optional)</Label>
          <Textarea
            id="place-notes"
            value={draft.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Why does this place belong in the collection?"
          />
        </div>
        <div className="space-y-2">
          <Label>Opening hours</Label>
          <OpeningHoursEditor hours={draft.hours} onChange={onHoursChange} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={!formIsValid} onClick={onSubmit}>
            <Plus className="size-4" />
            Add place
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" />
            Reset form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
