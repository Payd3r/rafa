# Pubblicazione e SEO — Andrea Farao

## Stato e scelte

Pubblico italiano; zone operative confermate: province di Como, Lecco, Monza e Milano, con disponibilità nel Nord Italia. Nessun indirizzo fisico inventato. Dominio acquistato e principale configurato: https://andreafarao.com. Usare questo dominio per canonical, sitemap e Search Console. Gli eventuali domini alternativi devono reindirizzare con 301 al principale, senza duplicare il sito.

Il codice prepara HTML con contenuti e link già leggibili senza JavaScript, metadati per pagina e progetto, canonical, Open Graph, dati strutturati Person/CreativeWork e sitemap con immagini. La navigazione React aggiorna i metadati. La sitemap legge projects.json a ogni richiesta: aggiunte e rimozioni del CMS sono automatiche. /projects ha canonical sulla home perché oggi ne ripete il contenuto. Admin e pagine inesistenti sono noindex; gli URL sconosciuti restituiscono 404.

Le pagine sono indicizzabili soltanto con SITE_URL HTTPS valido e SEO_INDEXABLE=true. Il template statico di sviluppo resta noindex. robots.txt consente la scansione delle pagine così i motori possono leggere noindex; non è una protezione di accesso. Non vengono installati tracker né inviati dati a Google.

## Prima del dominio

1. Sostituire progetti di prova (test, aaa, titoli generici) con lavori reali prima di attivare l'indicizzazione. La sitemap include tutti i progetti pubblicati nel CMS.
2. Per ogni lavoro: titolo riconoscibile, foto selezionate e alt descrittivi. La descrizione SEO viene generata dal titolo e dal tipo di progetto. Gli alt delle gallerie restano generici: un editor di didascalie per foto è un miglioramento successivo.
3. Preparare dati del titolare, privacy e informazioni fiscali applicabili. Se in futuro si aggiungono analytics, pixel o embed, valutare informativa e consenso prima di attivarli.
4. Fare backup dei volumi faraostudio_public_assets e faraostudio_backend_data prima del rilascio. Conservare e verificare il ripristino anche dei media originali.

## DNS, server e HTTPS

Il progetto usa già Docker e reverse proxy: non serve spostarlo su un altro servizio per la SEO.

1. Acquistare il dominio in un proprio account con rinnovo automatico e autenticazione a due fattori. Non comunicare password nella chat.
2. Configurare il record A del dominio principale verso l'IPv4 pubblico del server. Inserire AAAA solo se IPv6 funziona davvero. Per www usare CNAME verso il dominio principale. Se si usa un tunnel/CDN, seguire i suoi record invece dell'A diretto. Non modificare record MX/TXT della posta senza necessità.
3. Nel reverse proxy esistente creare host andreafarao.com e www.andreafarao.com, destinazione sito-rafa:80 sulla rete web-proxy. Attivare certificato TLS valido e rinnovo automatico, redirect HTTP→HTTPS. Reindirizzare www→dominio principale con 301, conservando percorso e query. Se acquistati, anche gli altri domini devono reindirizzare al principale con certificato valido.
4. Il backend rimane interno, senza porte pubbliche. Limitare upload/API amministrative al necessario; Basic Auth richiede sempre HTTPS. Non riutilizzare credenziali di prova. Proteggere anche gli accessi al reverse proxy.
5. Nel .env esistente preservare le altre impostazioni e aggiungere:

```dotenv
SITE_URL=https://andreafarao.com
SEO_INDEXABLE=true
```

ADMIN_USER e ADMIN_PASS devono essere presenti e forti. Docker Compose rifiuta valori mancanti. Non versionare .env.

6. Ricostruire entrambi i servizi (la SEO viene servita dal backend, non basta aggiornare il frontend):

```bash
docker compose config --quiet
docker compose up -d --build sito-rafa-backend sito-rafa
```

Non usare down -v e non eliminare i volumi. L'entrypoint conserva JSON e archivio optimized. Il backend necessita del volume condiviso contenente index.html del frontend. Durante l'aggiornamento è possibile una breve indisponibilità.

7. Verificare HTTPS, redirect con percorso, home, progetto, gallery, login/upload admin, robots.txt, sitemap.xml e un URL inesistente. Visualizzare il sorgente HTML: titolo, canonical e contenuti devono essere già presenti. Verificare che X-Robots-Tag e meta robots permettano index sulle pagine pubbliche, e noindex su /admin. Eseguire lo script di audit sotto.

