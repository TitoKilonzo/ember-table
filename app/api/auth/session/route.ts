import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AppwriteAuthError,
  getAccountForSession,
  getSessionCookieName,
  toAuthUser,
} from "@/lib/auth-server";

export async function GET() {
  const sessionSecret = (await cookies()).get(getSessionCookieName())?.value;
  if (!sessionSecret) return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });

  try {
    const account = await getAccountForSession(sessionSecret);
    return NextResponse.json({ user: toAuthUser(account) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AppwriteAuthError && (error.status === 401 || error.status === 403)) {
      const response = NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
      response.cookies.delete(getSessionCookieName());
      return response;
    }
    console.error("Could not read the current Appwrite session.", error);
    return NextResponse.json({ error: "Could not check your sign-in status." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
