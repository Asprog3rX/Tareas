const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('[REQUEST]', req.method, req.originalUrl);
  next();
});

// Rutas API
app.use('/api', routes);

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Build de React
const buildPath = path.join(__dirname, '..', 'build');
console.log('Buscando carpeta build en:', buildPath);
console.log('¿Existe build?', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // ⚠️ Esta línea fue corregida
  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
} else {
  console.warn('⚠️ La carpeta build no fue encontrada. El frontend no será servido.');
}

// Middleware de errores
app.use((err, req, res, next) => {
  console.error('Error capturado en middleware global:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

// Errores no capturados
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection en:', promise, 'razón:', reason);
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
