import { type NextRequest, NextResponse } from "next/server";

import { isAllowedInternalAppRequest } from "@/lib/internal-api";
import { importGoogleMapList } from "@/lib/google-map-list-import";
import { buildMapStateUrl } from "@/lib/url-state";

type ImportGoogleListRequestBody = {
  url?: string;
};

export async function POST(request: NextRequest) {
  if (!isAllowedInternalAppRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: ImportGoogleListRequestBody;

  try {
    body = (await request.json()) as ImportGoogleListRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = body.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  const imported = await importGoogleMapList(url);

  if (!imported.ok) {
    return NextResponse.json({ error: imported.error }, { status: imported.status });
  }

  const mapUrl = await buildMapStateUrl(
    request.nextUrl.origin,
    imported.map.mapId,
    imported.map.mapName,
    imported.map.places,
    imported.map.mapEmoji,
  );

  return NextResponse.json(
    {
      map: imported.map,
      mapUrl,
      placeCount: imported.placeCount,
      sourceMapId: imported.sourceMapId,
      sourceMapName: imported.sourceMapName,
      sourceMapUrl: imported.sourceMapUrl,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
