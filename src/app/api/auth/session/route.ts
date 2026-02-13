import { NextRequest, NextResponse } from "next/server";

type SessionRequest = {
  refresh_token?: string;
};

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  let body: SessionRequest;

  try {
    body = (await request.json()) as SessionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const refreshToken = body.refresh_token?.trim();
  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh_token" }, { status: 400 });
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK_SECONDS,
  });

  return response;
}
