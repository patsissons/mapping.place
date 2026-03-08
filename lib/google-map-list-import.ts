import "server-only";

import { createEmptyHours } from "@/lib/place-data";
import { looksLikeGoogleMapsUrl, normalizeGoogleMapsUrl } from "@/lib/google-place";
import { resolveGooglePlaceIdFromTextSearch } from "@/lib/place-hydration";
import { type MapState, type Place } from "@/lib/types";
import { createId, createUlid } from "@/lib/utils";

type GoogleMapListImportResult =
  | {
      ok: true;
      status: 200;
      map: MapState;
      placeCount: number;
      sourceMapId: string;
      sourceMapName: string;
      sourceMapUrl: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

type GoogleMapListPayload = {
  entries: GoogleMapListEntry[];
  name: string;
  emoji?: string;
  listId: string;
  sourceMapUrl: string;
};

type GoogleMapListEntry = {
  address?: string;
  lat?: number;
  lng?: number;
  name: string;
};

type ImportedPlaceReference = Place & {
  placeId: string;
};

type ImportedPlaceResolutionResult =
  | {
      error: string;
    }
  | {
      place: ImportedPlaceReference;
    };

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : undefined;
}

function decodeHtmlAttribute(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripXssiPrefix(value: string) {
  return value.replace(/^\)\]\}'\s*/, "");
}

function buildGooglePlaceTextQuery(entry: GoogleMapListEntry) {
  return [entry.name, entry.address].filter(Boolean).join(", ");
}

function parseGoogleMapListEntry(entry: unknown): GoogleMapListEntry | null {
  const entryArray = getArray(entry);

  if (!entryArray) {
    return null;
  }

  const detail = getArray(entryArray[1]);
  const name = getString(entryArray[2]);

  if (!name) {
    return null;
  }

  const location = getArray(detail?.[5]);
  const lat = getNumber(location?.[2]);
  const lng = getNumber(location?.[3]);
  const address = getString(detail?.[4]) ?? getString(detail?.[2]);

  return {
    name,
    address,
    lat,
    lng,
  };
}

function parseGoogleMapListPayload(
  payload: unknown,
): GoogleMapListPayload | null {
  const root = getArray(payload)?.[0];
  const rootArray = getArray(root);

  if (!rootArray) {
    return null;
  }

  const listInfo = getArray(rootArray[0]);
  const sourceInfo = getArray(rootArray[2]);
  const entries = getArray(rootArray[8]) ?? [];
  const listId = getString(listInfo?.[0]);
  const name = getString(rootArray[4]);
  const sourceMapUrl = getString(sourceInfo?.[2]);

  if (!listId || !name || !sourceMapUrl) {
    return null;
  }

  return {
    entries: entries
      .map(parseGoogleMapListEntry)
      .filter((entry): entry is GoogleMapListEntry => entry !== null),
    name,
    emoji: getString(rootArray[17]),
    listId,
    sourceMapUrl,
  };
}

async function resolveImportedPlaceReferences(
  entries: GoogleMapListEntry[],
): Promise<
  | {
      ok: true;
      places: ImportedPlaceReference[];
    }
  | {
      ok: false;
      error: string;
    }
> {
  const results: ImportedPlaceResolutionResult[] = await Promise.all(
    entries.map(async (entry) => {
      const resolved = await resolveGooglePlaceIdFromTextSearch(
        buildGooglePlaceTextQuery(entry),
        {
          latitude: entry.lat,
          longitude: entry.lng,
        },
      );

      if ("error" in resolved) {
        return {
          error: `${entry.name}: ${resolved.error}`,
        };
      }

      return {
        place: {
          id: createId("place"),
          placeId: resolved.placeId,
          name: `Google place ${resolved.placeId.slice(0, 8)}`,
          rating: 0,
          reviewCount: 0,
          hours: createEmptyHours(),
        } satisfies ImportedPlaceReference,
      };
    }),
  );

  const failures = results.filter(
    (result): result is { error: string } => "error" in result,
  );
  const places = results
    .filter(
      (result): result is { place: ImportedPlaceReference } => "place" in result,
    )
    .map((result) => result.place);

  if (failures.length > 0) {
    return {
      ok: false,
      error:
        failures.length === 1
          ? `Could not resolve a Google Place ID for ${failures[0].error}`
          : `Could not resolve Google Place IDs for ${failures.length} list entries. First failure: ${failures[0].error}`,
    };
  }

  return {
    ok: true,
    places,
  };
}

function extractPreloadedListDataUrl(html: string) {
  const match = html.match(
    /<link href="([^"]*\/maps\/preview\/entitylist\/getlist[^"]*)" as="fetch"/i,
  );

  return match ? decodeHtmlAttribute(match[1]) : null;
}

async function fetchGoogleMapListPayload(
  input: string,
): Promise<GoogleMapListImportResult> {
  if (!looksLikeGoogleMapsUrl(input)) {
    return {
      ok: false,
      status: 400,
      error: "Enter a Google Maps list URL.",
    };
  }

  const normalizedUrl = normalizeGoogleMapsUrl(input);

  if (!normalizedUrl) {
    return {
      ok: false,
      status: 400,
      error: "Could not parse this Google Maps URL.",
    };
  }

  try {
    const response = await fetch(normalizedUrl.toString(), {
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        error: `Google Maps returned status ${response.status}.`,
      };
    }

    const html = await response.text();
    const listDataPath = extractPreloadedListDataUrl(html);

    if (!listDataPath) {
      return {
        ok: false,
        status: 422,
        error: "Could not find list data in that Google Maps page.",
      };
    }

    const listDataUrl = new URL(listDataPath, response.url);
    const listResponse = await fetch(listDataUrl, {
      cache: "no-store",
    });

    if (!listResponse.ok) {
      return {
        ok: false,
        status: 502,
        error: `Google Maps list lookup failed with status ${listResponse.status}.`,
      };
    }

    const rawPayload = stripXssiPrefix(await listResponse.text());
    const parsedPayload = parseGoogleMapListPayload(JSON.parse(rawPayload));

    if (!parsedPayload) {
      return {
        ok: false,
        status: 422,
        error: "Could not parse that Google Maps list.",
      };
    }

    const resolvedPlaces = await resolveImportedPlaceReferences(
      parsedPayload.entries,
    );

    if (!resolvedPlaces.ok) {
      return {
        ok: false,
        status: 422,
        error: resolvedPlaces.error,
      };
    }

    if (resolvedPlaces.places.length === 0) {
      return {
        ok: false,
        status: 422,
        error: "That Google Maps list did not expose any places to import.",
      };
    }

    return {
      ok: true,
      status: 200,
      map: {
        mapId: createUlid(),
        mapName: parsedPayload.name,
        mapEmoji: parsedPayload.emoji,
        places: resolvedPlaces.places,
      },
      placeCount: resolvedPlaces.places.length,
      sourceMapId: parsedPayload.listId,
      sourceMapName: parsedPayload.name,
      sourceMapUrl: parsedPayload.sourceMapUrl,
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error
          ? error.message
          : "Could not import that Google Maps list.",
    };
  }
}

export async function importGoogleMapList(
  input: string,
): Promise<GoogleMapListImportResult> {
  return fetchGoogleMapListPayload(input.trim());
}
