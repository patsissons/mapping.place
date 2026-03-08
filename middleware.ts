import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import { getAppAuthSecret } from "@/lib/app-auth";

export default withAuth(
  (request) => {
    const isAuthenticated = Boolean(request.nextauth.token);
    const isLoginRoute = request.nextUrl.pathname === "/login";

    if (isLoginRoute) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }

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
