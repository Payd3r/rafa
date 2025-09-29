## Masonry — Linee guida

### Obiettivo
Creare una griglia visivamente articolata pur partendo da immagini di uguale dimensione, usando pattern deterministici di `row-span`/`col-span` per varietà.

### Implementazione
- Base CSS Grid: colonne fluide, `gap: 12px`.
- Desktop (≥1024px): 4 colonne; pattern row‑span per item i mod 10 → `[2,2,3,2,3,2,2,3,2,4]`.
- Tablet (≥768px): 3 colonne; pattern `[2,3,2,2,3,2]`.
- Mobile: 2 colonne; pattern `[2,3,2,2]`.
- Ogni 8° elemento applicare anche `col-span-2` se lo spazio lo consente.

### Accessibilità
- Alt obbligatorio; overlay accessibile con trap focus e chiusura ESC.

### Performance
- Lazy loading immagini; anteprime webp; prefetch immagini adiacenti in overlay.


