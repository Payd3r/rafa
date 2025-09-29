## Convenzioni progetto

### Branching
- main: stabile
- feat/<area>/<breve-descrizione>
- fix/<area>/<breve-descrizione>

### Commit (Conventional Commits)
- feat: nuova funzionalità
- fix: correzione bug
- docs: documentazione
- style: formattazione (no logica)
- refactor: refactor senza nuove feature
- perf: performance
- test: test
- chore: build/tooling

Esempio: `feat(gallery): add masonry pattern spans and lightbox`

### Naming
- Componenti React: PascalCase (`MasonryGrid`)
- File componenti: `ComponentName.tsx`
- Asset/dati: `kebab-case`
- Classi Tailwind: evitare `rounded-*`, forzare `rounded-none`.

### PR
- Descrizione: scopo, impatti su regole, screenshot/gif.
- Checklist: lint ok, a11y, responsive, test manuale overlay.


