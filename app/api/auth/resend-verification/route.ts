import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AppwriteAuthError,
  getAccountForSession,
  getSessionCookieName,
  sendEmailVerification,
} from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const sessionSecret = (await cookies()).get(getSessionCookieName())?.value;
  if (!sessionSecret) return NextResponse.json({ error: "Sign in to request a verification email." }, { status: 401 });

  try {
    const account = await getAccountForSession(sessionSecret);
    if (account.emailVerification) return NextResponse.json({ error: "This email address is already verified." }, { status: 409 });
    const verificationUrl = new URL("/verify", process.env.APP_URL ?? request.url).toString();
    await sendEmailVerification(sessionSecret, verificationUrl);
    return NextResponse.json({ ok: true, message: "A new verification email has been sent." });
  } catch (error) {
    if (error instanceof AppwriteAuthError && (error.status === 401 || error.status === 403)) {
      return NextResponse.json({ error: "Your sign-in has expired. Sign in again to request a verification email." }, { status: 401 });
    }
    if (error instanceof AppwriteAuthError && error.status === 429) {
      return NextResponse.json({ error: "Too many requests. Wait a moment before requesting another email." }, { status: 429 });
    }
    console.error("Appwrite could not resend the verification email.", error);
    return NextResponse.json({ error: "We could not send the verification email. Please try again." }, { status: 502 });
  }
}
