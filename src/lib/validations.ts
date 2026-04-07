import { z } from "zod";

// Validates decimal inputs from UI (e.g. 1250.50) before converting to minor units
export const ListingFormSchema = z.object({
  batchId: z.string().min(1, "Please select a batch"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  currency: z.enum(["INR"]).default("INR"),
  pricePerTon: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive("Price must be greater than 0")
  ),
  minPurchaseQty: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().int().positive("Minimum purchase must be at least 1")
  ),
});

export const RetireFormSchema = z.object({
  batchId: z.string().min(1, "Please select a batch to retire"),
  quantity: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().int().positive("Quantity must be at least 1")
  ),
  reason: z.enum(["CCTS Compliance Obligation", "Voluntary Corporate Offset"], {
    message: "Please select a valid reason"
  }),
  beneficiaryName: z.string().min(2, "Beneficiary Name is required to prevent double-counting"),
});
