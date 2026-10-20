import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AppwriteAuthError,
  createEmailSession,
  getAccountForSession,
  getSessionCookieName,
  sessionCookieOptions,
  toAuthUser,
} from "@/lib/auth-server";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });

  try {
    const session = await createEmailSession(parsed.data.email.trim().toLowerCase(), parsed.data.password);
    const account = await getAccountForSession(session.secret);
    const response = NextResponse.json({ user: toAuthUser(account), verificationRequired: !account.emailVerification });
    response.cookies.set(getSessionCookieName(), session.secret, sessionCookieOptions(session.expire));
    return response;
  } catch (error) {
    if (error instanceof AppwriteAuthError && (error.status === 401 || error.status === 400)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    if (error instanceof AppwriteAuthError && error.status === 429) {
      return NextResponse.json({ error: "Too many sign-in attempts. Wait a moment and try again." }, { status: 429 });
    }
    console.error("Appwrite sign-in failed.", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
