import { type NextRequest } from "next/server";

export function isAllowedInternalAppRequest(request: NextRequest) {
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
