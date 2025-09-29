## Contratti Dati

Tipi minimi (TypeScript-like) che ogni agente deve rispettare.

### Foto
```
Photo {
  id: string
  src: string          // anteprima (webp preferita)
  originalUrl: string  // file originale per download
  alt: string
  tags?: string[]
}
```

### Progetto
```
Project {
  slug: string
  title: string
  dateISO: string      // ISO 8601
  description: string
  cover: Photo
  gallery: Photo[]
}
```

Vincoli:
- `originalUrl` deve puntare a file non compresso (jpg/png) per download.
- `src` ottimizzato per web (webp) con dimensione max 1600px lato lungo.
- `alt` obbligatorio.


