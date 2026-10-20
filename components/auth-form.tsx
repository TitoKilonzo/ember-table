"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type AuthUser = { role: "admin" | "manager" | "customer"; emailVerified: boolean };
type AuthResponse = { user?: AuthUser; error?: string; message?: string; verificationRequired?: boolean; verificationSent?: boolean };

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const result = await response.json() as AuthResponse;
      if (isRegister) {
        if (response.status !== 201 && !result.user) throw new Error(result.error ?? "We could not create your account.");
        setVerificationPending(true);
        if (result.verificationSent) {
          setMessage("Your account is ready. Check your inbox for a verification link before signing in.");
        } else {
          setError(result.error ?? "Your account was created, but we could not send a verification email.");
        }
        return;
      }
      if (!response.ok || !result.user) throw new Error(result.error ?? "We could not sign you in.");
      if (result.verificationRequired || !result.user.emailVerified) {
        setVerificationPending(true);
        setMessage("Verify your email address before using your account.");
        return;
      }
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const next = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      if (next.startsWith("/admin") && result.user.role === "customer") {
        setError("This account does not have staff access. Contact Ember Table if you need a staff account.");
        return;
      }
      window.location.assign(next);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const result = await response.json() as AuthResponse;
      if (!response.ok) throw new Error(result.error ?? "We could not send a verification email.");
      setMessage(result.message ?? "A new verification email has been sent.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "We could not send a verification email.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="min-h-screen bg-vanilla px-4 py-8 text-ink sm:px-6 sm:py-12">
    <div className="mx-auto max-w-[1040px]">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Ember Table home">
          <Image src="/brand-mark.svg" width={40} height={40} alt="" />
          <span className="display-wordmark text-2xl font-bold">ember table</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 transition hover:text-ember">Back home</Link>
      </div>

      <div className="mx-auto mt-12 grid max-w-[880px] overflow-hidden rounded-[2rem] border border-black/[.07] bg-paper shadow-soft md:mt-16 md:grid-cols-[.85fr_1fr]">
        <div className="hidden flex-col justify-between bg-[#2C2923] p-9 text-vanilla md:flex">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#E8A17F]">Ember Table</p><h1 className="serif-title mt-6 text-5xl leading-[1.02]">{isRegister ? "Good food starts here." : "Welcome back."}</h1><p className="mt-5 text-sm leading-7 text-white/65">Sign in to your account, or create one to keep in touch with Ember Table.</p></div>
          <p className="text-xs text-white/50">Westlands · Open 24 hours</p>
        </div>

        <section className="p-6 sm:p-9">
          <p className="eyebrow">{isRegister ? "Create an account" : "Your account"}</p>
          <h2 className="serif-title mt-3 text-4xl">{isRegister ? "Register." : "Sign in."}</h2>
          <p className="mt-2 text-sm text-stone-500">{isRegister ? "Create an Ember Table customer account." : "Enter your email and password to continue."}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isRegister && <label className="block text-xs font-semibold text-stone-600">Full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember" /></label>}
            <label className="block text-xs font-semibold text-stone-600">Email address<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember" /></label>
            <label className="block text-xs font-semibold text-stone-600">Password<input required type="password" minLength={isRegister ? 8 : 1} maxLength={128} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember" />{isRegister && <span className="mt-1.5 block text-[11px] font-normal text-stone-400">Use at least 8 characters.</span>}</label>
            {message && <p role="status" className="rounded-xl bg-[#E7EBD8] px-4 py-3 text-sm leading-6 text-[#53633A]">{message}</p>}
            {error && <p role="alert" className="rounded-xl bg-[#F9E4D8] px-4 py-3 text-sm leading-6 text-[#A44824]">{error}</p>}
            <button type="submit" disabled={busy} className="button-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">{busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}</button>
            {verificationPending && <button type="button" disabled={busy} onClick={resendVerification} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-stone-600 transition hover:border-ember hover:text-ember disabled:opacity-60">Send verification email again</button>}
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isRegister ? "Already have an account? " : "New to Ember Table? "}
            <Link href={isRegister ? "/login" : "/register"} className="font-bold text-ember hover:underline">{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
          <p className="mt-4 text-center text-xs text-stone-400">Need help? <Link href="/contact" className="font-semibold text-stone-600 hover:text-ember">Contact us</Link></p>
        </section>
      </div>
    </div>
  </main>;
}
