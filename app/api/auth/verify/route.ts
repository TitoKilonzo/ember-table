import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppwriteAuthError, confirmEmailVerification } from "@/lib/auth-server";

const verificationSchema = z.object({
  userId: z.string().min(1).max(36),
  secret: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  const parsed = verificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "This verification link is incomplete or invalid." }, { status: 400 });

  try {
    await confirmEmailVerification(parsed.data.userId, parsed.data.secret);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppwriteAuthError && (error.status === 400 || error.status === 401 || error.status === 404)) {
      return NextResponse.json({ error: "This verification link is invalid or has expired. Request a new one after signing in." }, { status: 400 });
    }
    console.error("Appwrite email verification failed.", error);
    return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 502 });
  }
}
