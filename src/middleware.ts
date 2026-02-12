import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = new Set(["/auth/login", "/auth/register"]);

const isProtectedRoute = (pathname: string) => {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/new-project") ||
    pathname.startsWith("/preferences") ||
    pathname.startsWith("/github")
  );
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = Boolean(request.cookies.get("refresh_token")?.value);

  if (pathname === "/") {
    const targetUrl = new URL(hasRefreshToken ? "/dashboard" : "/auth/login", request.url);
    return NextResponse.redirect(targetUrl);
  }

  if (!hasRefreshToken && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasRefreshToken && AUTH_ROUTES.has(pathname)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
