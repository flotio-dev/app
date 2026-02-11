"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

type User = {
  id: string
  email: string
  username: string
}

type AuthContextType = {
  user: User | null
  accessToken: string | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bootstrap()
  }, [])

  async function bootstrap() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      setAccessToken(data.access_token)

      const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/@me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }).then(r => r.json())

      setUser(me)
    } catch (e) {
      window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/login`
      console.warn("Not authenticated", e)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
    setAccessToken(null)
    window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/login`
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
