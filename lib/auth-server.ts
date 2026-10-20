import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE = "ember_table_session";
const APPWRITE_SESSION_PREFIX = "a_session_";

type AppwriteAccount = {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
};

type AppwriteSession = {
  secret: string;
  expire: string;
};

export type StaffRole = "admin" | "manager" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: StaffRole;
};

export class AppwriteAuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AppwriteAuthError";
  }
}

export function getAuthConfig() {
  const endpoint = (process.env.APPWRITE_ENDPOINT ?? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)?.replace(/\/$/, "");
  const projectId = process.env.APPWRITE_PROJECT_ID ?? process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) throw new Error("Appwrite authentication is not configured.");
  return { endpoint, projectId };
}

async function appwriteRequest<T>(
  path: string,
  options: { method: string; body?: unknown; sessionSecret?: string },
): Promise<T> {
  const { endpoint, projectId } = getAuthConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": projectId,
  };
  if (options.sessionSecret) {
    headers.Cookie = `${APPWRITE_SESSION_PREFIX}${projectId}=${options.sessionSecret}`;
  }

  const response = await fetch(`${endpoint}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Appwrite returned an invalid response (${response.status}).`);
    }
  }
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      ? data.message
      : `Appwrite request failed (${response.status}).`;
    throw new AppwriteAuthError(response.status, message);
  }
  return data as T;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function createAccount(input: { email: string; name: string; password: string }) {
  return appwriteRequest<AppwriteAccount>("/account", {
    method: "POST",
    body: { userId: crypto.randomUUID(), email: input.email, name: input.name, password: input.password },
  });
}

export async function createEmailSession(email: string, password: string) {
  return appwriteRequest<AppwriteSession>("/account/sessions/email", {
    method: "POST",
    body: { email, password },
  });
}

export async function getAccountForSession(sessionSecret: string) {
  return appwriteRequest<AppwriteAccount>("/account", { method: "GET", sessionSecret });
}

export async function sendEmailVerification(sessionSecret: string, url: string) {
  return appwriteRequest<{ $id: string }>("/account/verification", {
    method: "POST",
    body: { url },
    sessionSecret,
  });
}

export async function confirmEmailVerification(userId: string, secret: string) {
  return appwriteRequest<{ $id: string }>("/account/verification", {
    method: "PUT",
    body: { userId, secret },
  });
}

export async function deleteCurrentSession(sessionSecret: string) {
  return appwriteRequest<void>("/account/sessions/current", { method: "DELETE", sessionSecret });
}

export function getStaffRole(email: string): StaffRole {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === process.env.STAFF_ADMIN_EMAIL?.trim().toLowerCase()) return "admin";
  if (normalizedEmail === process.env.STAFF_MANAGER_EMAIL?.trim().toLowerCase()) return "manager";
  return "customer";
}

export function toAuthUser(account: AppwriteAccount): AuthUser {
  return {
    id: account.$id,
    email: account.email,
    name: account.name,
    emailVerified: account.emailVerification,
    role: getStaffRole(account.email),
  };
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionSecret = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionSecret) return null;

  try {
    const account = await getAccountForSession(sessionSecret);
    return toAuthUser(account);
  } catch (error) {
    if (error instanceof AppwriteAuthError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export function sessionCookieOptions(expiresAt: string) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
