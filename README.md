# Andrea Farao — Photography & Film

Portfolio fotografico con frontend React, TypeScript e Vite, CMS Node.js/Express
e distribuzione Docker/Nginx.

## Struttura

- `frontend/src/portfolio/`: interfaccia pubblica editoriale, stili e contenuti About/Contact.
- `frontend/src/pages/Admin.tsx`: pannello di gestione dei progetti.
- `frontend/src/shared/`: componenti, contesti e hook condivisi con il CMS.
- `frontend/public/portfolio/`: font e ritratti della sezione About.
- `backend/`: autenticazione, API di amministrazione ed elaborazione immagini/video.
- `docker-compose.yml`: frontend e backend sulla rete esterna `web-proxy`.

## Pagine e contenuti

- `/`: fotografie in evidenza, archivio progetti, About e Contact.
- `/projects`: archivio con la stessa interfaccia della home.
- `/gallery`: raccolta delle fotografie dei progetti, senza duplicati.
- `/projects/:slug`: galleria, eventuale video e collegamento Instagram.
- `/admin`: gestione e caricamento dei contenuti.

Il portfolio legge `/projects.json` e `/imageMeta.json` generati dal CMS. Le foto
in evidenza seguono la selezione "migliori scatti", con le copertine come alternativa.
Ogni progetto appartiene a una categoria: Moda, Beauty, Club, Video o Sport.
I filtri pubblici usano la categoria scelta nel CMS, indipendentemente dalla presenza
di un file video. La categoria è obbligatoria al caricamento e modificabile dalla
gestione progetti. La lightbox supporta
frecce da tastiera, Escape e scorrimento touch.

Il collegamento Instagram è attivo. La preview statica e il suo container sono stati rimossi.

## Sviluppo

Richiesti Node.js 20.19+ o una versione successiva supportata da Vite, npm e,
per la distribuzione, Docker Compose.

```bash
cd backend
npm ci
npm run dev
```

In un secondo terminale:

```bash
cd frontend
npm ci
npm run dev
```

Vite serve il sito su `http://localhost:5173` e inoltra `/api` al backend sulla porta
3001. Per usare i contenuti di produzione in sviluppo occorre fornire una copia
locale dei JSON e dei media nel percorso pubblico; non modificare i volumi di
produzione per le prove locali.

Configurare le credenziali e i percorsi attraverso `.env`, senza versionare segreti.
Vedere `docker-compose.yml` e `backend/server.js` per le variabili utilizzate.

## Distribuzione

La configurazione richiede la rete `web-proxy` e i volumi esterni
`faraostudio_public_assets` e `faraostudio_backend_data` già predisposti.

```bash
docker compose up -d --build
```

Per aggiornare solo il frontend:

```bash
docker compose build sito-rafa
docker compose up -d --no-deps sito-rafa
```

L'entrypoint sostituisce i file dell'app conservando nel volume condiviso
`projects.json`, `imageMeta.json`, `masonryLayouts.json` e `optimized/`, senza
ricopiare l'archivio multimediale. Nginx inoltra `/api/` al backend.
Non eliminare i volumi durante gli aggiornamenti.

## Verifiche

```bash
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

Prima di rimuovere materiale di lavoro, verificare home desktop/mobile,
apertura dei progetti, lightbox, filtri, login admin e `/api/admin/health`.

Realizzato da Andrea Mauri — [@Payd3r](https://github.com/Payd3r).

## Immagini responsive e verifiche delle prestazioni

Non sono previsti selettori di lingua o tema. I contatti sono attivi:
`insidefaraostudio@gmail.com` e WhatsApp `+39 349 215 2369`.

Ogni nuovo upload genera varianti AVIF/WebP a 320, 640, 960 e 1600 pixel
(senza ingrandire gli originali), dimensioni reali e un placeholder inline.
I nomi includono un hash SHA-256 del contenuto e della ricetta di compressione:
Nginx può conservarli per un anno con `immutable`; i JSON usano una cache breve di 30 secondi con rivalidazione in background e ETag.
I file originali restano disponibili sul server e non vengono scaricati per le griglie.

Il componente `SmartImage` usa `picture`, `srcset` e `sizes`, riserva spazio tramite
aspect ratio, mostra skeleton e placeholder, carica prima la foto principale e
rinvia quelle fuori schermo. Quando Network Information segnala Save-Data o rete
lenta, limita le varianti a 640 px, riduce l'anticipo e disattiva il prefetch della
lightbox. Nei browser senza questa API restano attivi responsive images e lazy loading.
Un errore prova le alternative disponibili e poi offre un nuovo tentativo; il ritorno
online riattiva le immagini fallite. La durata effettiva dipende comunque dalla rete.

Per migrare un archivio esistente, dopo un backup dei JSON:

```bash
docker compose exec sito-rafa-backend node scripts/optimize-responsive.js
docker compose exec sito-rafa-backend node scripts/publish-responsive.js
```

La generazione è ripetibile: riusa le varianti già presenti e pubblica i nuovi
metadati dopo la codifica. Non cancella originali o vecchie varianti.

Test della pipeline: `node --test backend/scripts/test-responsive.mjs`.
I benchmark e le verifiche browser sono in `scripts/`. Dopo `npm ci` nel frontend,
eseguire `npx playwright install chromium` dalla stessa cartella. Dalla root,
impostare `BENCH_URL` all'indirizzo del sito; `PLAYWRIGHT_MODULE` è un override
opzionale del percorso del modulo Playwright. I risultati e i limiti di misurazione sono in
`benchmarks/REPORT.md`. I benchmark non inviano né modificano progetti del CMS.

## Categorie dei progetti

Valori API: `moda`, `beauty`, `eventi-club`, `video`, `sport`.
`POST /api/admin/projects` richiede `category`; `PATCH /api/admin/projects/:slug`
consente di modificarla e rifiuta valori non previsti con HTTP 400.

Test di creazione, modifica e pubblicazione:
`node --test backend/scripts/test-project-categories.mjs`.

Per assegnare categorie temporanee ai soli progetti senza una categoria valida:
`docker compose exec sito-rafa-backend node scripts/assign-temporary-categories.js`.
Lo script salva prima un backup nel volume dati, distribuisce casualmente le
categorie e rigenera il JSON pubblico. Le categorie già valide vengono preservate.

## SEO e dominio pubblico

Procedura DNS/HTTPS, configurazione, Search Console, strategia locale e AI:
[docs/PUBBLICAZIONE-SEO.md](docs/PUBBLICAZIONE-SEO.md).
Usare `.env.example` come riferimento; non sovrascrivere `.env` esistenti.
L'indicizzazione richiede `SITE_URL` definitivo e `SEO_INDEXABLE=true` nel backend.
La distribuzione SEO richiede la ricostruzione di **frontend e backend**.
