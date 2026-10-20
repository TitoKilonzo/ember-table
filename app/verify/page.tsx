"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [message, setMessage] = useState("Check your inbox for a verification link from Ember Table.");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const secret = params.get("secret");
    if (!userId || !secret) return;

    window.history.replaceState({}, "", "/verify");
    setChecking(true);
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, secret }),
    }).then(async (response) => {
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We could not verify your email.");
      setMessage("Your email is verified. You can now sign in.");
    }).catch((verificationError: unknown) => {
      setError(verificationError instanceof Error ? verificationError.message : "We could not verify your email.");
    }).finally(() => setChecking(false));
  }, []);

  return <main className="min-h-screen bg-vanilla px-4 py-8 text-ink sm:px-6 sm:py-12">
    <div className="mx-auto max-w-[720px]">
      <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Ember Table home"><Image src="/brand-mark.svg" width={40} height={40} alt="" /><span className="display-wordmark text-2xl font-bold">ember table</span></Link>
      <section className="mt-16 rounded-[2rem] border border-black/[.07] bg-paper p-7 text-center shadow-soft sm:mt-20 sm:p-12">
        <p className="eyebrow">Email verification</p>
        <h1 className="serif-title mt-3 text-4xl">Check your email.</h1>
        <p role={error ? "alert" : "status"} className={`mx-auto mt-4 max-w-md text-sm leading-6 ${error ? "text-[#A44824]" : "text-stone-500"}`}>{checking ? "Verifying your email address..." : error || message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/login" className="button-primary">Go to sign in</Link><Link href="/" className="button-secondary">Back home</Link></div>
        <p className="mt-6 text-xs text-stone-400">If you did not receive the message, sign in and request another verification email.</p>
      </section>
    </div>
  </main>;
}
