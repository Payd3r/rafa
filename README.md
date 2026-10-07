# 📷 Farao Studio (Rafa) — Portfolio Fotografico & CMS Admin

<p align="center">
  <img src="https://img.shields.io/badge/Status-Completed-success?style=for-the-badge&logo=git" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Backend-Node.js_+_Express-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/Image_Engine-Sharp_+_FFmpeg-99CC00?style=for-the-badge&logo=sharp" alt="Sharp" />
  <img src="https://img.shields.io/badge/Layout-Masonry_Grid-FF6B6B?style=for-the-badge" alt="Masonry" />
  <img src="https://img.shields.io/badge/DevOps-Docker_+_Nginx-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

---

## 📖 Panoramica

**Farao Studio** (noto anche come *Portfolio Rafa*) è una piattaforma web fotografica e multimediale ad altissima resa visiva, dotata di un CMS headless integrato per la gestione autonoma di progetti, scatti fotografici e video.

Il frontend offre un layout fluido a griglia **Masonry** dinamica, visualizzatore **Lightbox** immersivo per fotografie ad altissima risoluzione, player video ottimizzato e commutazione tema Dark/Light. Il backend include una pipeline automatizzata di elaborazione delle immagini con **Sharp** che genera in tempo reale formati moderni (WebP, AVIF, thumbnail e placeholder LQIP sfocati per caricamento istantaneo).

---

## ✨ Funzionalità della Piattaforma

### 🎨 Visual Portfolio & UI/UX
- **Griglia Masonry Reattiva:** Layout a colonne asimmetriche dinamiche (`MasonryGrid.tsx`, `MasonryColumns.tsx`) che rispetta l'aspect ratio naturale di ogni fotografia.
- **Lightbox Interattivo:** Esperienza di visualizzazione a tutto schermo con zoom, navigazione da tastiera/touch e prefetching.
- **Supporto Video & Reel:** Riproduzione di video promozionali e reel con lazy loading e anteprime generate (`VideoCard.tsx`).
- **Tema Scuro / Chiaro:** Theme Context con persistenza della preferenza utente e palette colore adattiva.

### ⚙️ Headless CMS & Pannello Amministratore (`/admin`)
- **Pannello di Controllo Progetti:** Interfaccia riservata protetta da credenziali JWT per caricare e organizzare servizi fotografici.
- **Pipeline Automatica di Elaborazione:**
  - Caricamento di una copertina e fino a 30 scatti per progetto.
  - Conversione automatica in formati compressi a bassissimo peso (**AVIF / WebP / JPEG progressive**).
  - Generazione di miniature (thumbnail) e segnaposto a bassissima risoluzione (LQIP) per un caricamento perceived-instant.
  - Generazione e aggiornamento automatico dei dataset JSON (`projects.json`, `imageMeta.ts`).

---

## 🛠️ Stack Tecnologico

| Layer | Tecnologie | Ruolo |
| :--- | :--- | :--- |
| **Frontend** | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) | Client SPA moderno e reattivo |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Design minimalista, tipografia curata e transizioni fluide |
| **Backend API** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) | API REST per upload, autenticazione e generazione file |
| **Elaborazione Media** | [Sharp](https://sharp.pixelplumbing.com/), [FFmpeg](https://ffmpeg.org/) | Pipeline di transcodifica, resize e generazione thumbnail |
| **Web Server & Proxy** | [Docker Compose](https://docs.docker.com/compose/), [Nginx](https://nginx.org/) | Reverse proxy interno `/api/` con caching statico |

---

## 📂 Struttura del Repository

```bash
rafa/
├── backend/                  # Server Node.js / Express
│   ├── routes/admin.js       # Endpoint autenticazione e caricamento progetti
│   ├── services/             # Pipeline media (imageProcessor, videoProcessor, fileGenerator)
│   ├── scripts/              # Script di migrazione (migrate-to-avif.js)
│   ├── Dockerfile.backend    # Container backend
│   └── package.json
├── frontend/                 # Client React + TypeScript + Vite
│   ├── public/               # Asset statici, font e webmanifest
│   ├── src/
│   │   ├── pages/            # Home, Gallery, Admin
│   │   ├── shared/           # Header, Footer, Lightbox, MasonryGrid, PhotoCard
│   │   └── Root.tsx          # Router e Theme Provider
│   ├── nginx.conf            # Nginx config con proxy pass verso backend
│   └── package.json
├── docker-compose.yml        # Orchestrazione produzione multi-container
└── README.md
```

---

## 🚀 Guida all'Avvio Locale

### Prerequisiti
- **Node.js** >= 18
- **Docker** (opzionale per deploy locale)

### 1. Clonazione del Repository
```bash
git clone git@github.com:Payd3r/rafa.git
cd rafa
```

### 2. Configurazione Ambiente
Crea o verifica i file `.env`:
```env
# Backend
PORT=3001
ADMIN_USER=admin
ADMIN_PASS=tua_password_sicura
JWT_SECRET=super_segreto_jwt

# Frontend
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Avvio in Sviluppo (Due Terminali)

```bash
# Terminale 1: Backend
cd backend
npm install
npm run dev

# Terminale 2: Frontend
cd ../frontend
npm install
npm run dev
```

- **Sito Pubblico:** `http://localhost:5173`
- **Pannello Admin:** `http://localhost:5173/admin`

---

## 🐳 Deploy di Produzione con Docker

Lo stack Docker include il container backend e il container frontend (Nginx con reverse proxy interno su `/api/`).

```bash
# Assicurati che esista la rete web-proxy
docker network create web-proxy || true

# Avvio dei container
docker compose up -d --build
```

---

## 👤 Autore & Crediti

Realizzato da **Andrea Mauri** (per Farao Studio / client):
- GitHub: [@Payd3r](https://github.com/Payd3r)
