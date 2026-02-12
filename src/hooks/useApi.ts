import { useAuth } from "@/auth/AuthContext"

export function useApi() {
  const { accessToken } = useAuth()

  async function request(
    input: RequestInfo,
    init: RequestInit = {}
  ) {
    let res = await fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (res.status !== 401) return res

    const refresh = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    )

    if (!refresh.ok) {
      window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/login`
      console.warn("Session expired", res)
      throw new Error("Session expired")
    }

    const data = await refresh.json()

    res = await fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    return res
  }

  return { request }
}
