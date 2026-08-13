import type { Metadata } from "next";
import { diagnostica } from "@/services/diagnostica";
import { BRAND_NAME } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";

/**
 * Stato dell'installazione, visibile dal browser.
 *
 * Sta fuori dal gruppo (site) di proposito: quel layout legge il database per
 * la navbar e il carrello, quindi fallirebbe esattamente nei casi in cui
 * questa pagina serve. Qui dentro non si può dare per scontato niente.
 *
 * Resta fuori dai motori di ricerca e non mostra mai il valore di una
 * variabile — vedi il commento in services/diagnostica.ts.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stato dell'installazione",
  robots: { index: false, follow: false },
};

const COLORI = {
  ok: { punto: "bg-[#2E7D32]", testo: "text-cacao" },
  avviso: { punto: "bg-[#B8860B]", testo: "text-cacao" },
  manca: { punto: "bg-fiamma", testo: "text-cacao" },
} as const;

export default async function SetupPage() {
  const controlli = await diagnostica();
  const daFare = controlli.filter((c) => c.rimedio);
  const tuttoOk = daFare.length === 0;

  return (
    <div className="bg-panna min-h-dvh px-5 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <Logo size="md" />

        <p className="eyebrow text-fiamma mt-10">
          Stato dell&apos;installazione
        </p>
        <h1 className="text-display mt-3">
          {tuttoOk ? "Non manca niente." : "Ecco cosa manca."}
        </h1>
        <p className="text-lead text-cacao-soft mt-4">
          {tuttoOk
            ? `${BRAND_NAME} ha tutto quello che gli serve per funzionare. Il resto — etichetta, pagine legali, pagamenti — lo trovi nella checklist di lancio dentro l'amministrazione.`
            : "Questa pagina interroga il sito adesso, non legge una lista scritta a mano. Risolvi dall'alto verso il basso: la prima voce spesso spiega quelle sotto."}
        </p>

        <ol className="mt-10 space-y-px">
          {controlli.map((controllo) => {
            const colore = COLORI[controllo.esito];
            return (
              <li
                key={controllo.titolo}
                className="border-cacao-line bg-crema/40 border-b px-5 py-5 first:rounded-t-2xl first:border-t last:rounded-b-2xl"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${colore.punto}`}
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className={`font-semibold ${colore.testo}`}>
                      {controllo.titolo}
                      <span className="sr-only">
                        {controllo.esito === "ok"
                          ? ": a posto"
                          : ": da sistemare"}
                      </span>
                    </h2>
                    <p className="text-cacao-soft mt-1 text-sm">
                      {controllo.dettaglio}
                    </p>
                    {controllo.rimedio && (
                      <p className="text-cacao mt-3 text-sm">
                        <span className="font-semibold">Come si risolve:</span>{" "}
                        {controllo.rimedio}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {tuttoOk ? (
          <a
            href="/admin/settings"
            className="bg-fiamma text-cacao rounded-pill hover:bg-fiamma-deep hover:text-panna mt-10 inline-flex h-14 items-center px-8 font-semibold"
          >
            Vai alla checklist di lancio
          </a>
        ) : (
          <p className="border-cacao-line text-cacao-soft mt-10 border-t pt-6 text-sm">
            Dopo ogni modifica alle variabili d&apos;ambiente serve un{" "}
            <strong className="text-cacao">nuovo deploy</strong>: un deploy già
            pubblicato è immutabile e continuerà a comportarsi come prima, anche
            a problema risolto.
          </p>
        )}
      </div>
    </div>
  );
}
