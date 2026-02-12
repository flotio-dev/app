import { useAuth } from "@/auth/AuthContext";

export function useApi() {
  const { accessToken, setUserAndToken, clearAuth } = useAuth();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  const request = async (input: RequestInfo, init: RequestInit = {}) => {
    if (!apiBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    let token = accessToken;

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

        const data = await refreshRes.json();
        const newToken = data.access_token;
        const meRes = await fetch(`${apiBaseUrl}/auth/@me`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        if (!meRes.ok) throw new Error("Failed to fetch user");
        const me = await meRes.json();

        setUserAndToken(me, newToken);

        res = await fetchWithToken(newToken);
      } catch {
        clearAuth();
        window.location.href = "/auth/login";
        throw new Error("Session expired");
      }
    }

    return res;
  };

  return { request };
}
