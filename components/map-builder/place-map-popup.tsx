"use client";

import { ExternalLink, MapPin, MessageSquareMore } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getPlaceStatus } from "@/lib/place-status";
import {
  getGoogleMapsUrl,
  getPlaceDetail,
  hasConfiguredHours,
  hasCoordinates,
} from "@/lib/place-presentation";
import { type Place } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

type PlaceMapPopupProps = {
  place: Place;
  selectedDate: string;
};

export function PlaceMapPopup({
  place,
  selectedDate,
}: PlaceMapPopupProps) {
  const status = getPlaceStatus(place, selectedDate);
  const googleMapsUrl = getGoogleMapsUrl(place);
  const showRating = place.rating > 0;
  const showReviews = place.reviewCount > 0;
  const showStatus = hasConfiguredHours(place);

  return (
    <div className="w-[16rem] space-y-3 text-foreground">
      <div className="space-y-1">
        <div className="text-base font-semibold leading-tight">{place.name}</div>
        {place.address ? (
          <p className="text-sm leading-snug text-muted-foreground">
            {place.address}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {showRating ? (
          <Badge variant="outline">Rating {place.rating.toFixed(1)}</Badge>
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
      <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <MessageSquareMore className="mt-0.5 size-3.5 shrink-0" />
        <span>{getPlaceDetail(place, selectedDate)}</span>
      </div>
      {place.notes ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {place.notes}
        </p>
      ) : null}
      {googleMapsUrl ? (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <MapPin className="size-4" />
          <span>Open in Google Maps</span>
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </div>
  );
}
