import { z } from "zod";

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
    email: z.string().trim().email().max(180).optional().or(z.literal("")),
  }),
  fulfilmentType: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["pay_on_fulfilment", "mpesa"]),
  address: z.string().trim().max(240).optional().default(""),
  instructions: z.string().trim().max(500).optional().default(""),
  items: z.array(z.object({ id: z.string().min(1).max(80), quantity: z.number().int().min(1).max(20) })).min(1).max(40),
  idempotencyKey: z.string().min(8).max(100),
}).superRefine((data, ctx) => {
  if (data.fulfilmentType === "delivery" && (!data.address || data.address.trim().length < 6)) {
    ctx.addIssue({ code: "custom", path: ["address"], message: "Enter a delivery address" });
  }
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
