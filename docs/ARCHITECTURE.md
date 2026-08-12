# [BRAND NAME] — Blueprint di progetto

> Fase 0. Documento di architettura approvato **prima** della scrittura del codice, come
> richiesto dal brief. Ogni fase successiva si misura contro questo documento.

---

## 0. Premesse non negoziabili

| Vincolo | Conseguenza tecnica |
|---|---|
| Il nome del brand non è deciso | Un'unica costante `BRAND_NAME` in `config/brand.ts`. Zero occorrenze hardcoded nel codice, nel copy o nei metadata. |
| Ricetta, valori nutrizionali, allergeni e shelf-life non sono confermati | Ogni dato di questo tipo vive nel database con un flag `isConfirmed`. Se `false`, il frontend stampa il badge `DA CONFERMARE`. Nessun claim salutistico hardcoded. |
| Le pagine legali richiedono revisione di un legale | Modello `LegalPage` con flag `needsLegalReview` + banner visibile in admin e in pagina. |
| Non è una demo | Il carrello vive nel database, gli ordini si creano davvero, l'admin scrive davvero. Nessun mockup statico dove una funzione è implementabile. |
| Il traffico arriva da IG/TikTok | Mobile-first non è uno slogan: si progetta il mobile e si adatta il desktop. |

---

## 1. Stack

