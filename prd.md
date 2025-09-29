## PRD — Landing page Fotografo (React + Vite + Tailwind)

### 1. Scopo e obiettivi
- **Obiettivo**: realizzare un sito elegante e minimale per presentare progetti e fotografie di un fotografo, ispirato allo stile dello screenshot fornito (b/n, tipografia decisa, layout spigoloso, nessun bordo stondato).
- **KPI**: tempo di caricamento LCP < 2.5s su 4G, CLS ≈ 0, tasso di apertura overlay immagini > 30%, iscrizioni newsletter.
- **Piattaforma**: SPA con React + Vite, styling con TailwindCSS.

### 2. Architettura informativa (pagine e sezioni)
1) **Home**
   - Hero full‑width con immagine di forte impatto, titolo in uppercase, sottotitolo descrittivo, CTA "Read more" (stile screenshot).
   - Sezione "My Latest Works" (titolo uppercase centrato).
   - Griglia "Ultimi lavori" (anteprime foto; interazione overlay on click).
   - Banner newsletter scuro full‑width con input email e CTA "Subscribe".
   - Sezione "Migliori progetti" con card progetto (cover, titolo, anno, breve descrizione) e link a dettaglio.
   - Pulsante "Load more" dove previsto.

2) **Galleria**
   - Layout **masonry articolato**: foto di input tutte con stessa dimensione; la griglia deve variare dimensioni via spans (col/row‑span) per creare ritmo visivo.
   - Filtro opzionale per categorie/tag (estensibile, inizialmente nascosto o secondario).
   - Overlay/lightbox su click con zoom, navigazione prev/next, pulsante **Download originale**.

3) **Progetti**
   - Elenco card progetto (thumbnail, titolo, data, breve testo). Layout a griglia.
   - Clic su card porta a **Project Detail**: titolo, data, descrizione, galleria foto in masonry articolata (stessa logica della Galleria) + overlay con download.

### 3. Brand, stile visivo e tipografia
- **Palette** (derivata dallo screenshot b/n con accento sabbia):
  - Nero profondo: `#0B0B0B`
  - Carbone: `#141414`
  - Grigio 700: `#4D4D4D`
  - Grigio 400: `#9A9A9A`
  - Bianco: `#FFFFFF`
  - Accento sabbia (bottoni/hover): `#C7B299`
- **Linee guida**: contrasti alti, spaziatura generosa, nessun raggio bordo (all `rounded-none`).
- **Tipografia**: font primario "Oswald" (Google Fonts), uppercase per titoli.
  - Dimensioni fisse per coerenza (con scaling responsivo):
    - Display/Hero: 56px desktop, 40px tablet, 32px mobile
    - H2 sezione: 32px desktop, 28px tablet, 24px mobile
    - H3/card title: 24px, 20px, 18px
    - Body: 16px desktop/tablet, 15px mobile
    - Overline/eyebrow: 12px tracking‑wide
- **Iconografia**: minimale, monocromatica.
- **Animazioni**: micro‑transizioni su hover/overlay (opacity/scale leggere, durata 150–200ms, easing `ease-out`).

### 4. UX/UI e componenti chiave
- **Header/Nav**: sticky, trasparente su hero e solido (nero) on scroll; link: Home, Galleria, Progetti.
- **Hero**: immagine b/n, titolo "WORLD CLASS PHOTOGRAPHY" in uppercase, sottotitolo descrittivo breve, CTA.
- **Section Title**: centrato, uppercase, tracking aumentato.
- **Griglie foto**: cards rettangolari con `object-cover`, bordo 1px `#141414` dove necessario, hover: leggero brighten.
- **Masonry**: CSS Grid con colonne fluide; assegnazione programmata di `row-span`/`col-span` per varietà (pattern ripetibile). Nessuna distorsione/aspect‑ratio forzata.
- **Project Card**: cover, titolo, anno, link dettagli.
- **Newsletter Banner**: full‑width su fondo scuro, input email + CTA accento sabbia.
- **Overlay/Lightbox**: fullscreen scuro 90%, immagine centrata, controlli prev/next, chiusura su ESC/click sul backdrop, pulsante download originale.
- **Footer**: minimale, note copyright, social opzionali.

### 5. Requisiti funzionali
- Click su QUALSIASI foto apre overlay con:
  - zoom (pinch su mobile), navigazione con frecce/tasti, indicatore `n/N`.
  - **Download** del file originale (stessa URL sorgente o endpoint dedicato). 
- Griglie con **Load more** per evitare lunghi scroll e migliorare performance.
- Routing client‑side: `/` (home), `/gallery`, `/projects`, `/projects/:slug`.
- Form newsletter: validazione email lato client; integrazione provider (es. Mailchimp) opzionale, inizialmente mock.

