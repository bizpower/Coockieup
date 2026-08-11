# Brief fotografico — [BRAND NAME]

Il sito oggi disegna prodotto e packaging con componenti vettoriali. Questo
documento serve a sostituirli con fotografie vere senza perdere coerenza.

**Regola sopra tutte:** le immagini devono sembrare lo stesso brand. Stesso
packaging, stessa palette, stesse tre forme, stessa luce. Una gallery in cui
ogni scatto sembra un'azienda diversa è peggio del vettoriale.

---

## Costanti da non cambiare tra uno scatto e l'altro

| Elemento | Specifica |
|---|---|
| Fondo | Crema `#F4EADA` o panna `#FDFBF6`. Mai bianco puro, mai grigio. |
| Luce | Sorgente ampia e morbida da sinistra a 45°, riflettente a destra. Ombre calde e corte, mai doppie. |
| Temperatura | 5200–5600 K. Le ombre restano nella famiglia del cacao, mai bluastre. |
| Ottica | 90–105 mm macro per il prodotto, 50 mm per il lifestyle. Diaframma f/5.6–f/8: i biscotti devono essere nitidi da bordo a bordo. |
| Styling | Poche briciole, disposte. Niente spruzzi di latte, niente cioccolato colante, niente polvere proteica. Non è un integratore. |
| Post | Nessun viraggio freddo, nessuna saturazione spinta. Il biscotto deve sembrare cotto, non verniciato. |

Le tre forme devono restare riconoscibili in ogni scatto: **cuore** (Choco
Chip), **fulmine** (Double Choc), **ampolla** (Peanut Choc).

---

## Lista degli scatti

I percorsi corrispondono alle voci di `config/images.ts`. Consegna in JPEG di
qualità alta, lato lungo ≥ 2400 px.

### 1. `product/hero-pack.jpg` — 19:26 verticale
La confezione in piedi, leggermente di tre quarti, piena e con le pieghe che si
vedono. Tre o quattro mini cookie appoggiati alla base, uno per forma. Fondo
crema, ombra corta a terra. È l'immagine che regge la hero: deve funzionare
anche ritagliata in verticale stretto su mobile.

### 2. `packaging/pack-front.jpg` — 19:26 verticale
Fronte pack perfettamente frontale, luce piatta e uniforme, nessuna deformazione
prospettica. Serve per le card dei bundle: deve essere ritagliabile e
affiancabile a sé stesso.

### 3. `packaging/pack-open.jpg` — 4:3 orizzontale
Confezione aperta e coricata, i mini cookie che escono verso l'obiettivo. Si
devono contare, e si devono distinguere le tre forme.

### 4–6. `product/macro-*.jpg` — 1:1
Un macro per gusto, singolo biscotto al centro, spezzato a metà in almeno uno
scatto della serie per mostrare l'interno.
- `macro-choco-chip.jpg` — cuore, impasto dorato, gocce fondenti in superficie
- `macro-double-choc.jpg` — fulmine, impasto scuro al cacao
- `macro-peanut-choc.jpg` — ampolla, impasto ambrato, granella di arachide

### 7–9. `lifestyle/*.jpg` — 3:2
Contesti reali, luce naturale, nessun modello in tenuta da palestra.
- `scrivania.jpg` — confezione aperta accanto a un portatile, ore 16
- `zaino.jpg` — la confezione che spunta dalla tasca laterale di uno zaino
- `pausa-caffe.jpg` — due biscotti nel piattino di una tazzina, tavolino da bar

Altri contesti previsti dal brief e da coprire nella stessa sessione: viaggio,
colazione, palestra (borsone e bottiglia, **senza** estetica da bodybuilding).

### 10. `social/vertical-1.jpg` — 9:16
Verticale pieno per Instagram e TikTok. Lascia il 20% superiore e inferiore
libero da elementi importanti: lo coprono le interfacce delle app.

### 11. `social/og-default.jpg` — 1200×630
Anteprima di condivisione. Pack a sinistra, spazio a destra: il titolo della
pagina ci viene sovrapposto.

---

## Come sostituire una foto

1. Metti il file nel percorso esatto indicato in `config/images.ts`.
2. Nella stessa voce, porta `source` da `"vector"` a `"photo"`.
3. Controlla il testo di `alt`: descrive cosa si vede, non ripete il nome del prodotto.

Nessun altro file va toccato. `pendingPhotos()` restituisce in ogni momento
l'elenco degli scatti ancora mancanti.

---

## Se le foto vengono generate invece che scattate

Funziona, a due condizioni: partire sempre dalla stessa immagine di riferimento
del pack, e rigenerare l'intera serie quando il packaging cambia. Prompt base da
adattare a ciascuno scatto della lista:

> Professional food photography of a premium Italian mini cookie pouch standing
> on a warm cream background. Soft large key light from the upper left, warm
> short shadows, no blue tones. Three small cookies at the base: one heart
> shaped with dark chocolate chips, one lightning bolt shaped in dark cocoa
> dough, one flask shaped in amber peanut dough. Realistic baked texture, visible
> crumb. Shot on 100mm macro, f/6.3. Editorial, appetizing, not clinical, no
> gym or supplement styling.
