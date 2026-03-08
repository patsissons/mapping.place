import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function randomByte() {
  if (typeof globalThis.crypto !== "undefined") {
    const array = new Uint8Array(1);

    globalThis.crypto.getRandomValues(array);

    return array[0] ?? 0;
  }

  return Math.floor(Math.random() * 256);
}

function encodeTimePart(time: number, length: number) {
  let value = time;
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output = `${ULID_ALPHABET[value % 32] ?? ULID_ALPHABET[0]}${output}`;
    value = Math.floor(value / 32);
  }

  return output;
}

export function createUlid(time = Date.now()) {
  const timePart = encodeTimePart(time, 10);
  const randomPart = Array.from(
    { length: 16 },
    () => ULID_ALPHABET[randomByte() % 32] ?? ULID_ALPHABET[0],
  ).join("");

  return `${timePart}${randomPart}`;
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}
