"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Confine di errore globale.
 *
 * In produzione non mostra mai il messaggio tecnico: uno stack trace in pagina
 * non aiuta chi sta comprando e può rivelare percorsi e struttura interna. Il
 * `digest` sì, perché è l'unica cosa che permette di ritrovare l'errore nei log
 * del server quando qualcuno scrive all'assistenza.
 *
 * In sviluppo vale l'opposto. Chi ha appena installato il progetto e vede
 * "Ci siamo rotti noi" non ha nessun modo di sapere che il problema è il
 * database spento: la pagina lo dice, e per la causa di gran lunga più comune
 * dice anche cosa fare. Il controllo su NODE_ENV viene sostituito con una
 * costante in fase di compilazione, quindi questo blocco non finisce nel
 * pacchetto di produzione.
 */

const IN_SVILUPPO = process.env.NODE_ENV === "development";

/** Il messaggio grezzo, tradotto in una causa e un rimedio quando si riconosce. */
function diagnosi(messaggio: string): { causa: string; rimedio: string } | null {
  if (/can't reach database server|econnrefused|P1001/i.test(messaggio)) {
    return {
      causa: "Il database non risponde.",
      rimedio: "Riavvialo con `npm run demo`, o controlla DATABASE_URL nel file .env.",
    };
  }
  if (/does not exist in the current database|P2021|P2022/i.test(messaggio)) {
    return {
      causa: "Le tabelle non ci sono, o non sono aggiornate.",
      rimedio: "Applica lo schema con `npx prisma migrate deploy`.",
    };
  }
  if (/AUTH_SECRET/i.test(messaggio)) {
    return {
      causa: "Manca AUTH_SECRET, o è troppo corta.",
      rimedio: 'Aggiungi al .env: AUTH_SECRET="$(openssl rand -base64 32)".',
    };
  }
  return null;
}
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

        {IN_SVILUPPO && error.message && <DettaglioSviluppo messaggio={error.message} />}
      </div>
    </div>
  );
}

function DettaglioSviluppo({ messaggio }: { messaggio: string }) {
  const spiegazione = diagnosi(messaggio);
  return (
    <div className="border-cacao-line bg-crema mt-10 rounded-2xl border p-5 text-left">
      <p className="eyebrow text-cacao-soft">Solo in sviluppo</p>
      {spiegazione ? (
        <>
          <p className="text-cacao mt-3 font-semibold">{spiegazione.causa}</p>
          <p className="text-cacao-soft mt-1 text-sm">{spiegazione.rimedio}</p>
        </>
      ) : (
        <p className="text-cacao mt-3 font-semibold">
          Errore non riconosciuto: il messaggio completo è qui sotto e nel terminale.
        </p>
      )}
      {/* I messaggi di Prisma contengono percorsi lunghissimi senza spazi:
          senza break-all escono dal riquadro invece di andare a capo. */}
      <pre className="text-cacao-soft mt-4 max-h-40 overflow-auto font-mono text-xs break-all whitespace-pre-wrap">
        {messaggio}
      </pre>
    </div>
  );
}
