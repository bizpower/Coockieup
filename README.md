# [BRAND NAME] — e-commerce

E-commerce per un brand italiano di mini cookie proteici. Next.js, TypeScript,
PostgreSQL. Frontend pubblico, area amministrativa, magazine editoriale.

Il nome del brand, la ricetta e i valori nutrizionali **non sono definitivi**.
Il progetto è costruito perché cambiarli sia un'operazione da minuti, non da
giorni: vedi [Cambiare il nome del brand](#cambiare-il-nome-del-brand) e
[Dati non confermati](#dati-non-confermati).

---

## Stato

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Architettura, schema, design system | ✅ |
| 1 | Scaffold, design token, arte del brand, homepage | ✅ |
| 2 | Shop, prodotto, carrello, checkout, ordini | ✅ |
| 3 | Admin: dashboard, prodotti, ordini, clienti, media | ✅ |
| 4 | Magazine e editor articoli | ✅ |
| 5 | Sitemap, structured data, analytics | ✅ |
| 6 | Stati di caricamento, errore e vuoto, 404, accessibilità | ✅ |

Il blueprint completo è in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Guardarlo subito

Un comando solo. Serve **Node 20+** e un PostgreSQL, che il comando si procura
da sé con Docker:

```bash
npm install
npm run demo
```

Applica lo schema, popola catalogo, testi e articoli, e apre il sito su
`http://localhost:3000`. L'amministrazione è su `/admin` con
`admin@example.com` / `cambiami-subito`.

**Se Docker non ce l'hai** — o è installato ma non avviato — il comando te lo
dice e si ferma senza fare danni. Puoi usare un PostgreSQL tuo: crea un file
`.env` con dentro la riga

```
DATABASE_URL="postgresql://utente:password@127.0.0.1:5432/nomedb"
```

e rilancia `npm run demo`. Trovandosi un database già indicato, salta del tutto
la parte con Docker e fa tutto il resto.

Il pagamento non è collegato: gli ordini si registrano come da saldare, così il
percorso d'acquisto si può provare fino in fondo senza conto Stripe.

Se una pagina mostra «Ci siamo rotti noi», in sviluppo il riquadro in fondo
dice la causa e cosa fare — quasi sempre è il database spento.

---

## Installazione

Per lavorarci davvero. Servono **Node 20+** e un **PostgreSQL** raggiungibile.

```bash
npm install
cp .env.example .env       # poi riempi DATABASE_URL e AUTH_SECRET
npx prisma migrate dev     # crea le tabelle
npm run db:seed            # catalogo, copy, FAQ, pagine legali, utente admin
npm run dev
```

Il sito è su `http://localhost:3000`.

Non hai un Postgres a portata di mano? Con Docker:

```bash
docker run --name brand-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=brand \
  -p 5432:5432 -d postgres:16
# DATABASE_URL="postgresql://postgres:dev@localhost:5432/brand?schema=public"
```

### Comandi

| Comando | Cosa fa |
|---|---|
| `npm run demo` | Database in Docker, schema, contenuti e sito, in un colpo solo |
| `npm run dev` | Sviluppo |
| `npm run build` | Genera il client Prisma e compila |
| `npm run typecheck` | TypeScript senza emettere |
| `npm run lint` | eslint, preset di Next |
| `npm run db:migrate` | Crea e applica una migrazione |
| `npm run db:seed` | Popola il database (idempotente) |
| `npm run db:studio` | Esplora i dati in una UI |
| `npm run db:reset` | Azzera e riapplica tutto |

---

## Area amministrativa

Si entra da **`/admin`**. Il seed crea un utente con le credenziali di
`ADMIN_EMAIL` e `ADMIN_PASSWORD` (in mancanza: `admin@example.com` /
`cambiami-subito` — da cambiare al primo accesso).

| Sezione | A cosa serve |
|---|---|
| **Dashboard** | Fatturato, ordini, scontrino medio, clienti, pezzi venduti, conversione, traffico del magazine. Gli ordini di prova si includono o escludono con un interruttore. |
| **Ordini** | Ricerca, filtro per stato, dettaglio. Lo stato avanza a passi; annullare o rimborsare **rimette a scaffale** i pezzi. Codice di tracciamento e note interne. |
| **Clienti** | Aggregati calcolati sugli ordini incassati: quanti ordini, quanto speso, ultimo acquisto. |
| **Prodotti** | Anagrafica, SEO, formati e prezzi, e i tre blocchi di dati soggetti a conferma. |
| **Codici sconto** | Percentuale, importo fisso o spedizione gratuita. Un codice già usato viene disattivato invece che eliminato, per non perdere lo storico. |
| **Magazine** | Editor TipTap con pannello SEO, categorie, tag, programmazione. |
| **Media** | Caricamento immagini con testo alternativo **obbligatorio**. |
| **Testi del sito** | Il copy della homepage. Validato prima di essere salvato: un errore di battitura non può rompere la pagina. |
| **FAQ** | Domande, risposte e interruttore "confermata". |
| **Newsletter** | Iscritti raccolti dal sito e consensi dati in cassa. |
| **Impostazioni** | Checklist di lancio, pagine legali, pulizia dei dati di esempio. |

### La checklist di lancio

`/admin/settings` calcola a ogni caricamento cosa manca prima di aprire gli
ordini: interroga il database e le variabili d'ambiente invece di leggere una
lista scritta a mano, quindi non può invecchiare. Le voci **bloccanti** sono
quelle che riguardano dati dichiarati al pubblico — nome, etichetta, pagine
legali, pagamenti.

### Il flusso di scrittura

1. `/admin/blog/new`, titolo (lo slug si compila da solo).
2. Si scrive. Il pannello SEO a destra conta parole, occorrenze della parola
   chiave, sottotitoli e link interni **mentre si scrive**, e mostra l'anteprima
   del risultato su Google.
3. *Salva bozza*, *Programma* (con data futura) o *Pubblica*.

Un articolo programmato compare da solo quando arriva la sua ora: non serve un
processo schedulato, perché la visibilità è filtrata a ogni lettura.

---

## Deploy

Serve un host Node e un PostgreSQL gestito. Il progetto non usa nulla di
specifico di una piattaforma.

### Su Vercel

1. Importa il repository.
2. Collega un database (Vercel Postgres, Neon, Supabase) e copia la stringa in `DATABASE_URL`.
3. Imposta le variabili d'ambiente del file `.env.example` che ti servono.
   `NEXT_PUBLIC_SITE_URL` deve essere il dominio reale, senza barra finale.
4. Genera `AUTH_SECRET` con `openssl rand -base64 32`.
5. Al primo deploy applica lo schema e popola:
   `npx prisma migrate deploy && npm run db:seed`
6. Configura il webhook Stripe sull'URL definitivo.
7. Quando è tutto pronto, `NEXT_PUBLIC_ALLOW_INDEXING="true"`.

### Una cosa da sistemare prima del traffico vero

Le immagini caricate dall'admin finiscono in `public/uploads`, sul disco del
server. Su una piattaforma serverless quel disco è effimero: i file spariscono
al rilancio. Il punto da cambiare è uno solo — `src/app/api/media/upload/route.ts` —
sostituendo la scrittura su disco con Vercel Blob, S3 o equivalente. Il resto
del progetto conosce solo l'URL salvato in `Media.url` e non va toccato.

---

## Analytics

GA4, Meta Pixel e TikTok Pixel sono predisposti in
`src/components/seo/Analytics.tsx`. Ogni script viene caricato **solo** se il
suo ID è presente fra le variabili d'ambiente: senza ID non parte nessuna
richiesta e non viene scritto nessun cookie di terze parti.

```
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-XXXXXXX"
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_PUBLIC_TIKTOK_PIXEL_ID=""
GOOGLE_SITE_VERIFICATION=""
```

**Prima di attivarli serve un sistema di gestione del consenso**: questi script
vanno caricati dopo l'accettazione, non al caricamento della pagina. Il punto in
cui agganciarlo è quel file.

Indipendentemente da tutto questo, il sito conta già le visite in proprio
(`/api/track`): solo percorso e istante, nessun cookie e nessun identificatore.
È quello che alimenta il KPI del traffico in dashboard.

---

## SEO

- Metadata dinamici su ogni rotta, `sitemap.xml` e `robots.txt` generati dal database
- Canonical su tutte le pagine, Open Graph e Twitter card, immagine di anteprima generata dal codice
- JSON-LD: `Organization`, `WebSite`, `Product` con `Offer`, `Article`, `BreadcrumbList`, `FAQPage`
- Carrello, cassa, area ordini e bozze legali sono esclusi da indice e sitemap

Due regole applicate ovunque: **l'`AggregateRating` non viene emesso se le
uniche recensioni sono di esempio**, e le **FAQ non confermate non entrano nel
`FAQPage`**. Dichiarare a Google come certo ciò che sul sito è marcato "da
confermare" è il tipo di incoerenza che si paga con una penalizzazione.

---

## Il marchio, e come cambiarlo

Una riga, in `config/brand.ts`:

```ts
export const BRAND_NAME = "CookieUp";
```

Cambiala e si aggiornano logo, navbar, footer, **il disegno della confezione**,
l'immagine di anteprima social, l'intestazione delle email, i metadata, i dati
strutturati e i titoli delle pagine. Nessun altro file contiene il nome. Nello
stesso file trovi anche il prefisso dei numeri d'ordine (`BRAND_ORDER_PREFIX`,
oggi `CU`), il payoff e i dati legali.

Il logotipo non è un'immagine: è composto dal carattere display, quindi non ha
una versione sgranata e non va rifatto a ogni misura. Il segno è la seconda
metà del nome — **Up** in fiamma, sollevata di un soffio dalla linea di base:
il punteggio che sale quando prendi il power-up.

Quella spezzatura non è scritta a mano. `src/components/brand/wordmark.ts`
legge il nome: se è in camelCase lo divide sulla maiuscola interna e colora la
seconda metà, altrimenti torna al punto in fiamma dopo il nome. Un nome futuro
tutto attaccato continua quindi a funzionare senza toccare i quattro punti che
disegnano il marchio (pagina, confezione, immagine social, email).

---

## Dati non confermati

Valori nutrizionali, ingredienti, allergeni e FAQ vivono nel database con un
flag `isConfirmed`. Finché è `false`:

- il sito mostra il badge **DA CONFERMARE** accanto al dato;
- la sezione ingredienti apre con l'avviso "Ricetta in sviluppo";
- le recensioni marcate `isDemo` sono dichiarate come esempi e **non**
  alimentano l'`AggregateRating` dichiarato ai motori di ricerca.

Non esiste un valore nutrizionale scritto nel codice, quindi non c'è modo di
pubblicare per sbaglio un claim non validato. Quando la ricetta è chiusa si
alza il flag dall'area amministrativa e i badge spariscono da soli.

Le cinque pagine legali sono segnaposto con `needsLegalReview: true`: vanno
redatte o validate da un consulente prima dell'apertura degli ordini.

---

## Pagamenti

Il checkout **funziona già**, con o senza Stripe. Il provider lo decidono le
variabili d'ambiente, non un flag nel codice:

| Situazione | Comportamento |
|---|---|
| `STRIPE_SECRET_KEY` e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` valorizzate | Il cliente viene mandato su Stripe Checkout. L'ordine diventa pagato quando arriva il webhook. |
| Chiavi assenti | L'ordine viene registrato come **da saldare** e la pagina lo dichiara. Serve a provare tutto il flusso senza conto Stripe, e a incassare per bonifico se il negozio apre prima. |

### Configurare Stripe

1. Da [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) copia la
   chiave segreta e quella pubblicabile in `STRIPE_SECRET_KEY` e
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Crea un endpoint webhook che punti a
   `https://TUO-DOMINIO/api/webhooks/stripe`, sottoscritto all'evento
   `checkout.session.completed`.
3. Copia il *signing secret* dell'endpoint in `STRIPE_WEBHOOK_SECRET`.
4. In locale: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Sottoscrivi l'endpoint anche a **`checkout.session.expired`**: serve a
liberare le scorte di chi apre il pagamento e non lo conclude.

**Non serve creare prodotti o prezzi nel catalogo Stripe.** Le righe vengono
inviate con `price_data`, cioè costruite al volo da quelle dell'ordine: il
catalogo resta uno solo, quello del sito, e non c'è un secondo listino da
tenere allineato quando cambi un prezzo dall'admin. Bastano le chiavi.

L'integrazione usa l'API REST via `fetch` e `node:crypto`: nessun SDK da
installare o aggiornare. La firma dei webhook è verificata con confronto a
tempo costante e finestra di tolleranza di 5 minuti, quindi una richiesta
catturata non può essere riusata per dichiarare pagato un ordine.

**Un ordine diventa pagato solo dal webhook**, mai dal ritorno del cliente sul
sito: chi torna da Stripe può arrivare sulla conferma prima dell'incasso, e un
redirect nel browser non è una prova di pagamento.

---

## Scorte e manutenzione notturna

Lo stock viene scalato **quando l'ordine viene creato**, non quando il
pagamento arriva. È l'unico modo per impedire che due persone comprino
l'ultimo pezzo nello stesso istante — ma ha un rovescio: un checkout
abbandonato (la scheda di Stripe chiusa senza pagare) terrebbe quella merce
impegnata per sempre. Su qualche centinaio di pezzi e con i normali tassi di
abbandono, in poche settimane il negozio risulterebbe esaurito senza aver
venduto niente.

Tre cose lo impediscono:

1. **Webhook `checkout.session.expired`** — quando Stripe chiude una sessione
   non conclusa, l'ordine viene annullato e la merce torna a scaffale.
2. **`/api/cron/manutenzione`**, una volta al giorno — annulla gli ordini che
   hanno superato il tempo di attesa, libera le scorte, elimina le visite più
   vecchie di un anno e i carrelli fermi da due mesi. È la rete che funziona
   anche se un webhook si perde, e l'unica che copre il pagamento per bonifico.
3. **Avviso in dashboard** con un pulsante per liberarle subito, quando
   qualcuno si accorge che un formato risulta esaurito e in magazzino c'è
   ancora.

Su Vercel il cron è già dichiarato in `vercel.json`; serve solo la variabile:

```
CRON_SECRET="..."          # openssl rand -base64 32
```

Altrove basta un cron di sistema:

```
0 4 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://TUO-DOMINIO/api/cron/manutenzione
```

### Quanto si aspetta

L'attesa non è la stessa per tutti, perché i due casi non si somigliano:

| Metodo | Attesa | Perché |
|---|---|---|
| Carta (Stripe) | 36 ore | Stripe fa scadere la sessione dopo 24 ore: oltre, il pagamento non può più arrivare. |
| Bonifico | 10 giorni | Un ordine del venerdì sera con bonifico avviato lunedì arriva mercoledì. Annullarlo dopo due giorni cancellerebbe l'ordine di qualcuno mentre i suoi soldi sono in viaggio. |

Le soglie stanno in `STALE_HOURS`, in `src/services/maintenance.ts`.

### Cosa viene restituito

Un ordine non impegna soltanto la merce: consuma anche **un utilizzo del codice
sconto**. Annullamento manuale, scadenza della sessione e manutenzione notturna
passano tutti dalla stessa funzione (`restoreOrderReservations`), che rimette a
posto entrambe le cose. Erano tre percorsi separati, e tutti e tre si
dimenticavano il coupon: un codice limitato a cento usi si sarebbe esaurito sui
carrelli abbandonati senza portare una vendita.

Nessun ordine **pagato** viene mai toccato dalla manutenzione, e ogni
annullamento automatico lascia la motivazione nelle note interne dell'ordine.

---

## Email di conferma

Quando qualcuno ordina parte una conferma con numero d'ordine, riepilogo e
indirizzo di spedizione. Con Stripe ne parte una seconda quando l'incasso è
confermato dal webhook: la prima diceva "in attesa di pagamento", la seconda
dice la cosa giusta.

Serve **`EMAIL_FROM`** più **una** chiave:

```
EMAIL_FROM="ordini@tuodominio.it"
RESEND_API_KEY="re_..."     # oppure BREVO_API_KEY="..."
```

Il dominio del mittente va verificato presso il provider (record SPF e DKIM),
altrimenti i messaggi finiscono nello spam o vengono rifiutati.

### Senza provider configurato

Il sito **non finge**. L'ordine viene registrato normalmente, ma:

- la pagina di conferma scrive «Non ti abbiamo inviato un'email di conferma» e
  indica come recuperare il riepilogo, invece di dire «ti abbiamo scritto»;
- l'esito viene salvato sull'ordine (`confirmationEmailSentAt`), quindi
  `/admin/orders/<id>` mostra se l'email è partita, quando, e se no perché;
- da lì si rimanda con un clic, appena il provider è configurato;
- la checklist di lancio segnala la voce come **bloccante**.

In sviluppo il messaggio viene scritto per intero nel log del server: si può
leggere il contenuto senza spedire niente.

Aggiungere un terzo provider: una funzione in `src/lib/email/providers.ts` e
una riga in `src/lib/email/index.ts`. Il resto del progetto conosce solo
`sendEmail`.

---

## Immagini

Prodotto, packaging e biscotti sono **disegnati in vettoriale**
(`src/components/brand/`), non sono placeholder grigi: la confezione si ridisegna
da sola quando cambia `BRAND_NAME`.

Per passare alle fotografie vere: [`docs/PHOTO-BRIEF.md`](docs/PHOTO-BRIEF.md)
contiene la lista degli scatti e le costanti di luce e styling;
[`config/images.ts`](config/images.ts) è l'unico file da modificare per
sostituirle.

---

## Struttura

```
config/          brand, sito, font, immagini   ← il rebrand passa da qui
prisma/          schema, migrazioni, seed
src/
  app/           (site) pubblico · admin · api
  components/    brand · ui · layout · marketing · commerce · magazine · admin
  lib/           db, utils, formattazione
  services/      accesso ai dati e registro dei contenuti
public/images/   destinazione delle fotografie
docs/            architettura, brief fotografico
```

---

## Copy modificabile

I testi della homepage non sono nel codice: stanno nel database
(`SiteSetting`), con schema e valore di partenza dichiarati in
`src/services/content.registry.ts`. Se qualcuno salva un valore che non
rispetta lo schema, il sito ricade sul default invece di rompersi.

Aggiungere un blocco di testo modificabile = aggiungere una voce a quel registro.

---

## Prima del lancio

- [ ] Scegliere il nome definitivo e aggiornare `BRAND_NAME`
- [ ] Validare valori nutrizionali, ingredienti e allergeni, e alzare `isConfirmed`
- [ ] Far redigere le cinque pagine legali
- [ ] Sostituire le immagini vettoriali con le fotografie
- [ ] Eliminare recensioni e ordini demo dall'admin
- [ ] Configurare Stripe (chiavi + webhook, incluso `checkout.session.expired`)
- [ ] Configurare l'invio email (`EMAIL_FROM` + una chiave) e verificare SPF/DKIM
- [ ] Impostare `CRON_SECRET` e verificare che la manutenzione notturna giri
- [ ] Attivare o eliminare il coupon di esempio `BENVENUTO10` (creato disattivato)
- [ ] Configurare il provider newsletter e gli analytics (Fase 5)
- [ ] Portare `NEXT_PUBLIC_ALLOW_INDEXING` a `true`
- [ ] Cambiare la password dell'utente admin creato dal seed
