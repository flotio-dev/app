import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value ?? "";

  try {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Continue local logout flow even if API is unreachable.
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

  return response;
}
