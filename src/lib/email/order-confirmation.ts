import { BRAND_LEGAL, BRAND_NAME } from "@/config/brand";
import { SITE_URL } from "@/config/site";
import { formatPrice } from "@/lib/format";
import type { EmailMessage } from "./types";

/**
 * Email di conferma d'ordine.
 *
 * Tabelle e stili in linea, non classi: i client di posta ignorano i fogli di
 * stile e Outlook ignora anche buona parte di flexbox. È brutto da scrivere
 * ma è l'unico modo perché il messaggio arrivi uguale ovunque.
 *
 * La versione testuale non è un ripiego: alcuni client la mostrano per scelta
 * dell'utente, e senza di essa i filtri antispam alzano il punteggio.
 */

export type OrderEmailData = {
  number: string;
  email: string;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingZip: string;
  shippingCity: string;
  shippingState: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  paymentProvider: string;
  isPaid: boolean;
  items: { nameSnapshot: string; variantSnapshot: string; quantity: number; unitPriceCents: number }[];
};

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrderConfirmationEmail(order: OrderEmailData): EmailMessage {
  const lookupUrl = `${SITE_URL}/account`;

  // Il pagamento non incassato va detto subito e in chiaro: è l'informazione
  // che determina se il pacco parte o resta fermo.
  const paymentNote = order.isPaid
    ? "Il pagamento è stato ricevuto. Prepariamo la spedizione."
    : order.paymentProvider === "manual"
      ? `L'ordine è in attesa di pagamento tramite bonifico. Rispondi a questa email o scrivi a ${BRAND_LEGAL.supportEmail} per ricevere i riferimenti: appena riceviamo il bonifico prepariamo la spedizione.`
      : "Stiamo attendendo la conferma del pagamento. Se hai completato l'operazione, non serve fare altro.";

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #D9C9B0;">
            <strong style="color:#241812;">${escape(item.nameSnapshot)}</strong><br>
            <span style="color:#6B5445;font-size:14px;">${escape(item.variantSnapshot)} × ${item.quantity}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #D9C9B0;text-align:right;color:#241812;font-weight:600;white-space:nowrap;">
            ${formatPrice(item.unitPriceCents * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:4px 0;color:${strong ? "#241812" : "#6B5445"};font-size:${strong ? "17px" : "15px"};${strong ? "font-weight:800;padding-top:12px;border-top:1px solid #D9C9B0;" : ""}">${label}</td>
      <td style="padding:4px 0;text-align:right;color:#241812;font-size:${strong ? "17px" : "15px"};font-weight:${strong ? "800" : "600"};${strong ? "padding-top:12px;border-top:1px solid #D9C9B0;" : ""}">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ordine ${escape(order.number)}</title></head>
<body style="margin:0;padding:0;background:#F4EADA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EADA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDFBF6;border-radius:20px;overflow:hidden;">

        <tr><td style="padding:32px 32px 0;">
          <div style="font-size:26px;font-weight:800;letter-spacing:-1px;color:#241812;">
            ${escape(BRAND_NAME)}<span style="color:#FF4B26;">.</span>
          </div>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <h1 style="margin:0;font-size:28px;line-height:1.15;color:#241812;">Grazie. Ci pensiamo noi.</h1>
          <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#6B5445;">
            Abbiamo registrato il tuo ordine. ${escape(paymentNote)}
          </p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <div style="background:#F4EADA;border-radius:14px;padding:18px 20px;">
            <div style="font-size:13px;font-weight:700;color:#6B5445;text-transform:uppercase;letter-spacing:1px;">Numero d'ordine</div>
            <div style="font-size:26px;font-weight:800;color:#241812;letter-spacing:-0.5px;margin-top:4px;">${escape(order.number)}</div>
          </div>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:17px;color:#241812;">Cosa hai ordinato</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">${rows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
            ${totalRow("Subtotale", formatPrice(order.subtotalCents))}
            ${order.discountCents > 0 ? totalRow(`Sconto${order.couponCode ? ` (${escape(order.couponCode)})` : ""}`, `−${formatPrice(order.discountCents)}`) : ""}
            ${totalRow("Spedizione", order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents))}
            ${totalRow("Totale", formatPrice(order.totalCents), true)}
          </table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:17px;color:#241812;">Spedizione</h2>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#6B5445;">
            ${escape(order.shippingName)}<br>
            ${escape(order.shippingLine1)}<br>
            ${order.shippingLine2 ? `${escape(order.shippingLine2)}<br>` : ""}
            ${escape(order.shippingZip)} ${escape(order.shippingCity)}${order.shippingState ? ` (${escape(order.shippingState)})` : ""}
          </p>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <a href="${lookupUrl}" style="display:inline-block;background:#FF4B26;color:#241812;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px;">
            Segui il tuo ordine
          </a>
          <p style="margin:12px 0 0;font-size:13px;color:#6B5445;">
            Ti serviranno il numero d'ordine e questo indirizzo email.
          </p>
        </td></tr>

        <tr><td style="padding:32px;">
          <div style="border-top:1px solid #D9C9B0;padding-top:20px;font-size:13px;line-height:1.6;color:#6B5445;">
            Domande? Rispondi a questa email oppure scrivi a
            <a href="mailto:${escape(BRAND_LEGAL.supportEmail)}" style="color:#D6350F;">${escape(BRAND_LEGAL.supportEmail)}</a>.
            <br><br>
            ${escape(BRAND_NAME)} — ${escape(BRAND_LEGAL.companyName)}<br>
            Nome, ricetta e valori nutrizionali del prodotto sono in fase di definizione:
            nessun dato in etichetta è ancora definitivo.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${BRAND_NAME} — ordine ${order.number}`,
    "",
    "Grazie. Abbiamo registrato il tuo ordine.",
    paymentNote,
    "",
    "COSA HAI ORDINATO",
    ...order.items.map(
      (item) =>
        `- ${item.nameSnapshot} (${item.variantSnapshot}) x${item.quantity}  ${formatPrice(item.unitPriceCents * item.quantity)}`,
    ),
    "",
    `Subtotale:   ${formatPrice(order.subtotalCents)}`,
    ...(order.discountCents > 0
      ? [`Sconto:      -${formatPrice(order.discountCents)}${order.couponCode ? ` (${order.couponCode})` : ""}`]
      : []),
    `Spedizione:  ${order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}`,
    `TOTALE:      ${formatPrice(order.totalCents)}`,
    "",
    "SPEDIZIONE",
    order.shippingName,
    order.shippingLine1,
    ...(order.shippingLine2 ? [order.shippingLine2] : []),
    `${order.shippingZip} ${order.shippingCity}${order.shippingState ? ` (${order.shippingState})` : ""}`,
    "",
    `Segui il tuo ordine: ${lookupUrl}`,
    `Ti serviranno il numero d'ordine e questo indirizzo email.`,
    "",
    `Domande? Scrivi a ${BRAND_LEGAL.supportEmail}`,
    "",
    "Nome, ricetta e valori nutrizionali del prodotto sono in fase di definizione:",
    "nessun dato in etichetta è ancora definitivo.",
  ].join("\n");

  return {
    to: order.email,
    subject: `Ordine ${order.number} — grazie!`,
    html,
    text,
    replyTo: BRAND_LEGAL.supportEmail,
  };
}
