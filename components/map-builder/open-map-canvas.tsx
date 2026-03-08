"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  CircleMarker,
  Marker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import { getPinAppearance } from "@/lib/place-status";
import { type PinMode, type Place } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

type OpenMapCanvasProps = {
  places: Place[];
  selectedPlaceId: string | null;
  pinMode: PinMode;
  selectedDate: string;
  currentLocation: { lat: number; lng: number } | null;
  locationFocusRequest: number;
  onSelectPlace: (placeId: string) => void;
};

function formatPinLabel(label: string, pinMode: PinMode) {
  if (pinMode !== "reviews") {
    return label;
  }

  const parsed = Number(label);

  return Number.isFinite(parsed) ? formatCompactNumber(parsed) : label;
}

function hasCoordinates(place: Place): place is Place & { lat: number; lng: number } {
  return (
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function createMarkerIcon(
  place: Place,
  places: Place[],
  pinMode: PinMode,
  selectedDate: string,
  selected: boolean,
) {
  const appearance = getPinAppearance(place, places, pinMode, selectedDate);
  const label = formatPinLabel(appearance.label, pinMode);
  const scale = selected ? 1.08 : 1;
  const borderColor = selected ? "rgb(251 191 36)" : "rgba(255 255 255 / 0.82)";

  return L.divIcon({
    className: "mapping-place-marker-shell",
    iconAnchor: [26, 44],
    iconSize: [52, 52],
    html: `<div class="mapping-place-pin" style="--pin-bg:${appearance.background};--pin-fg:${appearance.foreground};transform:scale(${scale});border-color:${borderColor}">${label}</div>`,
  });
}

function MapViewport({
  places,
  currentLocation,
  locationFocusRequest,
}: {
  places: Array<Place & { lat: number; lng: number }>;
  currentLocation: { lat: number; lng: number } | null;
  locationFocusRequest: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) {
      map.setView([37.7749, -122.4194], 12);
      return;
    }

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, places]);

  useEffect(() => {
    if (!currentLocation || locationFocusRequest === 0) {
      return;
    }

    map.setView([currentLocation.lat, currentLocation.lng], 16);
  }, [currentLocation, locationFocusRequest, map]);

  return null;
}

export function OpenMapCanvas({
  places,
  selectedPlaceId,
  pinMode,
  selectedDate,
  currentLocation,
  locationFocusRequest,
  onSelectPlace,
}: OpenMapCanvasProps) {
  const locatedPlaces = places.filter(hasCoordinates);

  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={12}
      scrollWheelZoom
      className="h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport
        places={locatedPlaces}
        currentLocation={currentLocation}
        locationFocusRequest={locationFocusRequest}
      />
      {currentLocation ? (
        <CircleMarker
          center={[currentLocation.lat, currentLocation.lng]}
          pathOptions={{
            color: "rgb(14 165 233)",
            fillColor: "rgb(56 189 248)",
            fillOpacity: 0.9,
          }}
          radius={10}
        />
      ) : null}
      {locatedPlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={createMarkerIcon(
            place,
            locatedPlaces,
            pinMode,
            selectedDate,
            selectedPlaceId === place.id,
          )}
          eventHandlers={{
            click: () => onSelectPlace(place.id),
          }}
        />
      ))}
    </MapContainer>
  );
}
