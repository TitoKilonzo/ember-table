import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AppwriteAuthError,
  createAccount,
  createEmailSession,
  getAccountForSession,
  getSessionCookieName,
  sendEmailVerification,
  sessionCookieOptions,
  toAuthUser,
} from "@/lib/auth-server";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your name, a valid email address, and a password of at least 8 characters." }, { status: 400 });
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    await createAccount({ ...parsed.data, email });
    const session = await createEmailSession(email, parsed.data.password);
    const account = await getAccountForSession(session.secret);
    try {
      const verificationUrl = new URL("/verify", process.env.APP_URL ?? request.url).toString();
      await sendEmailVerification(session.secret, verificationUrl);
    } catch (error) {
      console.error("Account was created, but Appwrite could not send the verification email.", error);
      const response = NextResponse.json({
        user: toAuthUser(account),
        accountCreated: true,
        verificationRequired: true,
        verificationSent: false,
        error: "Your account was created, but we could not send the verification email. You can request another from this page.",
      }, { status: 502 });
      response.cookies.set(getSessionCookieName(), session.secret, sessionCookieOptions(session.expire));
      return response;
    }

    const response = NextResponse.json({
      user: toAuthUser(account),
      verificationRequired: true,
      verificationSent: true,
      message: "Your account is ready. Check your email to verify your address before signing in.",
    }, { status: 201 });
    response.cookies.set(getSessionCookieName(), session.secret, sessionCookieOptions(session.expire));
    return response;
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      if (error.status === 409) return NextResponse.json({ error: "An account with that email already exists. Sign in instead." }, { status: 409 });
      if (error.status === 400) return NextResponse.json({ error: "We could not create the account. Check the details and try again." }, { status: 400 });
    }
    console.error("Appwrite account registration failed.", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
