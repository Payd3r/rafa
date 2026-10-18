# Benchmark immagini

Browser Chromium, desktop 1440×900 e mobile 390×844. Mobile: 500 kbit/s download, 200 kbit/s upload, latenza 300 ms. Cache fredda/calda; dati misurati 2 s dopo DOMContentLoaded su desktop e 8 s su mobile. LCP è il valore osservato a quel punto, non necessariamente quello finale; controllare anche le immagini visibili ancora in attesa. Test eseguiti direttamente su Nginx in LAN, senza CDN o DNS pubblico. Il conteggio foto considera la fascia verticale iniziale: nel carosello alcuni elementi possono essere tagliati lateralmente. I tempi non costituiscono una garanzia sulle connessioni reali.

## Risultati principali

| Misura | Prima | Dopo |
|---|---:|---:|
| Foto centrale, mobile lento, cache cold; mediana di 3 prove | 19.36 s | 5.09 s |
| Foto centrale, mobile lento, cache warm; mediana di 3 prove | 0.35 s | 0.69 s |
| Dati trasferiti quando compare la foto centrale, cache fredda | 908 KiB | 207 KiB |
| 134 miniature: vecchie da 800 px rispetto alle varianti da 320 px | 15.26 MB | 0.80 MB |
| 134 miniature: vecchie da 800 px rispetto alle varianti da 640 px | 15.26 MB | 2.43 MB |

La misura della foto centrale attende il completamento della risorsa effettivamente usata dal browser, evitando di scambiare la comparsa di un titolo per il caricamento di una foto. La cache calda non trasferisce dati per le risorse in queste prove; il tempo restante comprende avvio dell’app e rendering. Il confronto dei pesi a diverse risoluzioni mostra il risparmio possibile, non un download completo imposto a ogni visitatore.

## Copertura e verifiche

- 60 scenari prima e 60 dopo: 15 pagine, desktop/mobile, cache fredda/calda.
- 30 viste e 868 posizioni di immagini controllate; 534 punti di apertura delle lightbox, con frecce e chiusura.
- 56 controlli aggiuntivi: viewport 320, 390, 768 e 1440 px, densità 1×, 2× e 3×.
- 22 verifiche su tutti i dettagli progetto con metadati ritardati di 500 ms; massimo shift cumulativo osservato 0.000293.
- Save-Data: variants <=640px; no original downloads
- Precise skeleton: 167×250; no size change after decode
- Request failure: alternatives exhausted, retry works without opening lightbox
- Offline to online: failed project photographs recover automatically
- Anteprime di copertina e galleria testate desktop/mobile senza inviare progetti al server.
- 535 varianti AVIF e 535 WebP pubblicate verificate via HTTP; nessun file vuoto.
- Test della pipeline: hash stabile, variazione del contenuto, nessun ingrandimento, rotazioni EXIF, conservazione dei preferiti.
- TypeScript, ESLint, build Docker, configurazione Nginx e health endpoint verificati.

## Correzioni guidate dai benchmark

Sono conservati i risultati intermedi in iteration-*.json. Il primo intervento ha ridotto la foto centrale a circa 6,5 s. La rimozione del font duplicato, la compressione WOFF2 e lo snellimento dei manifest hanno migliorato ulteriormente il caricamento. È stata corretta una regressione degli skeleton: un paragrafo temporaneo veniva riutilizzato come descrizione quando arrivavano i metadati, spostando il contenuto. Il test dedicato ritarda intenzionalmente la risposta per riprodurre quel caso.

## Dati per pagina

