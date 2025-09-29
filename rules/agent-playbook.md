## Playbook agenti e scaletta

### Fasi
1) Setup (Agente A — single): bootstrap repo, tooling, Tailwind, routing, tokens.
2) Pagine in parallelo:
   - Agente B: Home
   - Agente C: Galleria + Lightbox
   - Agente D: Progetti + Project Detail
3) Integrazione finale: test responsive/a11y/SEO, rifiniture.

### Coordinamento
- Ogni agente lavora su branch dedicato.
- Prima di iniziare: leggere `conventions.md`, `data-contracts.md`, `ui-tokens.md`, `masonry.md`.
- Se un agente modifica regole comuni, deve aprire PR che aggiorna i file in `rules/`.

### Prompt operativi

#### Agente A — Setup (esecuzione singola iniziale)
"""
Obiettivo: inizializzare progetto React + Vite + Tailwind conforme alle regole in rules/.

Passi:
1. Crea progetto Vite (React + TS opzionale). Installa Tailwind, autoprefixer, postcss.
2. Configura `tailwind.config.js` con i token in `rules/ui-tokens.md`.
3. Aggiungi Google Font Oswald (display=swap) e reset globale con `rounded-none`.
4. Imposta routing: `/`, `/gallery`, `/projects`, `/projects/:slug`.
5. Crea struttura cartelle come nel PRD (`src/components`, `src/pages`, `src/data`, `src/routes`).
6. Stub componenti: Header, Footer, SectionTitle, PhotoCard, ProjectCard, MasonryGrid, Lightbox, NewsletterBanner.
7. Aggiungi dati di esempio conformi a `rules/data-contracts.md`.
8. Verifica build e lint.
Output: repo avviabile, navigazione funzionante con placeholder.
"""

#### Agente B — Home
"""
Obiettivo: implementare la pagina Home seguendo PRD e `ui-tokens.md`.

Passi:
1. Implementa Hero (immagine b/n, titolo uppercase, sottotitolo, CTA).
2. Sezione "My Latest Works" + griglia anteprime (usa `MasonryGrid` o griglia semplice coerente con screenshot) con overlay on click.
3. Banner Newsletter full‑width scuro con input validato e CTA.
4. Sezione "Migliori progetti" usando `ProjectCard` con link a dettaglio.
5. Pulsante "Load more" dove previsto (mock).
6. Garantire responsive e nessun bordo stondato.
Output: `pages/Home.tsx` completa.
"""

#### Agente C — Galleria + Lightbox
"""
Obiettivo: pagina Galleria con masonry articolato e overlay.

Passi:
1. Implementa `MasonryGrid` secondo `rules/masonry.md` (pattern spans responsive).
2. Implementa `Lightbox` accessibile (trap focus, ESC, frecce, download link `originalUrl`).
3. Integra `MasonryGrid` e `Lightbox` in `pages/Gallery.tsx`.
4. Ottimizza immagini: lazy, srcset.
Output: Galleria navigabile, overlay su tutte le immagini.
"""

#### Agente D — Progetti + Dettaglio
"""
Obiettivo: pagina elenco progetti e dettaglio con masonry.

Passi:
1. `pages/Projects.tsx`: griglia `ProjectCard` conforme ai token.
2. `pages/ProjectDetail.tsx`: titolo, data, descrizione, galleria masonry (riuso `MasonryGrid` + `Lightbox`).
3. Navigazione da card a dettaglio via `slug`.
Output: sezione progetti completa, coerente con contratti dati.
"""

#### Agente E — QA/Polish (facoltativo, dopo integrazione)
"""
Obiettivo: migliorare performance/a11y/SEO.
Passi: Lighthouse, alt text, meta og, sitemap/robots, preload hero, controlli focus.
Output: report e fix PR.
"""


