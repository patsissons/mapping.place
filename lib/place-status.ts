import { clamp } from "@/lib/utils";
import { DAY_KEYS, type PinMode, type Place } from "@/lib/types";

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function isOpenDuringHours(
  openMinutes: number,
  closeMinutes: number,
  currentMinutes: number,
) {
  if (openMinutes === closeMinutes) {
    return true;
  }

  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

export function isPlaceOpenAt(place: Place, date: Date) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const dayKey = DAY_KEYS[date.getDay()];
  const todayHours = place.hours[dayKey];

  if (todayHours.enabled) {
    const openMinutes = parseTimeToMinutes(todayHours.open);
    const closeMinutes = parseTimeToMinutes(todayHours.close);

    if (
      openMinutes !== null &&
      closeMinutes !== null &&
      isOpenDuringHours(openMinutes, closeMinutes, currentMinutes)
    ) {
      return true;
    }
  }

  const previousDay = new Date(date);
  previousDay.setDate(date.getDate() - 1);
  const previousDayKey = DAY_KEYS[previousDay.getDay()];
  const previousDayHours = place.hours[previousDayKey];

  if (!previousDayHours.enabled) {
    return false;
  }

  const previousOpenMinutes = parseTimeToMinutes(previousDayHours.open);
  const previousCloseMinutes = parseTimeToMinutes(previousDayHours.close);

  if (previousOpenMinutes === null || previousCloseMinutes === null) {
    return false;
  }

  return (
    previousOpenMinutes > previousCloseMinutes &&
    currentMinutes < previousCloseMinutes
  );
}

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

function getMetricRatio(targetValue: number, values: number[]) {
  if (values.length < 2) {
    return 1;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return 1;
  }

  return (targetValue - min) / (max - min);
}

function getReviewRatio(target: Place, places: Place[]) {
  if (places.length < 2) {
    return 1;
  }

  return getMetricRatio(
    target.reviewCount,
    places.map((place) => place.reviewCount),
  );
}

function getRatingRatio(target: Place, places: Place[]) {
  return getMetricRatio(
    target.rating,
    places.map((place) => place.rating),
  );
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
    background: interpolateColor(getRatingRatio(place, places)),
    foreground: "white",
    label: place.rating.toFixed(1),
  };
}
