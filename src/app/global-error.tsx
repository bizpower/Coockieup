"use client";

/**
 * Ultima rete di sicurezza.
 *
 * `error.tsx` non cattura gli errori del layout radice: se salta quello, senza
 * questo file il visitatore vedrebbe la pagina bianca di Next. Qui si
 * ricostruiscono <html> e <body> perché il layout che li avrebbe forniti è
 * proprio quello che non ha funzionato — e per lo stesso motivo lo stile è
 * scritto inline, senza dipendere dal foglio di stile.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#FDFBF6",
          color: "#241812",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#FF4B26",
              margin: 0,
            }}
          >
            Errore
          </p>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.1, margin: "1rem 0 0" }}>
            Il sito non è riuscito a caricarsi.
          </h1>
          <p style={{ color: "#6B5445", lineHeight: 1.6, marginTop: "1rem" }}>
            È un problema nostro. Riprova fra un momento.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#FF4B26",
              color: "#241812",
              border: 0,
              borderRadius: 999,
              padding: "0.875rem 2rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Riprova
          </button>

          {error.digest && (
            <p style={{ color: "#6B5445", fontSize: "0.75rem", marginTop: "2rem" }}>
              Codice per l&apos;assistenza: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
