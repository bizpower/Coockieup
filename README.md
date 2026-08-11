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
| 2 | Shop, prodotto, carrello, checkout, ordini | ⏳ |
| 3 | Admin: dashboard, prodotti, ordini, clienti, media | ⏳ |
| 4 | Magazine e editor articoli | ⏳ |
| 5 | Sitemap, structured data, analytics | ⏳ |
| 6 | Performance, accessibilità, stati, rifiniture | ⏳ |

Il blueprint completo è in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Installazione

Servono **Node 20+** e un **PostgreSQL** raggiungibile.

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
| `npm run dev` | Sviluppo |
| `npm run build` | Genera il client Prisma e compila |
| `npm run typecheck` | TypeScript senza emettere |
| `npm run db:migrate` | Crea e applica una migrazione |
| `npm run db:seed` | Popola il database (idempotente) |
| `npm run db:studio` | Esplora i dati in una UI |
| `npm run db:reset` | Azzera e riapplica tutto |

---

## Cambiare il nome del brand

Una riga, in `config/brand.ts`:

```ts
export const BRAND_NAME = "SGRANÀ";
```

Cambiala e si aggiornano logo, navbar, footer, **il disegno della confezione**,
i metadata, i dati strutturati e i titoli delle pagine. Nessun altro file
contiene il nome. Nello stesso file trovi anche il prefisso dei numeri d'ordine
(`BRAND_ORDER_PREFIX`), il payoff e i dati legali.

`SGRANÀ` è un segnaposto funzionante, scelto per poter giudicare il sito come
un brand vero invece che come un template pieno di `[BRAND NAME]`. Non è una
decisione presa.

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
- [ ] Configurare Stripe (Fase 2)
- [ ] Configurare il provider newsletter e gli analytics (Fase 5)
- [ ] Portare `NEXT_PUBLIC_ALLOW_INDEXING` a `true`
- [ ] Cambiare la password dell'utente admin creato dal seed
