import fs from "node:fs/promises";
const before = JSON.parse(await fs.readFile("benchmarks/before.json")).results;
const after = JSON.parse(await fs.readFile("benchmarks/after.json")).results;
const bytes = (r) =>
  r.initial.resources.reduce((sum, item) => sum + item.bytes, 0);
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const heroBefore=JSON.parse(await fs.readFile('benchmarks/hero-before.json'));
const heroAfter=JSON.parse(await fs.readFile('benchmarks/hero-after.json'));
const assetsBefore=JSON.parse(await fs.readFile('benchmarks/assets-before.json'));
const assetsAfter=JSON.parse(await fs.readFile('benchmarks/assets-after.json'));
const audit=JSON.parse(await fs.readFile('benchmarks/audit.json'));
const matrix=JSON.parse(await fs.readFile('benchmarks/responsive-matrix.json'));
const layout=JSON.parse(await fs.readFile('benchmarks/layout-stability.json'));
const network=JSON.parse(await fs.readFile('benchmarks/network-tests.json'));
const beforeBytes=assetsBefore.reduce((sum,r)=>sum+r.bytes,0);
const summary=[
 '## Risultati principali', '',
 '| Misura | Prima | Dopo |', '|---|---:|---:|',
 ...['cold','warm'].map(cache=>`| Foto centrale, mobile lento, cache ${cache}; mediana di 3 prove | ${(median(heroBefore.filter(r=>r.cache===cache).map(r=>r.readyMs))/1000).toFixed(2)} s | ${(median(heroAfter.filter(r=>r.cache===cache).map(r=>r.readyMs))/1000).toFixed(2)} s |`),
 `| Dati trasferiti quando compare la foto centrale, cache fredda | ${(median(heroBefore.filter(r=>r.cache==='cold').map(r=>r.bytes))/1024).toFixed(0)} KiB | ${(median(heroAfter.filter(r=>r.cache==='cold').map(r=>r.bytes))/1024).toFixed(0)} KiB |`,
 `| 134 miniature: vecchie da 800 px rispetto alle varianti da 320 px | ${(beforeBytes/1e6).toFixed(2)} MB | ${(assetsAfter.filter(r=>r.width===320).reduce((s,r)=>s+r.bytes,0)/1e6).toFixed(2)} MB |`,
 `| 134 miniature: vecchie da 800 px rispetto alle varianti da 640 px | ${(beforeBytes/1e6).toFixed(2)} MB | ${(assetsAfter.filter(r=>r.width===640).reduce((s,r)=>s+r.bytes,0)/1e6).toFixed(2)} MB |`,
 '',
 'La misura della foto centrale attende il completamento della risorsa effettivamente usata dal browser, evitando di scambiare la comparsa di un titolo per il caricamento di una foto. La cache calda non trasferisce dati per le risorse in queste prove; il tempo restante comprende avvio dell’app e rendering. Il confronto dei pesi a diverse risoluzioni mostra il risparmio possibile, non un download completo imposto a ogni visitatore.',
 '', '## Copertura e verifiche', '',
 `- ${before.length} scenari prima e ${after.length} dopo: 15 pagine, desktop/mobile, cache fredda/calda.`,
 `- ${audit.length} viste e ${audit.reduce((s,r)=>s+r.positions,0)} posizioni di immagini controllate; ${audit.reduce((s,r)=>s+(r.viewers||0),0)} punti di apertura delle lightbox, con frecce e chiusura.`,
 `- ${matrix.length} controlli aggiuntivi: viewport 320, 390, 768 e 1440 px, densità 1×, 2× e 3×.`,
 `- ${layout.length} verifiche su tutti i dettagli progetto con metadati ritardati di 500 ms; massimo shift cumulativo osservato ${Math.max(...layout.map(r=>r.cls)).toFixed(6)}.`,
 ...network.map(result=>'- '+result),
 '- Anteprime di copertina e galleria testate desktop/mobile senza inviare progetti al server.',
 '- 535 varianti AVIF e 535 WebP pubblicate verificate via HTTP; nessun file vuoto.',
 '- Test della pipeline: hash stabile, variazione del contenuto, nessun ingrandimento, rotazioni EXIF, conservazione dei preferiti.',
 '- TypeScript, ESLint, build Docker, configurazione Nginx e health endpoint verificati.',
 '', '## Correzioni guidate dai benchmark', '',
 'Sono conservati i risultati intermedi in iteration-*.json. Il primo intervento ha ridotto la foto centrale a circa 6,5 s. La rimozione del font duplicato, la compressione WOFF2 e lo snellimento dei manifest hanno migliorato ulteriormente il caricamento. È stata corretta una regressione degli skeleton: un paragrafo temporaneo veniva riutilizzato come descrizione quando arrivavano i metadati, spostando il contenuto. Il test dedicato ritarda intenzionalmente la risposta per riprodurre quel caso.',
 '', '## Dati per pagina', ''
];
const rows = [
  "# Benchmark immagini",
  "",
  "Browser Chromium, desktop 1440×900 e mobile 390×844. Mobile: 500 kbit/s download, 200 kbit/s upload, latenza 300 ms. Cache fredda/calda; dati misurati 2 s dopo DOMContentLoaded su desktop e 8 s su mobile. LCP è il valore osservato a quel punto, non necessariamente quello finale; controllare anche le immagini visibili ancora in attesa. Test eseguiti direttamente su Nginx in LAN, senza CDN o DNS pubblico. Il conteggio foto considera la fascia verticale iniziale: nel carosello alcuni elementi possono essere tagliati lateralmente. I tempi non costituiscono una garanzia sulle connessioni reali.",
  "",
  ...summary,
  "| Profilo | Pagina | Cache | KB prima → dopo | LCP osservato ms prima → dopo | Foto nella fascia iniziale prima → dopo |",
  "|---|---|---|---:|---:|---:|",
];
for (const a of after) {
  const b = before.find(
    (r) =>
      r.route === a.route && r.profile === a.profile && r.cache === a.cache,
  );
  if (!b) continue;
  const ready = (r) => {
    const images = r.initial.images.filter((i) => i.visible);
    return `${images.filter((i) => i.loaded).length}/${images.length}`;
  };
  rows.push(
    `| ${a.profile} | ${a.route} | ${a.cache} | ${(bytes(b) / 1024).toFixed(0)} → ${(bytes(a) / 1024).toFixed(0)} | ${Math.round(b.initial.lcp)} → ${Math.round(a.initial.lcp)} | ${ready(b)} → ${ready(a)} |`,
  );
}
await fs.writeFile("benchmarks/REPORT.md", rows.join("\n") + "\n");
