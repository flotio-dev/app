import { useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
};

export function useApi() {
  const { accessToken, setUserAndToken, clearAuth } = useAuth();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  const request = useCallback(async (input: RequestInfo, init: RequestInit = {}) => {
    if (!apiBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const token = accessToken;

    const fetchWithToken = async (t: string | null) =>
      fetch(input, {
        ...init,
        headers: { ...init.headers, Authorization: t ? `Bearer ${t}` : "" },
        credentials: "include",
      });

    let res = await fetchWithToken(token);

    if (res.status === 401) {
      try {
        const refreshRes = await fetch(`${apiBaseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) throw new Error("Unauthorized");

        const data = (await refreshRes.json()) as RefreshResponse;
        const newToken = data.access_token;
        if (!newToken) {
          throw new Error("Unauthorized");
        }

        if (data.refresh_token) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: data.refresh_token }),
          });
        }

        const meRes = await fetch(`${apiBaseUrl}/auth/@me`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        if (!meRes.ok) throw new Error("Failed to fetch user");
        const me = await meRes.json();

        setUserAndToken(me, newToken);

        res = await fetchWithToken(newToken);
      } catch {
        clearAuth();
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // Ignore logout failures and continue redirect.
        }
        window.location.href = "/auth/login";
        throw new Error("Session expired");
      }
    }

    return res;
  }, [accessToken, apiBaseUrl, clearAuth, setUserAndToken]);

  return { request };
}
