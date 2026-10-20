import { createHash } from "node:crypto";
import { menuItems } from "@/lib/menu";
import { createOrderSchema } from "@/lib/order-schema";
import { isAppwriteConfigured, persistOrder, updatePersistedOrderIntegration, type StoredOrder } from "@/lib/appwrite-server";
import { syncOrderToOdoo } from "@/lib/odoo-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELIVERY_FEE = 180;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check your order details.", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const input = parsed.data;

  // This build intentionally does not fake a live M-Pesa payment.
  if (input.paymentMethod === "mpesa") {
    return Response.json({ error: "M-Pesa is not configured yet. Choose pay on pickup, or configure and test the Daraja payment flow before enabling it." }, { status: 501 });
  }

  const byId = new Map(menuItems.map((item) => [item.id, item]));
  const lineItems: StoredOrder["items"] = [];
  for (const requested of input.items) {
    const item = byId.get(requested.id);
    if (!item || !item.isAvailable) {
      return Response.json({ error: `One of the items in your cart is no longer available. Please refresh the menu.` }, { status: 409 });
    }
    lineItems.push({ id: item.id, name: item.name, quantity: requested.quantity, unitPrice: item.price, odooProductId: item.odooProductId });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = input.fulfilmentType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const stableId = createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 30);
  const orderNumber = `ET-${stableId.slice(0, 10).toUpperCase()}`;
  const now = new Date().toISOString();

  const bridgeConfigured = Boolean(process.env.ODOO_BRIDGE_URL && process.env.ODOO_BRIDGE_TOKEN);
  const order: StoredOrder = {
    orderNumber,
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    customerEmail: input.customer.email ?? "",
    fulfilmentType: input.fulfilmentType,
    paymentMethod: input.paymentMethod,
    paymentStatus: "unpaid",
    status: "received",
    address: input.fulfilmentType === "delivery" ? input.address ?? "" : "",
    instructions: input.instructions ?? "",
    items: lineItems,
    subtotal,
    deliveryFee,
    total,
    integrationStatus: bridgeConfigured ? "pending" : "not_configured",
    odooOrderId: "",
    odooSyncMessage: bridgeConfigured ? "Waiting for Odoo bridge" : "Odoo bridge is not configured",
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
  };

  try {
    const persistence = await persistOrder(input, order);
    if ("duplicate" in persistence && persistence.duplicate) {
      // Safe retry: the bridge must enforce external_order_id uniqueness, so a replay can
      // recover from a request that saved the row but failed before finishing POS sync.
      const replayOdoo = await syncOrderToOdoo(order);
      if (replayOdoo.configured) {
        try {
          await updatePersistedOrderIntegration(persistence.rowId ?? order.orderNumber.toLowerCase(), {
            integrationStatus: replayOdoo.synced ? "synced" : "failed",
            odooOrderId: replayOdoo.externalOrderId ?? "",
            odooSyncMessage: replayOdoo.message.slice(0, 500),
          });
        } catch (statusError) {
          console.error("Could not update Odoo sync state on idempotent replay", statusError);
        }
      }
      return Response.json({
        ok: true,
        order: { orderNumber, total, status: "received", fulfilmentType: order.fulfilmentType },
        message: "We already received this checkout request.",
        mode: persistence.mode,
        idempotentReplay: true,
        odoo: { configured: replayOdoo.configured, synced: replayOdoo.synced, message: replayOdoo.message },
        warning: replayOdoo.configured && !replayOdoo.synced ? "Order is saved, but POS synchronization still needs staff attention." : undefined,
      });
    }

    // Only attempt POS sync once a persisted order exists. External order ID is stable for safe retries.
    const odoo = persistence.mode === "appwrite"
      ? await syncOrderToOdoo(order)
      : { configured: false, synced: false, message: "Demo mode: no persistent POS sync was attempted" };

    if (persistence.mode === "appwrite" && odoo.configured) {
      try {
        await updatePersistedOrderIntegration(persistence.rowId ?? order.orderNumber.toLowerCase(), {
          integrationStatus: odoo.synced ? "synced" : "failed",
          odooOrderId: odoo.externalOrderId ?? "",
          odooSyncMessage: odoo.message.slice(0, 500),
        });
      } catch (statusError) {
        // The order already exists; keep the accepted order response while logging the status-write problem.
        console.error("Could not update Odoo sync state", statusError);
      }
    }

    return Response.json({
      ok: true,
      order: { orderNumber, total, status: "received", fulfilmentType: order.fulfilmentType },
      message: "Order received. The restaurant will confirm preparation shortly.",
      mode: persistence.mode,
      odoo: { configured: odoo.configured, synced: odoo.synced, message: odoo.message },
      warning: persistence.mode === "appwrite" && !odoo.configured ? "Order saved in Appwrite but not sent to Odoo because the bridge is not configured." : persistence.mode === "appwrite" && odoo.configured && !odoo.synced ? "Order saved, but POS synchronization needs staff attention." : undefined,
      note: !isAppwriteConfigured() ? "Demo mode: set Appwrite environment variables to persist orders." : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed", error);
    return Response.json({ error: "We could not confirm your order. Please try again later." }, { status: 503 });
  }
}
