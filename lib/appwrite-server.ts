import "server-only";
import type { CreateOrderInput } from "@/lib/order-schema";

const endpoint = process.env.APPWRITE_ENDPOINT?.replace(/\/$/, "");
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const ordersTableId = process.env.APPWRITE_ORDERS_TABLE_ID;

export function isAppwriteConfigured() {
  return Boolean(endpoint && projectId && apiKey && databaseId && ordersTableId);
}

export type StoredOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfilmentType: "pickup" | "delivery";
  paymentMethod: "pay_on_fulfilment" | "mpesa";
  paymentStatus: "unpaid" | "pending";
  status: "received";
  address: string;
  instructions: string;
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number; odooProductId: string }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  integrationStatus: "pending" | "not_configured" | "synced" | "failed";
  odooOrderId: string;
  odooSyncMessage: string;
  idempotencyKey: string;
  createdAt: string;
};

export async function persistOrder(input: CreateOrderInput, order: StoredOrder) {
  if (!isAppwriteConfigured()) return { mode: "demo" as const, rowId: null };

  const response = await fetch(
    `${endpoint}/databases/${encodeURIComponent(databaseId!)}/tables/${encodeURIComponent(ordersTableId!)}/rows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId!,
        "X-Appwrite-Key": apiKey!,
      },
      body: JSON.stringify({ rowId: order.orderNumber.toLowerCase(), data: { ...order, customer: JSON.stringify(input.customer), items: JSON.stringify(order.items) } }),
      cache: "no-store",
    },
  );

  if (response.status === 409) {
    return { mode: "appwrite" as const, rowId: order.orderNumber.toLowerCase(), duplicate: true };
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Appwrite order persistence failed (${response.status}): ${detail.slice(0, 240)}`);
  }
  const result = await response.json() as { $id?: string };
  return { mode: "appwrite" as const, rowId: result.$id ?? order.orderNumber.toLowerCase(), duplicate: false };
}


export async function updatePersistedOrderIntegration(
  rowId: string,
  data: Pick<StoredOrder, "integrationStatus" | "odooOrderId" | "odooSyncMessage">,
) {
  if (!isAppwriteConfigured()) return;
  const response = await fetch(
    `${endpoint}/databases/${encodeURIComponent(databaseId!)}/tables/${encodeURIComponent(ordersTableId!)}/rows/${encodeURIComponent(rowId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId!,
        "X-Appwrite-Key": apiKey!,
      },
      body: JSON.stringify({ data }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Appwrite order status update failed (${response.status}): ${detail.slice(0, 200)}`);
  }
}