| Livello | Scelta | Motivo |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript strict** | Server Components per SEO e performance, Server Actions per le mutazioni, un solo deploy per frontend + admin + API. |
| Styling | **Tailwind CSS v4** con design token in `@theme` | I token del brand diventano variabili CSS native: cambiare palette = cambiare un file. |
| Database | **PostgreSQL** | Relazionale: ordini, varianti, coupon e contenuti editoriali hanno relazioni vere. Compatibile Supabase / Neon / Postgres self-hosted senza modifiche al codice. |
| ORM | **Prisma** | Schema unico e tipizzato, migrazioni versionate, seed riproducibile. |
| Validazione | **Zod** | Uno schema per input, condiviso tra Server Action e form. |
| Auth admin | **Sessione JWT httpOnly (`jose`) + hash `bcrypt`** | Nessuna dipendenza pesante, middleware che protegge `/admin/*`, ruoli `ADMIN` / `EDITOR`. |
| Editor blog | **TipTap** | Output JSON strutturato (portabile, interrogabile per l'analisi SEO) + HTML renderizzato e sanificato. |
| Pagamenti | **Adapter pattern**, provider Stripe pronto | Il checkout funziona da subito con provider `manual`; si attiva Stripe con una variabile d'ambiente, senza riscrivere il flusso ordini. |
| Deploy | Vercel (o qualsiasi host Node) + Postgres gestito | — |

**Nessun pagamento inventato.** L'interfaccia `PaymentProvider` ha due implementazioni: `manual`
(ordine creato in stato `pending`, per test e bonifico) e `stripe` (Checkout Session + webhook).

---

## 2. Struttura delle cartelle

```
config/          brand.ts, site.ts, nav.ts, seo.ts, analytics.ts   ← si tocca questo per il rebrand
src/
  app/
    (shop)/      home, shop, product, cart, checkout, account, pagine editoriali
    (magazine)/  magazine, articolo, categoria, tag
    (legal)/     privacy, cookie, termini, spedizioni, resi, contatti
    admin/       dashboard e CRUD, protetta da middleware
    api/         webhook Stripe, upload media, newsletter, tracking
  components/
    ui/          primitivi: Button, Input, Badge, Dialog, Sheet, Table, Toast…
    marketing/   Hero, ProductShowcase, BenefitGrid, IngredientList, HowItWorks, SocialProof, FaqAccordion
    commerce/    ProductCard, VariantPicker, AddToCart, CartDrawer, CartLine, CheckoutForm, OrderSummary
    magazine/    ArticleCard, ArticleBody, CategoryPill, ShareBar, RelatedPosts
    admin/       DataTable, FormField, MediaPicker, SeoPanel, StatCard, StatusBadge
    seo/         JsonLd (Product, Article, Breadcrumb, FAQ, Organization)
    brand/       Logo, CookieShape (♥/⚡/🧪), PackShot, PatternBackground   ← arte SVG del brand
  lib/           db, auth, cart, pricing, seo, slug, format, sanitize, validators
  services/      product, order, cart, post, media, customer, newsletter, analytics
  types/         tipi condivisi non derivati da Prisma
  hooks/         useCart, useMediaQuery, useToast, useScrollDirection
prisma/          schema.prisma, migrations/, seed.ts
public/images/   product/, packaging/, lifestyle/, social/, magazine/, brand/
```

Regola: **nessuna pagina monolitica**. Una route compone sezioni; ogni sezione è un componente
riutilizzabile che riceve dati già risolti dal server.

---

## 3. Schema del database

### Commerce

| Modello | Campi chiave | Note |
|---|---|---|
| `Product` | slug, name, subtitle, description, status, unitsPerBox, seo* | Il prodotto è "la scatola". |
| `ProductVariant` | productId, name (1/3/6 box), boxCount, sku, priceCents, compareAtCents, stock, isDefault | **I bundle sono varianti**: aggiungere un 12-box è una riga in admin, non codice. |
| `ProductImage` | productId, url, alt, sortOrder, kind (hero/macro/pack/lifestyle) | `alt` obbligatorio a livello di validazione. |
| `Flavor` | slug, name, shapeKey (`life`\|`energy`\|`potion`), colorHex, description, sortOrder | Nuovi gusti e nuove forme senza toccare i componenti. |
| `NutritionFact` | productId, key, label, value, unit, **isConfirmed** | Se `isConfirmed = false` → badge `DA CONFERMARE`. |
| `Ingredient` | productId, name, note, **isConfirmed**, sortOrder | Idem, più lo stato globale "Ricetta in sviluppo". |
| `Allergen` | productId, label, **isConfirmed** | Nessun claim "senza glutine/lattosio" finché non confermato. |
| `Review` | productId, authorName, rating, title, body, isPublished, **isDemo** | I dati seed sono marcati `isDemo`: l'admin li vede etichettati e li elimina in blocco. |
| `Cart` / `CartItem` | token (cookie httpOnly), variantId, quantity | Carrello server-side: sopravvive al refresh e al cambio device sullo stesso browser. |
| `Coupon` | code, type (PERCENT/FIXED/FREE_SHIPPING), value, minSubtotalCents, expiresAt, usageLimit, usedCount, active | |
| `ShippingRate` | name, priceCents, freeOverCents, active | Soglia di spedizione gratuita configurabile. |
| `Customer` | email (unique), firstName, lastName, phone, marketingConsent | Aggregati (ordini, totale speso, ultimo ordine) calcolati, non duplicati. |
| `Order` | number, customerId, email, status, subtotal/discount/shipping/tax/total, couponCode, paymentProvider, paymentRef, paymentStatus, indirizzi | `number` leggibile tipo `BN-2026-0001`. |
| `OrderItem` | orderId, variantId, **nameSnapshot, unitPriceCents** | Snapshot: cambiare il prezzo non riscrive la storia degli ordini. |

Stati ordine: `pending → paid → processing → shipped → delivered`, più `cancelled` e `refunded`.

### Contenuti

| Modello | Campi chiave |
|---|---|
| `Post` | slug, title, excerpt, contentJson (TipTap), contentHtml, status (`DRAFT`/`SCHEDULED`/`PUBLISHED`), publishedAt, scheduledFor, authorId, categoryId, featuredImageId, **focusKeyword**, seoTitle, metaDescription, canonicalUrl, ogTitle, ogDescription, ogImageId, wordCount, readingMinutes |
| `Category` | slug, name, description, colorHex, seoTitle, metaDescription — seed: FOOD, PROTEINE, BENESSERE, FITNESS, NUTRIZIONE, LIFESTYLE |
| `Tag` + `PostTag` | many-to-many |
| `Media` | filename, url, alt, width, height, sizeBytes, mimeType, folder |
| `FaqItem` | question, answer, group, sortOrder, **isConfirmed** |
| `LegalPage` | slug, title, bodyHtml, **needsLegalReview**, updatedAt |
| `SiteSetting` | key + valueJson — announcement bar, headline hero, benefit cards, copy delle sezioni |
| `NewsletterSubscriber` | email, name, source, status |
| `PageView` | path, referrer, createdAt — alimenta il KPI "Blog Traffic" con dati reali, non finti |
| `AdminUser` | email, passwordHash, name, role, bio, avatarUrl — è anche l'autore degli articoli |

---

## 4. Mappa delle route

**Pubbliche** — `/` · `/shop` · `/product/[slug]` · `/cart` · `/checkout` ·
`/order-confirmation/[number]` · `/account` · `/il-nostro-biscotto` · `/ingredienti` ·
`/magazine` · `/magazine/[slug]` · `/magazine/categoria/[slug]` · `/magazine/tag/[slug]` ·
`/faq` · `/contatti` · `/legal/[slug]` · `/sitemap.xml` · `/robots.txt` · `not-found`

`/account` funziona con **order lookup** (email + numero ordine): niente password per il cliente
al lancio, ma lo schema `Customer` è già pronto per aggiungere l'autenticazione dopo.

**Admin** — `/admin/login` · `/admin` · `/admin/products[/new|/[id]]` · `/admin/flavors` ·
`/admin/orders[/[id]]` · `/admin/customers[/[id]]` · `/admin/blog[/new|/[id]]` ·
`/admin/blog/categories` · `/admin/media` · `/admin/faq` · `/admin/content` ·
`/admin/coupons` · `/admin/newsletter` · `/admin/settings`

**API** — `/api/webhooks/stripe` · `/api/media/upload` · `/api/newsletter` · `/api/track`
(tutto il resto passa da Server Actions, non da endpoint REST fittizi)

---

## 5. Design system

### Palette (design token)

| Token | Hex | Uso |
|---|---|---|
| `panna` | `#FDFBF6` | sfondo pagina |
| `crema` | `#F4EADA` | superfici, card |
| `cacao` | `#241812` | testo, sfondi scuri |
| `cacao-soft` | `#6B5445` | testo secondario |
| `fiamma` | `#FF4B26` | **accent brand**: CTA, prezzo, dettagli |
| `life` | `#E23D2E` | Choco Chip ♥ |
| `energy` | `#F5C518` | Double Choc ⚡ |
| `potion` | `#C98A3F` | Peanut Choc 🧪 |

Ogni gusto porta la sua terna `bg / ink / accent`, così una nuova referenza si aggiunge
dal CMS scegliendo un colore, senza toccare i componenti.

### Tipografia

- **Display** — grotesque contemporanea, larga, con carattere. Titoli in maiuscolo stretto,
  tracking negativo. È la voce del brand.
- **Testo** — sans neutra e leggibile, ottima a 15–16px su mobile.

Scala fluida con `clamp()`: una sola scala per mobile e desktop, niente breakpoint tipografici.

### Regole visive

Food first. La fotografia (o l'illustrazione) del prodotto domina; il testo la accompagna.
Angoli morbidi, ombre calde mai grigie, grana leggera sulle superfici crema, forme dei tre
power-up usate come elementi grafici ricorrenti (bullet, divisori, pattern) — mai come icone
da videogioco. Le animazioni servono a far capire cosa è successo (aggiunta al carrello,
comparsa del prodotto), non a decorare.

### Accessibilità

Contrasto AA verificato su tutte le coppie della palette, HTML semantico, focus ring visibile
in `fiamma`, navigazione completa da tastiera, `alt` obbligatorio a livello di database,
`prefers-reduced-motion` rispettato.

---

## 6. Architettura admin

Layout a sidebar, protetto da middleware sul segmento `/admin`. Ogni entità segue lo stesso
schema: `DataTable` (ricerca, filtri, ordinamento, paginazione server-side) → pagina di
dettaglio con form validato Zod → Server Action → `revalidatePath`.

Tre componenti trasversali:

- **`SeoPanel`** — riutilizzato da articoli, prodotti e categorie. Mostra focus keyword,
  SEO title con contatore, meta description con contatore, slug, anteprima SERP, word count,
  struttura degli heading e link interni rilevati. Analisi reale sul contenuto TipTap, non un
  clone di Yoast.
- **`MediaPicker`** — dialog sulla libreria media con upload, ricerca e campo `alt` obbligatorio.
- **`ConfirmableField`** — l'input con l'interruttore `DA CONFERMARE` per nutrizionali,
  ingredienti, allergeni e FAQ.

Dashboard: revenue, ordini, AOV, clienti, conversion rate, pezzi venduti, traffico magazine.
Calcolati sui dati reali del database; quando il database è appena seedato i valori derivano da
ordini demo **marcati come tali** e filtrabili con un interruttore.

---

## 7. SEO

Metadata dinamici per ogni route, `sitemap.ts` e `robots.ts` generati dal database, canonical
su ogni pagina, Open Graph e Twitter card, immagini OG generate dove non caricate.
JSON-LD: `Organization` + `WebSite` globali, `Product` con `Offer` e `AggregateRating` (solo su
recensioni reali pubblicate), `Article`, `BreadcrumbList`, `FAQPage`.
Analytics (GA4, Search Console, Meta Pixel, TikTok Pixel) caricati **solo** se la relativa
variabile d'ambiente è valorizzata: nessun ID reale nel repository.

---

## 8. Piano di lavoro

| Fase | Contenuto | Stato |
|---|---|---|
| **0** | Architettura, schema, design system, route map | ✅ questo documento |
| **1** | Scaffold, token, tipografia, logo e arte SVG del brand, homepage completa | ⏳ |
| **2** | Shop, pagina prodotto, carrello, checkout, bundle, ordini | ⏳ |
| **3** | Admin: auth, dashboard, prodotti, ordini, clienti, media, settings | ⏳ |
| **4** | Magazine: liste, articolo, editor TipTap, pannello SEO | ⏳ |
| **5** | Sitemap, robots, structured data, analytics, Open Graph | ⏳ |
| **6** | Mobile, performance, a11y, stati di caricamento/vuoto/errore, 404, UX checkout | ⏳ |

A ogni fase il progetto deve compilare. Niente codice morto, niente sezioni non collegate.

---

## 9. Scostamenti dal piano, e perché

Quattro cose sono uscite diverse da come erano previste in questo documento.

**Stripe è stato integrato davvero, non predisposto.** Il piano prevedeva un
adapter pronto e un provider stub. L'SDK ufficiale porta però un albero di
dipendenze considerevole per fare due chiamate HTTP e una verifica di firma:
con `fetch` e `node:crypto` l'integrazione è completa e reale, e non c'è un
pacchetto in più da tenere aggiornato. Il provider `manual` resta ed è quello
attivo finché non ci sono le chiavi.

**Le email transazionali non erano nel piano, e mancavano.** Il sito scriveva
"ti abbiamo scritto" senza che nessuna email partisse: una frase falsa nel
momento più delicato della transazione. È stato aggiunto `src/lib/email/`
(stesso approccio di Stripe: REST via `fetch`, nessun SDK) con una regola
sopra le altre — **un provider non configurato non restituisce mai successo**.
L'esito è salvato sull'ordine, il testo mostrato al cliente dipende da quel
campo, e l'area amministrativa permette di rimandare.

**Un ordine impegna due risorse, non una.** Oltre alla merce consuma un
utilizzo del codice sconto, e il ripristino era scritto a mano in tre punti
diversi che restituivano solo la prima. Ora esiste una funzione sola,
`restoreOrderReservations`, che le disfa entrambe: è l'unico modo perché i tre
chiamanti non tornino a divergere. Le attese prima di considerare perso un
ordine sono diverse per metodo di pagamento — trentasei ore per la carta, dieci
giorni per il bonifico — perché una soglia unica o tiene la merce ferma per
niente o annulla ordini mentre i soldi sono in viaggio.

**Lo stock non aveva un percorso di rilascio.** Il piano diceva "verifica e
decremento nella stessa transazione", ed era giusto per evitare la vendita
doppia dell'ultimo pezzo. Mancava il rovescio: un ordine mai pagato teneva la
merce impegnata a tempo indeterminato, e con i normali tassi di abbandono di un
checkout il magazzino sarebbe andato a zero senza vendite. Ora la merce torna
disponibile per tre strade — webhook di sessione scaduta, manutenzione
notturna, pulsante in dashboard — e nessuna delle tre tocca mai un ordine
pagato.

**La lista delle cose da fare prima del lancio è diventata una pagina, non un
capitolo di README.** Una lista scritta a mano invecchia il giorno dopo:
`/admin/settings` interroga database e ambiente a ogni caricamento e si spunta
da sola. Il README rimanda lì.

---

## 10. Quello che resta aperto

Due limiti noti, entrambi documentati nel README e nessuno dei due un difetto
del codice.

**Le immagini caricate dall'admin vanno sul disco del server.** Su una
piattaforma serverless quel disco è effimero e i file spariscono al rilancio.
Il punto da cambiare è `src/app/api/media/upload/route.ts` e nient'altro: il
resto del progetto conosce solo l'URL salvato in `Media.url`.

**Manca il sistema di gestione del consenso ai cookie.** Gli analytics sono
predisposti ma vanno caricati dopo l'accettazione, non al caricamento della
pagina; finché nessun ID è configurato non parte comunque nessuno script di
terze parti. Il punto in cui agganciarlo è `src/components/seo/Analytics.tsx`.

**Il livello del carrello rende dinamiche tutte le rotte pubbliche.** Leggere
il cookie del carrello nel layout serve ad avere il contatore già corretto
nell'HTML servito, senza il salto da zero a tre dopo l'idratazione. Il costo è
che nessuna pagina del negozio è statica. È la scelta giusta per un
e-commerce; se il magazine dovesse crescere molto, la strada è spostare il
carrello dietro un confine Suspense con il prerendering parziale.
