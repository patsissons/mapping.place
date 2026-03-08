import { clamp } from "@/lib/utils";
import { DAY_KEYS, type PinMode, type Place } from "@/lib/types";

export function getPlaceStatus(place: Place, selectedDate: string) {
  const date = new Date(`${selectedDate}T12:00:00`);
  const dayKey = DAY_KEYS[date.getDay()];
  const hours = place.hours[dayKey];

  if (!hours.enabled) {
    return {
      isOpen: false,
      label: "Closed",
      detail: "Closed all day",
    };
  }

  return {
    isOpen: true,
    label: "Open",
    detail: `${hours.open} - ${hours.close}`,
  };
}

function interpolateChannel(from: number, to: number, ratio: number) {
  return Math.round(from + (to - from) * ratio);
}

function interpolateColor(ratio: number) {
  const safeRatio = clamp(ratio, 0, 1);
  const red = [225, 74, 74];
  const green = [55, 178, 77];

  const mixed = red.map((channel, index) =>
    interpolateChannel(channel, green[index] ?? channel, safeRatio),
  );

  return `rgb(${mixed[0]} ${mixed[1]} ${mixed[2]})`;
}

function getReviewRatio(target: Place, places: Place[]) {
  if (places.length < 2) {
    return 1;
  }

  const counts = places.map((place) => place.reviewCount);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  if (min === max) {
    return 1;
  }

  return (target.reviewCount - min) / (max - min);
}

export function getPinAppearance(
  place: Place,
  places: Place[],
  pinMode: PinMode,
  selectedDate: string,
) {
  if (pinMode === "status") {
    const status = getPlaceStatus(place, selectedDate);

    return {
      background: status.isOpen ? "rgb(59 130 246)" : "rgb(107 114 128)",
      foreground: "white",
      label: status.isOpen ? "OPEN" : "CLOSED",
    };
  }

  if (pinMode === "reviews") {
    return {
      background: interpolateColor(getReviewRatio(place, places)),
      foreground: "white",
      label: `${place.reviewCount}`,
    };
  }

  return {
    background: interpolateColor((clamp(place.rating, 1, 5) - 1) / 4),
    foreground: "white",
    label: place.rating.toFixed(1),
  };
}
