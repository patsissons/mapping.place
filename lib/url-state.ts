import { createEmptyHours } from "@/lib/place-data";
import { createId } from "@/lib/utils";
import { type MapState, type Place } from "@/lib/types";

type LegacyEncodedPlace = {
  i: string;
  n: string;
  r: number;
  v: number;
  h: Place["hours"];
  a?: number;
  o?: number;
  p?: string;
  d?: string;
  t?: string;
  u?: string;
};

type LegacyEncodedMapPayload = {
  i?: string;
  n: string;
  p: LegacyEncodedPlace[];
};

type EncodedPlaceReference = {
  placeId: string;
};

type EncodedMapPayload = {
  mapId?: string;
  mapName: string;
  places: EncodedPlaceReference[];
};

type CompactEncodedPlaceReference = {
  p: string;
};

type CompactEncodedMapPayload = {
  v: 2;
  i?: string;
  n: string;
  p: CompactEncodedPlaceReference[];
};

export const MAP_STATE_PARAM = "m";
const MAP_STATE_COMPRESSION_FORMAT = "deflate";
const COMPRESSED_MAP_STATE_VERSION = 1;
const COMPACT_MAP_STATE_VERSION = "3";
const COMPACT_MAP_STATE_SEPARATOR = "|";

function encodeBase64UrlBytes(value: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  let binary = "";

  for (let index = 0; index < value.length; index += 0x8000) {
    binary += String.fromCharCode(...value.subarray(index, index + 0x8000));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64UrlBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeBase64UrlText(value: string) {
  return new TextDecoder().decode(decodeBase64UrlBytes(value));
}

function decodeCompactField(value: string | undefined) {
  return decodeURIComponent(value ?? "");
}

function createPlaceholderPlace(placeId: string): Place {
  return {
    id: createId("place"),
    placeId,
    name: `Google place ${placeId.slice(0, 8)}`,
    rating: 0,
    reviewCount: 0,
    hours: createEmptyHours(),
  };
}

function packPayload(
  mapId: string,
  mapName: string,
  places: Place[],
): EncodedMapPayload {
  return {
    mapId,
    mapName,
    places: places
      .filter(
        (place) =>
          typeof place.placeId === "string" && place.placeId.length > 0,
      )
      .map((place) => ({
        placeId: place.placeId!,
      })),
  };
}

function unpackPayload(payload: EncodedMapPayload): MapState {
  return {
    mapId: payload.mapId ?? "",
    mapName: payload.mapName,
    places: payload.places
      .filter(
        (place): place is EncodedPlaceReference =>
          typeof place.placeId === "string" && place.placeId.length > 0,
      )
      .map((place) => createPlaceholderPlace(place.placeId)),
  };
}

function isCompactPayload(
  payload:
    | EncodedMapPayload
    | CompactEncodedMapPayload
    | LegacyEncodedMapPayload,
): payload is CompactEncodedMapPayload {
  return "v" in payload && payload.v === 2;
}

function isCurrentPayload(
  payload:
    | EncodedMapPayload
    | CompactEncodedMapPayload
    | LegacyEncodedMapPayload,
): payload is EncodedMapPayload {
  return "mapName" in payload && "places" in payload;
}

function normalizeCompactPayload(
  payload: CompactEncodedMapPayload,
): EncodedMapPayload {
  return {
    mapId: payload.i,
    mapName: payload.n,
    places: payload.p
      .filter((place) => typeof place.p === "string" && place.p.length > 0)
      .map((place) => ({
        placeId: place.p,
      })),
  };
}

function normalizeCurrentPayload(
  payload: EncodedMapPayload,
): EncodedMapPayload {
  return {
    mapId: payload.mapId,
    mapName: payload.mapName,
    places: payload.places.filter(
      (place): place is EncodedPlaceReference =>
        typeof place.placeId === "string" && place.placeId.length > 0,
    ),
  };
}

function normalizeLegacyPayload(
  payload: LegacyEncodedMapPayload,
): EncodedMapPayload {
  return {
    mapId: payload.i,
    mapName: payload.n,
    places: payload.p
      .filter((place) => typeof place.p === "string" && place.p.length > 0)
      .map((place) => ({
        placeId: place.p!,
      })),
  };
}

function normalizeParsedPayload(
  payload:
    | EncodedMapPayload
    | CompactEncodedMapPayload
    | LegacyEncodedMapPayload,
): EncodedMapPayload {
  if (isCurrentPayload(payload)) {
    return normalizeCurrentPayload(payload);
  }

  if (isCompactPayload(payload)) {
    return normalizeCompactPayload(payload);
  }

  return normalizeLegacyPayload(payload);
}

function parseCompactMapPayload(encoded: string): EncodedMapPayload | null {
  const [version, rawMapId = "", rawMapName = "", ...rawPlaceIds] = encoded.split(
    COMPACT_MAP_STATE_SEPARATOR,
  );

  if (version !== COMPACT_MAP_STATE_VERSION) {
    return null;
  }

  return {
    mapId: decodeCompactField(rawMapId),
    mapName: decodeCompactField(rawMapName),
    places: rawPlaceIds
      .map((placeId) => ({
        placeId: decodeCompactField(placeId),
      }))
      .filter((place) => place.placeId.length > 0),
  };
}

function parseJsonMapPayload(encoded: string) {
  const decoded = decodeURIComponent(decodeBase64UrlText(encoded));

  return JSON.parse(decoded) as
    | EncodedMapPayload
    | CompactEncodedMapPayload
    | LegacyEncodedMapPayload;
}

async function transformBytes(
  value: Uint8Array,
  transformer: CompressionStream | DecompressionStream,
) {
  const copiedValue = Uint8Array.from(value);
  const stream = new Blob([copiedValue.buffer]).stream().pipeThrough(transformer);

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function compressText(value: string) {
  const compressed = await transformBytes(
    new TextEncoder().encode(value),
    new CompressionStream(MAP_STATE_COMPRESSION_FORMAT),
  );
  const versioned = new Uint8Array(compressed.length + 1);

  versioned[0] = COMPRESSED_MAP_STATE_VERSION;
  versioned.set(compressed, 1);

  return encodeBase64UrlBytes(versioned);
}

async function tryParseCompressedMapPayload(encoded: string) {
  const bytes = decodeBase64UrlBytes(encoded);

  if (bytes[0] !== COMPRESSED_MAP_STATE_VERSION) {
    return null;
  }

  const decompressed = await transformBytes(
    bytes.subarray(1),
    new DecompressionStream(MAP_STATE_COMPRESSION_FORMAT),
  );
  const parsed = JSON.parse(new TextDecoder().decode(decompressed)) as
    | EncodedMapPayload
    | CompactEncodedMapPayload
    | LegacyEncodedMapPayload;

  return normalizeParsedPayload(parsed);
}

export async function decodeMapPayloadParam(encoded: string) {
  const compactPayload = parseCompactMapPayload(encoded);

  if (compactPayload) {
    return compactPayload;
  }

  try {
    if (
      typeof CompressionStream === "function" &&
      typeof DecompressionStream === "function"
    ) {
      const compressedPayload = await tryParseCompressedMapPayload(encoded);

      if (compressedPayload) {
        return compressedPayload;
      }
    }

    return normalizeParsedPayload(parseJsonMapPayload(encoded));
  } catch {
    return null;
  }
}

export async function decodeMapStateParam(encoded: string) {
  const payload = await decodeMapPayloadParam(encoded);

  if (!payload) {
    return null;
  }

  return unpackPayload(payload);
}

export async function readMapStateFromSearchParams(
  searchParams: URLSearchParams,
) {
  const encoded = searchParams.get(MAP_STATE_PARAM);

  if (!encoded) {
    return null;
  }

  return decodeMapStateParam(encoded);
}

export function readMapStateFromUrl(searchParams: URLSearchParams) {
  return readMapStateFromSearchParams(searchParams);
}

export async function readMapPayloadFromUrl(searchParams: URLSearchParams) {
  const encoded = searchParams.get(MAP_STATE_PARAM);

  if (!encoded) {
    return null;
  }

  return decodeMapPayloadParam(encoded);
}

export async function buildMapStateUrl(
  href: string,
  mapId: string,
  mapName: string,
  places: Place[],
) {
  const payload = packPayload(mapId, mapName, places);
  const serializedPayload =
    typeof CompressionStream === "function"
      ? await compressText(JSON.stringify(payload))
      : encodeBase64UrlBytes(
          new TextEncoder().encode(
            encodeURIComponent(JSON.stringify(payload)),
          ),
        );
  const url = new URL(href);

  url.searchParams.set(MAP_STATE_PARAM, serializedPayload);

  return url.toString();
}

export async function writeMapStateToUrl(
  mapId: string,
  mapName: string,
  places: Place[],
) {
  const nextUrl = await buildMapStateUrl(
    window.location.href,
    mapId,
    mapName,
    places,
  );
  const url = new URL(nextUrl);

  window.history.replaceState({}, "", url);

  return url.toString();
}

export function clearMapStateFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete(MAP_STATE_PARAM);
  window.history.replaceState({}, "", url);

  return url.toString();
}
