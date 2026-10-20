import { Account, Client } from "appwrite";

/** Browser client for Appwrite Auth and other user-scoped features. Never place an API key here. */
export function getAppwriteBrowserClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return null;
  return new Client().setEndpoint(endpoint).setProject(projectId);
}

export function getAppwriteAccount() {
  const client = getAppwriteBrowserClient();
  return client ? new Account(client) : null;
}
