import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteCurrentSession,
  getSessionCookieName,
} from "@/lib/auth-server";

export async function POST() {
  const sessionSecret = (await cookies()).get(getSessionCookieName())?.value;
  if (sessionSecret) {
    try {
      await deleteCurrentSession(sessionSecret);
    } catch (error) {
      console.error("Could not revoke the Appwrite session during sign-out.", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getSessionCookieName());
  return response;
}
