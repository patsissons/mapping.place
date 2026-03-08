"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  CircleMarker,
  Marker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { PlaceMapPopup } from "@/components/map-builder/place-map-popup";
import { getPinAppearance } from "@/lib/place-status";
import { hasCoordinates } from "@/lib/place-presentation";
import { type PinMode, type Place } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

type OpenMapCanvasProps = {
  places: Place[];
  selectedPlaceId: string | null;
  pinMode: PinMode;
  selectedDate: string;
  selectedPlaceFocusRequest: number;
  currentLocation: { lat: number; lng: number } | null;
  locationFocusRequest: number;
  onClearSelectedPlace: () => void;
  onSelectPlace: (placeId: string) => void;
};

function formatPinLabel(label: string, pinMode: PinMode) {
  if (pinMode !== "reviews") {
    return label;
  }

  const parsed = Number(label);

  return Number.isFinite(parsed) ? formatCompactNumber(parsed) : label;
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

function PlaceMarker({
  place,
  places,
  pinMode,
  selectedDate,
  isSelected,
  onClearSelectedPlace,
  onSelectPlace,
}: {
  place: Place & { lat: number; lng: number };
  places: Array<Place & { lat: number; lng: number }>;
  pinMode: PinMode;
  selectedDate: string;
  isSelected: boolean;
  onClearSelectedPlace: () => void;
  onSelectPlace: (placeId: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const marker = markerRef.current;

    if (!marker) {
      return;
    }

    if (isSelected) {
      marker.openPopup();
      return;
    }

    marker.closePopup();
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={createMarkerIcon(place, places, pinMode, selectedDate, isSelected)}
      eventHandlers={{
        click: () => onSelectPlace(place.id),
        popupclose: () => {
          if (isSelected) {
            onClearSelectedPlace();
          }
        },
      }}
    >
      <Popup
        className="mapping-place-popup"
        offset={[0, -26]}
        closeButton
        autoPan
      >
        <PlaceMapPopup place={place} selectedDate={selectedDate} />
      </Popup>
    </Marker>
  );
}

function MapViewport({
  places,
  selectedPlaceId,
  selectedPlaceFocusRequest,
  currentLocation,
  locationFocusRequest,
}: {
  places: Array<Place & { lat: number; lng: number }>;
  selectedPlaceId: string | null;
  selectedPlaceFocusRequest: number;
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
    if (!selectedPlaceId || selectedPlaceFocusRequest === 0) {
      return;
    }

    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    if (!selectedPlace) {
      return;
    }

    map.flyTo([selectedPlace.lat, selectedPlace.lng], Math.max(map.getZoom(), 14), {
      duration: 0.45,
    });
  }, [map, places, selectedPlaceFocusRequest, selectedPlaceId]);

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
  selectedPlaceFocusRequest,
  currentLocation,
  locationFocusRequest,
  onClearSelectedPlace,
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
        selectedPlaceId={selectedPlaceId}
        selectedPlaceFocusRequest={selectedPlaceFocusRequest}
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
        <PlaceMarker
          key={place.id}
          place={place}
          places={locatedPlaces}
          pinMode={pinMode}
          selectedDate={selectedDate}
          isSelected={selectedPlaceId === place.id}
          onClearSelectedPlace={onClearSelectedPlace}
          onSelectPlace={onSelectPlace}
        />
      ))}
    </MapContainer>
  );
}