### 6. Requisiti non funzionali
- **Performance**: immagini in `webp` per preview, lazy‑load, `srcset/sizes`, prefetch on hover. Originale per download non compresso (jpg/png). 
- **Responsive**: mobile‑first; breakpoint Tailwind `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.
- **A11y**: testo alternativo per immagini, focus states visibili, overlay accessibile (trap focus, ESC chiude), contrasti AA.
- **SEO**: meta title/desc per pagina, OpenGraph, sitemap.xml, robots.txt, semantica corretta.
- **Code quality**: componenti riusabili, tipizzazione leggera con JSDoc o TS opzionale; struttura chiara.

### 7. Tecnologia e setup
- **Stack**: React 18, Vite, TailwindCSS.
- **Font**: Google Fonts (Oswald). Caricamento `display=swap`.
- **Gestione immagini**: asset locali in `public/` per prototipo; in produzione S3/Cloudinary (non incluso in MVP).

### 8. Struttura progetto (proposta)
```
src/
  components/
    Header.tsx
    Footer.tsx
    Hero.tsx
    SectionTitle.tsx
    PhotoCard.tsx
    ProjectCard.tsx
    MasonryGrid.tsx        // grid con pattern spans
    Lightbox.tsx           // overlay con download
    NewsletterBanner.tsx
  pages/
    Home.tsx
    Gallery.tsx
    Projects.tsx
    ProjectDetail.tsx
  data/
    photos.ts              // lista foto con urls, alt, originalUrl
    projects.ts            // progetti: slug, titolo, data, descrizione, cover, gallery
  routes/
    AppRoutes.tsx
  styles/
    tailwind.css
```

### 9. Tailwind — design tokens
`tailwind.config.js`
```js
theme: {
  extend: {
    colors: {
      black: '#0B0B0B',
      charcoal: '#141414',
      gray700: '#4D4D4D',
      gray400: '#9A9A9A',
      sand: '#C7B299',
    },
    fontFamily: { sans: ['Oswald', 'ui-sans-serif', 'system-ui'] },
    borderRadius: { none: '0' },
  }
}
```
Regole comuni: `rounded-none` globale, `tracking-wider` per titoli, `uppercase` per H1/H2, bordi 1px `charcoal` dove utile.

### 10. Logica Masonry (criteri)
- Layout con CSS Grid (`grid-auto-rows: 6px` + `gap: 12px`), ogni item ha `grid-row-end: span n` calcolato su base dell’altezza reale.
- Poiché le foto di input sono uguali, applichiamo un **pattern deterministico** di spans per varietà:
  - Desktop (≥1024px): 4 colonne; pattern ripetuto ogni 10 elementi: `[2,2,3,2,3,2,2,3,2,4]` (row‑span).
  - Tablet (≥768px): 3 colonne; pattern ridotto `[2,3,2,2,3,2]`.
  - Mobile: 2 colonne; pattern `[2,3,2,2]`.
- Alcuni item usano anche `col-span` per creare macro‑ritmo (1 su 8 elementi).

### 11. Overlay/Lightbox (criteri)
- Fullscreen, background `rgba(0,0,0,0.9)`, contenuto centrato max‑width 90vw/90vh.
- Controlli: chiudi (X), prev/next, indice, tasto **Download** (link a `originalUrl`, `download` attribute).
- Keyboard: `Esc` chiude, `ArrowLeft/Right` navigano, `Enter` scarica se focus su download.
- Accessibilità: aria‑modal, role dialog, trap focus.

### 12. Contenuti e dati
- `photos.ts`: `{ id, src, alt, originalUrl, tags? }`.
- `projects.ts`: `{ slug, title, dateISO, description, cover, gallery[] }`.
- Testi: italiano, tono sobrio e professionale.

### 13. Criteri di accettazione
- Home rispetta sezioni richieste e tipografia/palette definite.
- Galleria e Project Detail mostrano **masonry articolato** con pattern spans funzionante su tutti i breakpoint.
- Overlay apribile da qualsiasi immagine, con zoom/navigazione/download operativo.
- Nessun elemento con bordi arrotondati.
- Lighthouse (mobile simulato): Performance ≥ 85, Accessibilità ≥ 90, Best Practices ≥ 90, SEO ≥ 90.
- Responsive testato su 360px, 768px, 1024px, 1440px.

### 14. Roadmap MVP → Plus
- **MVP**: pagine, masonry, overlay, newsletter mock, dati statici.
- **Plus**: filtri galleria, integrazione newsletter reale, CMS/headless, immagini servite da CDN, i18n.

### 15. Note di sviluppo
- Usare componenti altamente riusabili e prop‑driven.
- Preferire immagini WebP per le anteprime; precaricare la hero.
- Evitare dipendenze superflue; per lightbox implementazione custom con React Portal.


