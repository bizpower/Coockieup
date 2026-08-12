"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export type SaveResult = { ok: boolean; message: string };

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Il codice è troppo corto.")
      .max(30)
      .regex(/^[A-Z0-9-]+$/, "Solo lettere, numeri e trattini."),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().int().min(0),
    minSubtotalCents: z.coerce.number().int().min(0),
    usageLimit: z.coerce.number().int().min(0).optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine((data) => data.type !== "PERCENT" || (data.value >= 1 && data.value <= 100), {
    message: "Una percentuale deve stare fra 1 e 100.",
    path: ["value"],
  })
  .refine((data) => data.type !== "FIXED" || data.value >= 1, {
    message: "Uno sconto fisso deve essere maggiore di zero.",
    path: ["value"],
  });

export async function saveCoupon(couponId: string | null, formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    code: formData.get("code")?.toString(),
    type: formData.get("type")?.toString(),
    value: formData.get("value")?.toString() || 0,
    minSubtotalCents: formData.get("minSubtotalCents")?.toString() || 0,
    usageLimit: formData.get("usageLimit")?.toString() || 0,
    expiresAt: formData.get("expiresAt")?.toString(),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const data = parsed.data;

  const clash = await db.coupon.findFirst({
    where: { code: data.code, ...(couponId ? { NOT: { id: couponId } } : {}) },
  });
  if (clash) return { ok: false, message: `Il codice ${data.code} esiste già.` };

  const payload = {
    code: data.code,
    type: data.type,
    value: data.type === "FREE_SHIPPING" ? 0 : data.value,
    minSubtotalCents: data.minSubtotalCents,
    // Zero significa "nessun limite": è più naturale da digitare di un campo vuoto.
    usageLimit: data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
  };

  if (couponId) {
    await db.coupon.update({ where: { id: couponId }, data: payload });
  } else {
    await db.coupon.create({ data: payload });
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: couponId ? "Codice aggiornato." : "Codice creato." };
}

export async function toggleCoupon(couponId: string): Promise<SaveResult> {
  await requireAdmin();

  const coupon = await db.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return { ok: false, message: "Codice non trovato." };

  await db.coupon.update({ where: { id: couponId }, data: { isActive: !coupon.isActive } });

  revalidatePath("/admin/coupons");
  return {
    ok: true,
    message: coupon.isActive ? `${coupon.code} disattivato.` : `${coupon.code} attivato.`,
  };
}

export async function deleteCoupon(couponId: string): Promise<SaveResult> {
  await requireAdmin();

  const coupon = await db.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return { ok: false, message: "Codice non trovato." };

  // Un codice già usato compare nello storico degli ordini: cancellarlo
  // renderebbe illeggibile il motivo di uno sconto applicato in passato.
  if (coupon.usedCount > 0) {
    await db.coupon.update({ where: { id: couponId }, data: { isActive: false } });
    return {
      ok: true,
      message: `${coupon.code} è già stato usato ${coupon.usedCount} volte: è stato disattivato invece che eliminato.`,
    };
  }

  await db.coupon.delete({ where: { id: couponId } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Codice eliminato." };
}
