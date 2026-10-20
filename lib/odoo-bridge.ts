import type { StoredOrder } from "@/lib/appwrite-server";

export type OdooSyncResult = { configured: boolean; synced: boolean; externalOrderId?: string; message: string };

/**
 * Calls a purpose-built Odoo bridge module. Do not assume a generic pos.order.create
 * call is enough: POS sessions, payment lines, taxes and kitchen preparation need mapping.
 */
export async function syncOrderToOdoo(order: StoredOrder): Promise<OdooSyncResult> {
  const bridgeUrl = process.env.ODOO_BRIDGE_URL;
  const bridgeToken = process.env.ODOO_BRIDGE_TOKEN;
  if (!bridgeUrl || !bridgeToken) {
    return { configured: false, synced: false, message: "Odoo bridge is not configured" };
  }

  try {
    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bridgeToken}` },
      body: JSON.stringify({
        external_order_id: order.orderNumber,
        channel: "website",
        customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
        fulfilment_type: order.fulfilmentType,
        payment_status: order.paymentStatus,
        notes: order.instructions,
        delivery_address: order.address,
        lines: order.items.map((item) => ({ product_external_id: item.odooProductId, name: item.name, quantity: item.quantity, unit_price: item.unitPrice })),
        totals: { subtotal: order.subtotal, delivery_fee: order.deliveryFee, total: order.total, currency: "KES" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { configured: true, synced: false, message: `Odoo bridge returned HTTP ${response.status}` };
    const body = await response.json().catch(() => ({})) as { id?: string; order_id?: string; message?: string };
    return { configured: true, synced: true, externalOrderId: body.id ?? body.order_id, message: body.message ?? "Order accepted by Odoo bridge" };
  } catch (error) {
    return { configured: true, synced: false, message: error instanceof Error ? error.message : "Odoo bridge unavailable" };
  }
}
