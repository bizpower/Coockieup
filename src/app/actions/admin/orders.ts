"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { restoreOrderReservations } from "@/services/order";
import { sendOrderConfirmation } from "@/services/order-email";
import { releaseStaleOrders } from "@/services/maintenance";

/**
 * Gestione ordini dall'area amministrativa.
 *
 * Ogni azione passa da `requireAdmin`. Il middleware protegge le pagine, ma
 * una Server Action è un endpoint a sé: raggiungibile con una POST, senza
 * passare da nessuna pagina. Proteggere solo la vista lascia aperta la porta.
 */

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function updateOrderStatus(orderId: string, rawStatus: string) {
  await requireAdmin();

  const parsed = statusSchema.safeParse(rawStatus);
  if (!parsed.success) return { ok: false, message: "Stato non valido." };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, message: "Ordine non trovato." };

  // Annullare o rimborsare rimette a scaffale quello che era stato scalato.
  const restocking =
    (parsed.data === "CANCELLED" || parsed.data === "REFUNDED") &&
    order.status !== "CANCELLED" &&
    order.status !== "REFUNDED";

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: parsed.data,
        // Segnare "rimborsato" senza toccare lo stato del pagamento
        // lascerebbe l'ordine a figurare come incassato nel fatturato.
        ...(parsed.data === "REFUNDED" ? { paymentStatus: "REFUNDED" as const } : {}),
        ...(parsed.data === "PAID" ? { paymentStatus: "PAID" as const } : {}),
      },
    });

    if (restocking) await restoreOrderReservations(tx, orderId);
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return {
    ok: true,
    message: restocking
      ? "Stato aggiornato: scorte e utilizzo del codice sconto ripristinati."
      : "Stato aggiornato.",
  };
}

export async function updateOrderNotes(orderId: string, formData: FormData) {
  await requireAdmin();

  const trackingCode = formData.get("trackingCode")?.toString().trim() || null;
  const adminNote = formData.get("adminNote")?.toString().trim() || null;

  await db.order.update({
    where: { id: orderId },
    data: { trackingCode, adminNote },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Note salvate." };
}

/**
 * Rimanda la conferma d'ordine.
 *
 * Serve quando il provider di posta era spento o ha avuto un guasto: senza
 * questo, l'unico rimedio sarebbe scrivere l'email a mano dal proprio client.
 */
export async function resendOrderConfirmation(orderId: string) {
  await requireAdmin();

  const result = await sendOrderConfirmation(orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: result.sent, message: result.message };
}

/**
 * Libera subito le scorte impegnate da ordini mai pagati.
 *
 * Normalmente lo fa la manutenzione notturna. Questo pulsante serve quando
 * qualcuno si accorge che un formato risulta esaurito mentre in magazzino
 * c'è ancora, e non vuole aspettare fino a domani.
 */
export async function releaseStaleStock() {
  await requireAdmin();

  const result = await releaseStaleOrders();

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");

  return {
    ok: true,
    message:
      result.released === 0
        ? "Nessun ordine da liberare: tutte le scorte impegnate sono di ordini recenti."
        : `${result.released} ordini annullati, ${result.units} pezzi rimessi a scaffale.`,
  };
}

/** Elimina in blocco gli ordini di collaudo. Da usare prima dell'apertura. */
export async function deleteDemoOrders() {
  await requireAdmin("ADMIN");

  const { count } = await db.order.deleteMany({ where: { isDemo: true } });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, message: `Eliminati ${count} ordini di prova.` };
}
