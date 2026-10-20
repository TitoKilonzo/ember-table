import { isAppwriteConfigured } from "@/lib/appwrite-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "Ember Table Restaurant Commerce",
    mode: isAppwriteConfigured() ? "appwrite" : "demo",
    integrations: {
      appwrite: isAppwriteConfigured(),
      odooBridge: Boolean(process.env.ODOO_BRIDGE_URL && process.env.ODOO_BRIDGE_TOKEN),
      mpesa: false,
    },
    timestamp: new Date().toISOString(),
  });
}
