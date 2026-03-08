import { getPlaceStatus } from "@/lib/place-status";
import { type Place } from "@/lib/types";

export function hasCoordinates(
  place: Place,
): place is Place & { lat: number; lng: number } {
  return (
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

export function hasConfiguredHours(place: Place) {
  return Object.values(place.hours).some((hours) => hours.enabled);
}

export function getGoogleMapsUrl(place: Place) {
  if (place.sourceUrl?.trim()) {
    return place.sourceUrl.trim();
  }

  if (place.placeId?.trim()) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
      place.placeId.trim(),
    )}`;
  }

  if (hasCoordinates(place)) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }

  return null;
}

export function getPlaceDetail(place: Place, selectedDate: string) {
  if (place.hydration?.status === "pending") {
    return "Hydrating Google Place details...";
  }

  if (place.hydration?.status === "failed") {
    return place.hydration.error ?? "Google Place lookup failed.";
  }

  if (!hasCoordinates(place)) {
    return place.placeId
      ? `Saved Google reference ${place.placeId}. Coordinates and place details will populate after hydration succeeds.`
      : "Saved Google link. Coordinates will appear when the link exposes them or hydration is added.";
  }

  if (!hasConfiguredHours(place)) {
    return "Coordinates available on the map.";
  }

  return getPlaceStatus(place, selectedDate).detail;
}