| Profilo | Pagina | Cache | KB prima → dopo | LCP osservato ms prima → dopo | Foto nella fascia iniziale prima → dopo |
|---|---|---|---:|---:|---:|
| desktop | / | cold | 1867 → 327 | 512 → 624 | 5/5 → 5/5 |
| desktop | /projects | cold | 1867 → 327 | 500 → 604 | 5/5 → 5/5 |
| desktop | / | warm | 0 → 0 | 564 → 648 | 5/5 → 5/5 |
| desktop | /projects | warm | 0 → 0 | 456 → 504 | 5/5 → 5/5 |
| desktop | /gallery | cold | 1663 → 361 | 432 → 828 | 2/2 → 2/2 |
| desktop | /projects/zofi | cold | 1055 → 294 | 424 → 752 | 2/2 → 2/2 |
| desktop | /projects/le-figlie-del-fuoco | cold | 2083 → 412 | 440 → 500 | 2/2 → 2/2 |
| desktop | /projects/zofi | warm | 0 → 0 | 596 → 688 | 2/2 → 2/2 |
| desktop | /projects/le-figlie-del-fuoco | warm | 0 → 0 | 404 → 456 | 2/2 → 2/2 |
| desktop | /gallery | warm | 0 → 0 | 444 → 536 | 2/2 → 2/2 |
| desktop | /projects/beauty | cold | 1992 → 543 | 424 → 852 | 2/2 → 2/2 |
| desktop | /projects/fashion-is-never-banal | cold | 1068 → 255 | 424 → 844 | 2/2 → 2/2 |
| desktop | /projects/argento | cold | 1697 → 339 | 432 → 816 | 2/2 → 2/2 |
| desktop | /projects/beauty | warm | 0 → 0 | 396 → 440 | 2/2 → 2/2 |
| desktop | /projects/fashion-is-never-banal | warm | 0 → 0 | 412 → 676 | 2/2 → 2/2 |
| desktop | /projects/argento | warm | 0 → 0 | 1220 → 420 | 2/2 → 2/2 |
| desktop | /projects/i-put-clean-girls-into-a-coma | cold | 1027 → 303 | 416 → 1260 | 2/2 → 2/2 |
| desktop | /projects/country-travel | cold | 5822 → 397 | 480 → 772 | 2/2 → 2/2 |
| desktop | /projects/blosson-beauty | cold | 1156 → 448 | 444 → 884 | 2/2 → 2/2 |
| desktop | /projects/i-put-clean-girls-into-a-coma | warm | 0 → 0 | 408 → 708 | 2/2 → 2/2 |
| desktop | /projects/country-travel | warm | 0 → 0 | 448 → 408 | 2/2 → 2/2 |
| desktop | /projects/blosson-beauty | warm | 0 → 0 | 412 → 412 | 2/2 → 2/2 |
| desktop | /projects/i-don-t-even-know-myself | cold | 921 → 267 | 412 → 872 | 2/2 → 2/2 |
| desktop | /projects/un-volto-per-raccontare | cold | 2098 → 400 | 420 → 840 | 0/0 → 0/0 |
| desktop | /projects/inside-raw-emotions | cold | 1346 → 369 | 428 → 900 | 2/2 → 2/2 |
| desktop | /projects/i-don-t-even-know-myself | warm | 0 → 0 | 408 → 548 | 2/2 → 2/2 |
| desktop | /projects/un-volto-per-raccontare | warm | 0 → 0 | 404 → 672 | 0/0 → 0/0 |
| desktop | /projects/inside-raw-emotions | warm | 0 → 0 | 452 → 400 | 2/2 → 2/2 |
| desktop | /admin | cold | 411 → 287 | 144 → 488 | 1/1 → 0/0 |
| desktop | /admin | warm | 0 → 0 | 60 → 360 | 1/1 → 0/0 |
| mobile-slow | / | cold | 323 → 244 | 5436 → 5236 | 0/5 → 3/3 |
| mobile-slow | /projects | cold | 323 → 244 | 5592 → 5232 | 0/5 → 3/3 |
| mobile-slow | /gallery | cold | 323 → 313 | 6192 → 6888 | 0/3 → 3/3 |
| mobile-slow | / | warm | 143 → 0 | 36 → 728 | 3/5 → 3/3 |
| mobile-slow | /projects | warm | 117 → 0 | 36 → 744 | 2/5 → 3/3 |
| mobile-slow | /gallery | warm | 106 → 0 | 424 → 1756 | 3/3 → 3/3 |
| mobile-slow | /projects/le-figlie-del-fuoco | cold | 323 → 257 | 6124 → 4724 | 0/2 → 2/2 |
| mobile-slow | /projects/zofi | cold | 450 → 249 | 6120 → 4696 | 3/4 → 4/4 |
| mobile-slow | /projects/beauty | cold | 323 → 252 | 6112 → 4712 | 0/7 → 4/4 |
| mobile-slow | /projects/le-figlie-del-fuoco | warm | 30 → 0 | 388 → 728 | 1/2 → 2/2 |
| mobile-slow | /projects/zofi | warm | 338 → 0 | 392 → 728 | 4/4 → 4/4 |
| mobile-slow | /projects/beauty | warm | 0 → 0 | 380 → 712 | 1/4 → 4/4 |
| mobile-slow | /projects/fashion-is-never-banal | cold | 437 → 238 | 6092 → 4696 | 2/6 → 4/4 |
| mobile-slow | /projects/argento | cold | 359 → 250 | 6124 → 4736 | 0/12 → 4/4 |
| mobile-slow | /projects/i-put-clean-girls-into-a-coma | cold | 482 → 249 | 6096 → 4708 | 1/2 → 2/2 |
| mobile-slow | /projects/fashion-is-never-banal | warm | 65 → 0 | 416 → 708 | 4/4 → 4/4 |
| mobile-slow | /projects/argento | warm | 137 → 0 | 404 → 740 | 2/4 → 4/4 |
| mobile-slow | /projects/i-put-clean-girls-into-a-coma | warm | 33 → 0 | 388 → 728 | 2/2 → 2/2 |
| mobile-slow | /projects/country-travel | cold | 323 → 271 | 6096 → 5708 | 0/13 → 6/6 |
| mobile-slow | /projects/blosson-beauty | cold | 323 → 269 | 6112 → 4688 | 0/5 → 4/4 |
| mobile-slow | /projects/i-don-t-even-know-myself | cold | 481 → 251 | 7288 → 5320 | 4/4 → 4/4 |
| mobile-slow | /projects/country-travel | warm | 229 → 0 | 460 → 728 | 0/10 → 6/6 |
| mobile-slow | /projects/blosson-beauty | warm | 199 → 0 | 388 → 720 | 4/4 → 4/4 |
| mobile-slow | /projects/i-don-t-even-know-myself | warm | 222 → 0 | 384 → 676 | 4/4 → 4/4 |
| mobile-slow | /projects/inside-raw-emotions | cold | 419 → 254 | 8836 → 5496 | 3/7 → 6/6 |
| mobile-slow | /projects/un-volto-per-raccontare | cold | 384 → 238 | 6132 → 4696 | 0/0 → 0/0 |
| mobile-slow | /admin | cold | 411 → 287 | 4552 → 3224 | 1/1 → 0/0 |
| mobile-slow | /projects/inside-raw-emotions | warm | 301 → 0 | 408 → 648 | 6/6 → 6/6 |
| mobile-slow | /projects/un-volto-per-raccontare | warm | 201 → 0 | 376 → 372 | 0/0 → 0/0 |
| mobile-slow | /admin | warm | 0 → 0 | 64 → 344 | 1/1 → 0/0 |
