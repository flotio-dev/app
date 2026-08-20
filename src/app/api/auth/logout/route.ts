import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

/**
 * Frontend-internal logout route (§4.6 exception 2). The backend call goes
 * through the client's server-safe `auth.revokeSession(refreshToken)` helper
 * (A-11) — no raw base-URL endpoint literal remains.
 */
export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured" },
      { status: 500 }
    );
  }

  const client = createApiClient({
    baseUrl,
    getAccessToken: () => null,
    onTokensRefreshed: () => {},
    onSessionExpired: () => {},
  });

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value ?? "";

  try {
    await client.auth.revokeSession(refreshToken);
  } catch {
    // Continue local logout flow even if the API is unreachable.
  }

  const response = NextResponse.json({ status: "logged_out" });
  response.cookies.set({
    name: "refresh_token",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  response.cookies.set({
    name: "flotio_logged_in",
    value: "",
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return response;
}
