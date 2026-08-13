import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Dove finiscono i file caricati.
 *
 * Due strade, scelte dall'ambiente e non da una configurazione da ricordarsi:
 *
 * - **disco**, in `public/uploads`. Giusto in sviluppo e su un server singolo:
 *   zero dipendenze, i file si vedono nel progetto, niente da configurare per
 *   far girare `npm run demo`.
 * - **Vercel Blob**, quando c'è il token. Su una piattaforma serverless il
 *   filesystem è effimero: quello che scrivi sparisce al rilancio successivo.
 *
 * C'è un terzo caso, ed è quello che conta davvero: **su Vercel senza token**.
 * Lì scrivere su disco riuscirebbe — e i file sparirebbero poche ore dopo,
 * senza un errore, senza un avviso, lasciando articoli con le copertine rotte.
 * Un caricamento che finisce bene e perde il file è peggio di un caricamento
 * che fallisce, quindi in quel caso si rifiuta di scrivere e lo dice.
 *
 * Il resto del progetto non sa niente di tutto questo: conosce solo l'URL
 * salvato in `Media.url`. Aggiungere S3 domani significa aggiungere un ramo
 * qui dentro.
 */

export type FileSalvato = { url: string; nome: string };

/** Oltre questo, lo storage si considera non raggiungibile. */
const ATTESA_MASSIMA_MS = 20_000;

export class StorageNonRisponde extends Error {
  constructor() {
    super(
      `Lo storage delle immagini non ha risposto entro ${ATTESA_MASSIMA_MS / 1000} secondi.`,
    );
    this.name = "StorageNonRisponde";
  }
}

/**
 * Il limite di tempo, imposto qui e non delegato.
 *
 * Al client di Blob si passa anche un `abortSignal`, ma da solo non basta: in
 * laboratorio, con la rete verso Vercel bloccata, il caricamento e' rimasto
 * appeso oltre un minuto nonostante il segnale — la libreria riprova da sola
 * con attese crescenti e il segnale non interrompe il giro. Una corsa contro
 * un timer non dipende da come la libreria si comporta: la richiesta di fondo
 * puo' anche continuare, ma chi sta caricando riceve una risposta.
 */
function conScadenza<T>(operazione: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const scadenza = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new StorageNonRisponde()),
      ATTESA_MASSIMA_MS,
    );
  });
  return Promise.race([operazione, scadenza]).finally(() =>
    clearTimeout(timer),
  );
}

export type Destinazione = "blob" | "disco" | "non-configurato";

/** Dove verrebbe scritto un file adesso. Usata anche dalla diagnostica. */
export function destinazione(): Destinazione {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) return "non-configurato";
  return "disco";
}

export class StorageNonConfigurato extends Error {
  constructor() {
    super(
      "Storage non configurato. Su Vercel il disco è effimero: senza Vercel Blob " +
        "le immagini caricate sparirebbero al primo rilancio. Crea uno store Blob " +
        "nel progetto (Storage → Create → Blob): la variabile BLOB_READ_WRITE_TOKEN " +
        "viene collegata da sola, poi serve un nuovo deploy.",
    );
    this.name = "StorageNonConfigurato";
  }
}

export async function salvaFile(
  contenuto: Buffer,
  { cartella, nome, tipo }: { cartella: string; nome: string; tipo: string },
): Promise<FileSalvato> {
  switch (destinazione()) {
    case "non-configurato":
      throw new StorageNonConfigurato();

    case "blob": {
      const { put } = await import("@vercel/blob");
      // Il nome porta già un suffisso casuale: un secondo suffisso renderebbe
      // gli indirizzi illeggibili senza aggiungere nulla.
      const blob = await conScadenza(
        put(`${cartella}/${nome}`, contenuto, {
          access: "public",
          contentType: tipo,
          addRandomSuffix: false,
          abortSignal: AbortSignal.timeout(ATTESA_MASSIMA_MS),
        }),
      );
      return { url: blob.url, nome };
    }

    case "disco": {
      const directory = path.join(process.cwd(), "public", "uploads", cartella);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, nome), contenuto);
      return { url: `/uploads/${cartella}/${nome}`, nome };
    }
  }
}

/**
 * Cancella il file, se si riesce.
 *
 * Il record nel database è la fonte di verità: se il file non c'è più o lo
 * storage non risponde, l'eliminazione deve comunque considerarsi riuscita.
 * Un file orfano si ripulisce; un record che non si riesce a cancellare
 * lascia in pagina un'immagine rotta.
 */
export async function eliminaFile(url: string): Promise<void> {
  try {
    if (url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await conScadenza(
        del(url, { abortSignal: AbortSignal.timeout(ATTESA_MASSIMA_MS) }),
      );
      return;
    }
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // Nulla da recuperare: il record è comunque da rimuovere.
  }
}
