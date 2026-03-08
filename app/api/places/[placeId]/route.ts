import { type NextRequest, NextResponse } from "next/server";

import { createEmptyHours } from "@/lib/place-data";
import { getAppSession } from "@/lib/auth-session";
import { isGooglePlaceId } from "@/lib/google-place";
import { isAllowedInternalAppRequest } from "@/lib/internal-api";
import { hydrateGooglePlaceReference } from "@/lib/place-hydration";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const session = await getAppSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isAllowedInternalAppRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { placeId } = await params;

  if (!isGooglePlaceId(placeId)) {
    return NextResponse.json(
      { error: "Invalid Google Place ID." },
      { status: 400 },
    );
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
