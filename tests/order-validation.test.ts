import { describe, expect, it } from "vitest";
import { createOrderSchema } from "@/lib/order-schema";

const validOrder = {
  customer: { name: "Amina Otieno", phone: "+254712345678", email: "" },
  fulfilmentType: "pickup" as const,
  paymentMethod: "pay_on_fulfilment" as const,
  address: "",
  instructions: "No onions please",
  items: [{ id: "ember-burger", quantity: 2 }],
  idempotencyKey: "test-checkout-12345678",
};

describe("createOrderSchema", () => {
  it("accepts a valid pickup order", () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it("requires an address for delivery", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, fulfilmentType: "delivery", address: "" });
    expect(result.success).toBe(false);
  });

  it("rejects zero or fractional quantities", () => {
    expect(createOrderSchema.safeParse({ ...validOrder, items: [{ id: "ember-burger", quantity: 0 }] }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...validOrder, items: [{ id: "ember-burger", quantity: 1.5 }] }).success).toBe(false);
  });

  it("rejects an empty cart", () => {
    expect(createOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false);
  });

  it("rejects an invalid email when supplied", () => {
    expect(createOrderSchema.safeParse({ ...validOrder, customer: { ...validOrder.customer, email: "not-an-email" } }).success).toBe(false);
  });
});
