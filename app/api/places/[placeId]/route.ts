import { type NextRequest, NextResponse } from "next/server";

import { createEmptyHours } from "@/lib/place-data";
import { isGooglePlaceId } from "@/lib/google-place";
import { hydrateGooglePlaceReference } from "@/lib/place-hydration";

function isAllowedHydrationRequest(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  const clientHeader = request.headers.get("x-mapping-place-client");
  const secFetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (clientHeader !== "web") {
    return false;
  }

  if (
    secFetchSite &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "same-site" &&
    secFetchSite !== "none"
  ) {
    return false;
  }

  if (origin && origin !== expectedOrigin) {
    return false;
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  if (!isAllowedHydrationRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { placeId } = await params;

  if (!isGooglePlaceId(placeId)) {
    return NextResponse.json({ error: "Invalid Google Place ID." }, { status: 400 });
  }

  const result = await hydrateGooglePlaceReference({
    id: placeId,
    placeId,
    name: `Google place ${placeId.slice(0, 8)}`,
    rating: 0,
    reviewCount: 0,
    hours: createEmptyHours(),
  });

  return NextResponse.json(
    {
      error: result.error,
      place: result.place,
    },
    {
      status: result.ok ? 200 : result.status,
      headers: {
        "Cache-Control": result.ok
          ? "private, max-age=3600, stale-while-revalidate=86400"
          : "no-store",
      },
    },
  );
}