## Google e Bing

1. Creare una proprietà **Dominio** in Google Search Console con l'account del titolare; copiare il record TXT fornito da Google nel DNS e verificarlo. Non occorre modificare il sito per questo metodo.
2. Inviare https://andreafarao.com/sitemap.xml nella sezione Sitemap. Il riferimento è anche in robots.txt. La sitemap è dinamica: non va reinviata manualmente a ogni upload.
3. Ispezionare home e un progetto con Test URL pubblicato, verificare rendering e canonical. Richiedere indicizzazione delle pagine principali; non esiste un pulsante che garantisca l'indicizzazione di tutto il portfolio.
4. Monitorare Indicizzazione pagine, Prestazioni e Core Web Vitals dopo la raccolta dei dati. Controllo settimanale il primo mese, poi mensile. La metrica utile è il numero di contatti qualificati, oltre a impression, clic e query locali.
5. Collegare Bing Webmaster Tools, eventualmente importando Search Console, e inviare la stessa sitemap. IndexNow è opzionale per i motori aderenti: non è un sistema di invio a Google.
6. Se l'attività soddisfa i requisiti, creare Google Business Profile con dati reali e zone servite; non inventare sedi a Milano o altre città. Chiedere recensioni autentiche e collegamenti da clienti/collaboratori con lavori pubblicati.

Google non garantisce scansione, tempi o posizionamento. Non usare servizi di backlink a pacchetto, traffico artificiale o servizi che promettono il primo posto.

## Contenuti locali e AI

Mantenere un sito italiano coerente. Valutare pagine dedicate a servizi effettivi (moda/beauty, eventi e club, sport, video), ciascuna con esempi, processo, zona operativa e richiesta contatto. Evitare decine di pagine identiche per ogni comune. Un futuro inglese deve avere URL separati e hreflang, non un cambio lingua dei soli metadati.

Per AI Overviews e AI Mode Google indica che valgono le normali basi SEO, senza markup AI speciale necessario. Priorità: contenuti verificabili, testo leggibile, identità coerente, portfolio originale e collegamenti da fonti pertinenti. L'AI può aiutare a redigere bozze di alt a partire da fatti confermati; rivedere sempre nomi, luoghi e crediti. Non caricare immagini riservate di clienti in servizi esterni senza autorizzazione. llms.txt non è un requisito Google e non assicura citazioni.

Fonti ufficiali:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/ai-features
- https://www.bing.com/indexnow

## Verifiche ripetibili

```bash
node --test backend/scripts/test-seo.mjs
cd frontend
npx tsc --noEmit
npm run build
```

Dalla root, dopo il rilascio:

```bash
node scripts/audit-seo.mjs https://andreafarao.com
```

Le verifiche locali non attestano DNS, certificato, accessibilità Google o proprietà Search Console: vanno completate sul dominio reale.

## Verifica del rilascio del 26 ottobre 2026

Attivato `SEO_INDEXABLE=true` nel `.env` del server e aggiornati i servizi Docker.
Corretta la sostituzione del contenuto del root HTML anche nella build Vite, dove
lo script module si trova in head: le pagine pubbliche contengono testo e link
prima dell'esecuzione di JavaScript. Sitemap e robots sono generati dal backend
con i contenuti correnti del CMS. Test SEO, lint, TypeScript, build e audit sul
dominio pubblico superati.

Da completare negli account esterni:
- Inviare `https://andreafarao.com/sitemap.xml` in Search Console.
- Testare home e un progetto con Controllo URL e richiedere l'indicizzazione.
- Configurare certificato TLS per `www.andreafarao.com` nel reverse proxy e
  redirect permanente al dominio principale conservando percorso e query.
  Il controllo HTTPS di www al rilascio ha restituito un errore TLS.

Backup di media e JSON prima del rilascio:
`/mnt/condivisa/Progetti/RAVAI/backups/seo-20261026/`.
L'archivio pubblico è leggibile; tar ha segnalato modifiche durante la lettura
(archivio live), quindi non è uno snapshot atomico. I JSON sono stati anche
archiviati separatamente prima dell'aggiornamento del backend.
