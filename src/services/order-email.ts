import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";

/**
 * Invio della conferma d'ordine.
 *
 * L'esito viene scritto sull'ordine. È la parte che conta: da lì la pagina di
 * conferma sa se può dire "ti abbiamo scritto", e l'area amministrativa sa
 * quali ordini sono partiti senza email.
 *
 * Non solleva mai. Un guasto del provider di posta dopo un pagamento andato a
 * buon fine non deve trasformarsi in un errore mostrato al cliente: l'ordine
 * esiste, i soldi pure, e l'email si può ritentare.
 */
export async function sendOrderConfirmation(orderId: string): Promise<{ sent: boolean; message: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return { sent: false, message: "Ordine non trovato." };

  const message = buildOrderConfirmationEmail({
    number: order.number,
    email: order.email,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingZip: order.shippingZip,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    couponCode: order.couponCode,
    paymentProvider: order.paymentProvider,
    isPaid: order.paymentStatus === "PAID",
    items: order.items,
  });

  const result = await sendEmail(message);

  await db.order.update({
    where: { id: order.id },
    data: result.ok
      ? { confirmationEmailSentAt: new Date(), confirmationEmailError: null }
      : { confirmationEmailError: result.message.slice(0, 500) },
  });

  return result.ok
    ? { sent: true, message: "Email di conferma inviata." }
    : { sent: false, message: result.message };
}
