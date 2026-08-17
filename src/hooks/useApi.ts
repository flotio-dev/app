/**
 * React adapter for the typed API client (contract §4.1 / §4.5, FC-8/FC-15).
 *
 * Constructs the client with useMemo, wired to AuthContext:
 *  - `getAccessToken`   → current access token (the client is recreated when
 *    the token rotates, so the accessor is never stale).
 *  - `onTokensRefreshed` → persist the rotated refresh token via
 *    `POST /api/auth/session` (mirrors the legacy useApi flow) and store the
 *    new access token in AuthContext. The client core already re-synced
 *    `GET /auth/@me` before invoking this callback (FC-16 sequencing).
 *  - `onSessionExpired` → clear auth and redirect to /auth/login (the client
 *    core fires the internal POST /api/auth/logout itself).
 *
 * The legacy `request(url, init)` is retired; call sites use the typed
 * `client` families only.
 */
"use client";

import { useMemo } from "react";
import { useAuth } from "@/auth/AuthContext";
import { createApiClient } from "@/lib/api/client";
import type { ApiClient, UserResponse } from "@/lib/api/types";

/** §4.6 exception literal — frontend-internal session persistence route. */
const SESSION_ENDPOINT = "/api/auth/session";

/** AuthContext stores the user id as string; UserResponse.id is integer (A-3). */
export function userFromResponse(me: UserResponse): { id: string; email: string; username: string } {
  return {
    id: String(me.id ?? ""),
    email: me.email ?? "",
    username: me.username ?? "",
  };
}

/**
 * Shared helper for the internal logout route (§4.6 exception 1) — used by
 * SideMenu / CliTerminal logout handlers so no raw route string leaks there.
 */
export async function clearLocalSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Keep client-side logout behavior even if the route call fails.
  }
}

/** Persist the rotated refresh token as the httpOnly session cookie (FC-16). */
export async function persistSession(refreshToken: string): Promise<void> {
  await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function useApi(): { client: ApiClient } {
  const { accessToken, setUserAndToken, setAccessToken, clearAuth } = useAuth();

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
        getAccessToken: () => accessToken,
        onTokensRefreshed: async (newAccessToken: string, refreshToken?: string) => {
          // The client core already persisted the rotated refresh token and
          // re-synced @me before calling us; keep the session cookie + auth
          // state in lockstep (FC-16 sequencing is enforced at the client level).
          if (refreshToken) {
            try {
              await persistSession(refreshToken);
            } catch {
              // Non-fatal: the cookie may already be set by the client core.
            }
          }
          setAccessToken(newAccessToken);
        },
        onSessionExpired: () => {
          clearAuth();
          window.location.assign("/auth/login");
        },
      }),
    // Recreate the client when the access token rotates so getAccessToken is
    // never stale; onTokensRefreshed/onSessionExpired come from AuthContext.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, setUserAndToken, clearAuth]
  );

  return { client };
}
