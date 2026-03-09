import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import { getAppAuthSecret } from "@/lib/app-auth";

const MAP_STATE_PARAM = "m";

function readCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

export default withAuth(
  (request) => {
    const isAuthenticated = Boolean(request.nextauth.token);
    const isLoginRoute = request.nextUrl.pathname === "/login";
    const isPublicHomeRoute =
      request.nextUrl.pathname === "/" &&
      !request.nextUrl.searchParams.has(MAP_STATE_PARAM);

    if (isLoginRoute) {
      if (isAuthenticated) {
        return NextResponse.redirect(
          new URL(
            readCallbackUrl(request.nextUrl.searchParams.get("callbackUrl")),
            request.url,
          ),
        );
      }

      return NextResponse.next();
    }

    if (isPublicHomeRoute) {
      return NextResponse.next();
    }

    if (isAuthenticated) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    if (callbackUrl && callbackUrl !== "/login") {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }

    return NextResponse.redirect(loginUrl);
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname === "/login") {
          return true;
        }

        if (
          req.nextUrl.pathname === "/" &&
          !req.nextUrl.searchParams.has(MAP_STATE_PARAM)
        ) {
          return true;
        }

        return Boolean(token);
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: getAppAuthSecret(),
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)",
  ],
};
