import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import adminRoutes from './routes/admin.js';

// Carica .env dalla root del progetto
config({ path: path.join(process.cwd(), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/admin', adminRoutes);

// Endpoint per compatibilità /api/users/me (senza autenticazione)
app.get('/api/users/me', (req, res) => {
  res.json({
    success: true,
    user: {
      authenticated: true,
      timestamp: new Date().toISOString()
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Rafa Backend CMS',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/admin/health',
      projects: {
        list: 'GET /api/admin/projects',
        create: 'POST /api/admin/projects'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File troppo grande. Max 50MB per immagine.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Troppi file. Max 30 immagini per progetto.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Errore interno del server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Rafa Backend CMS                     ║
║   Server in ascolto su porta ${PORT}     ║
║   http://localhost:${PORT}                 ║
╚════════════════════════════════════════╝
  `);
});

