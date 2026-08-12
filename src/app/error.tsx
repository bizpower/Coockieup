"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Confine di errore globale.
 *
 * Non mostra mai il messaggio tecnico: uno stack trace in pagina non aiuta chi
 * sta comprando e può rivelare percorsi e struttura interna. Il `digest` sì,
 * perché è l'unica cosa che permette di ritrovare l'errore nei log del server
 * quando qualcuno scrive all'assistenza.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In produzione qui va agganciato il servizio di monitoraggio.
    console.error(error);
  }, [error]);

  return (
    <div className="bg-panna flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="eyebrow text-fiamma">Qualcosa è andato storto</p>
        <h1 className="text-display mt-4">Ci siamo rotti noi, non tu.</h1>
        <p className="text-lead text-cacao-soft mt-5">
          È successo un errore imprevisto. Riprova: nella maggior parte dei casi basta.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            Riprova
          </Button>
          <ButtonLink size="lg" variant="outline" href="/">
            Torna alla home
          </ButtonLink>
        </div>

        {error.digest && (
          <p className="text-cacao-soft mt-8 text-xs">
            Se scrivi all&apos;assistenza, riporta questo codice:{" "}
            <code className="bg-crema rounded px-1.5 py-0.5 font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
