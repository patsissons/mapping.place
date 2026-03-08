import { type NextRequest, NextResponse } from "next/server";

import { createEmptyHours } from "@/lib/place-data";
import { getAppSession } from "@/lib/auth-session";
import { isAllowedInternalAppRequest } from "@/lib/internal-api";
import {
  hydrateGooglePlaceReference,
  resolveGooglePlaceInput,
} from "@/lib/place-hydration";

type ResolvePlaceRequestBody = {
  input?: string;
};

export async function POST(request: NextRequest) {
  const session = await getAppSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isAllowedInternalAppRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: ResolvePlaceRequestBody;

  try {
    body = (await request.json()) as ResolvePlaceRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = body.input?.trim();

  if (!input) {
    return NextResponse.json({ error: "Input is required." }, { status: 400 });
  }

  const resolved = await resolveGooglePlaceInput(input);

  if (resolved.kind === "unsupported") {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const hydrated = await hydrateGooglePlaceReference({
    id: resolved.placeId,
    placeId: resolved.placeId,
    sourceUrl: resolved.sourceUrl,
    name: `Google place ${resolved.placeId.slice(0, 8)}`,
    rating: 0,
    reviewCount: 0,
    hours: createEmptyHours(),
  });

  return NextResponse.json(
    {
      error: hydrated.error,
      inputType: resolved.kind,
      placeId: resolved.placeId,
      place: hydrated.place,
    },
    {
      status: hydrated.ok ? 200 : hydrated.status,
      headers: {
        "Cache-Control": hydrated.ok
          ? "private, max-age=3600, stale-while-revalidate=86400"
          : "no-store",
      },
    },
  );
}
