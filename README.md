# Portfolio Rafa - CMS Admin

Portfolio fotografico con pannello admin per upload progetti.

## Avvio Locale

```bash
# Installa dipendenze
cd backend && npm install
cd ../frontend && npm install

# Avvia (Windows)
.\scripts\dev-all.ps1

# Avvia (Linux/Mac)
./scripts/dev-all.sh
```

**Oppure manualmente (2 terminal):**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

**Accedi:**
- Sito: http://localhost:5173
- Admin: http://localhost:5173/admin (andrea / andrea2004)

## Deploy Portainer

### 1. Configura Environment Variables in Portainer:

```env
ADMIN_USER=andrea
ADMIN_PASS=andrea2004
BACKEND_PORT=3001
PROD_PUBLIC_PATH=/app/public
PROD_SRC_PATH=/app/src
PROD_DATA_PATH=/app/data/projects.json
DOCKER_NETWORK=web-proxy
BACKEND_DATA_VOLUME=backend_data
FRONTEND_BUILD_VOLUME=frontend_build
```

**⚠️ Cambia le credenziali admin per sicurezza!**

### 2. Deploy stack:

```bash
docker-compose up -d
```

### 3. Configurazione Automatica

Il frontend include **Nginx che fa proxy** delle richieste `/api/` al backend interno.

✅ Nessuna configurazione reverse proxy aggiuntiva necessaria!
✅ Tutto passa attraverso HTTPS automaticamente

## Configurazione Locale

File `.env` (già pronto per dev):
- `VITE_BACKEND_URL=http://localhost:3001` - Backend locale
- `ADMIN_USER=andrea` - Username admin
- `ADMIN_PASS=andrea2004` - Password admin

## Admin Panel

1. Vai su `/admin`
2. Login con credenziali
3. Carica progetto:
   - **Copertina** (1 immagine obbligatoria) - sarà l'immagine principale nelle card
   - **Galleria** (max 30 immagini opzionali) - immagini del progetto
   - Titolo, descrizione, data
4. Sistema processa automaticamente tutto

Il sistema genera automaticamente:
- Cover salvata in `{slug}/cover/` con 4 varianti (jpg, webp, thumb, placeholder)
- Galleria salvata in `{slug}/1/`, `{slug}/2/`, etc.
- Aggiorna `frontend/src/shared/data/projects.ts`
- Aggiorna `frontend/src/shared/data/imageMeta.ts`

