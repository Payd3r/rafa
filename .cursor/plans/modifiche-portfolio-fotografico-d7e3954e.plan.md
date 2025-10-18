<!-- d7e3954e-2cc9-47d7-ad89-1e495f184fa0 00594b4b-caf2-406c-b817-2ee083678c8f -->
# Piano: Fix Mobile Responsive Issues

## Problema 1: Titolo "INSIDE.FARAOSTUDIO" troppo grande su mobile

### Situazione Attuale

```67:69:frontend/src/pages/Home.tsx
<h1 className="h1-hero text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up">
  {t('home.heroTitle')}
</h1>
```

Il titolo parte da `text-4xl` (36px) su mobile, che è troppo grande e va oltre la larghezza dello schermo.

### Soluzione

Ridurre le dimensioni responsive del titolo per mobile:
- Mobile (xs): `text-2xl` (24px) o `text-3xl` (30px)
- Small: `text-3xl` o `text-4xl` (36px)
- Medium: `text-5xl` o `text-6xl`
- Large: `text-7xl`
- XL: `text-8xl`

**Modifica da applicare:**
```tsx
<h1 className="h1-hero text-2xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 animate-fade-in-up break-words">
  {t('home.heroTitle')}
</h1>
```

Aggiungere anche `break-words` per evitare overflow del testo.

## Problema 2: Foto sezione "Migliori Scatti" vanno oltre la larghezza su mobile

### Situazione Attuale

```92:114:frontend/src/pages/Home.tsx
<div className="max-w-6xl mx-auto px-4">
  {loading || metaLoading ? (
    ...
  ) : bestPhotos.length > 0 ? (
    <MasonryGrid 
      photos={bestPhotos.slice(0, 12)} 
      onPhotoClick={handlePhotoClick}
      maxRows={2}
      layoutKey="gallery-preview"
    />
  ) : (
    ...
  )}
</div>
```

Il container ha `px-4` (padding 1rem = 16px) ma il `MasonryGrid` usa calcoli dinamici che potrebbero non rispettare il container su mobile.

### Analisi MasonryGrid

Il componente `MasonryGrid` usa `containerWidth` con `ResizeObserver` ma potrebbe avere problemi con:
1. Il calcolo delle larghezze delle immagini che superano il container
2. Gap tra le immagini che non viene considerato correttamente
3. Overflow del flex container

### Soluzione

**Opzione A - Fix nel Container (Più Semplice):**

Aggiungere `overflow-hidden` al container principale e assicurarsi che il MasonryGrid rispetti i limiti:

```tsx
<div className="max-w-6xl mx-auto px-4 overflow-hidden">
  <div className="w-full">
    <MasonryGrid 
      photos={bestPhotos.slice(0, 12)} 
      onPhotoClick={handlePhotoClick}
      maxRows={2}
      layoutKey="gallery-preview"
    />
  </div>
</div>
```

**Opzione B - Fix nel MasonryGrid (Più Robusto):**

Modificare `MasonryGrid.tsx` per aggiungere `overflow-hidden` al container ref:

```184:184:frontend/src/shared/MasonryGrid.tsx
<div ref={containerRef} className="w-full">
```

Cambiare in:
```tsx
<div ref={containerRef} className="w-full overflow-hidden">
```

E assicurarsi che le righe rispettino la larghezza:

```186:201:frontend/src/shared/MasonryGrid.tsx
<div style={{ display: 'grid', rowGap: gap }}>
  {rows.map((row, rIdx) => (
    <div key={rIdx} className="flex" style={{ height: row.height, gap }}>
      {row.items.map((it) => {
        const width = it.ratio * row.height
        return (
          <div key={it.index} style={{ width }}>
            <PhotoCard ... />
          </div>
        )
      })}
    </div>
  ))}
</div>
```

Aggiungere `overflow-hidden` e `max-width`:
```tsx
<div style={{ display: 'grid', rowGap: gap }} className="w-full overflow-hidden">
  {rows.map((row, rIdx) => (
    <div key={rIdx} className="flex overflow-hidden" style={{ height: row.height, gap, maxWidth: '100%' }}>
      {row.items.map((it) => {
        const width = it.ratio * row.height
        return (
          <div key={it.index} style={{ width, flexShrink: 0, maxWidth: '100%' }}>
            <PhotoCard ... />
          </div>
        )
      })}
    </div>
  ))}
</div>
```

### Soluzione Raccomandata

Combinare entrambi gli approcci per massima sicurezza:
1. Fix nel container della Home (overflow-hidden)
2. Fix nel MasonryGrid per prevenire overflow intrinseco

## File da Modificare

**Frontend:**
- `src/pages/Home.tsx` - Ridurre dimensioni titolo hero + overflow-hidden container
- `src/shared/MasonryGrid.tsx` - Aggiungere overflow-hidden e max-width constraints

## Testing

1. **Titolo Hero:**
   - Aprire la home su mobile (width 320px, 375px, 414px)
   - Verificare che il titolo "INSIDE.FARAOSTUDIO" non vada oltre lo schermo
   - Verificare che rimanga leggibile

2. **Sezione Migliori Scatti:**
   - Aprire la home su mobile
   - Verificare che tutte le foto rimangano dentro il container
   - Verificare che non ci sia scroll orizzontale
   - Verificare che le foto siano ben disposte e visibili

3. **Breakpoint:**
   - Testare su: 320px, 375px, 414px (mobile)
   - Testare su: 768px (tablet)
   - Testare su: 1024px+ (desktop)

### To-dos

- [ ] Ridurre dimensioni responsive del titolo hero per mobile
- [ ] Aggiungere overflow-hidden al container della sezione Migliori Scatti
- [ ] Aggiungere overflow-hidden e max-width constraints a MasonryGrid