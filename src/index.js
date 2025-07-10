const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes'); // Asegúrate de que esté bien exportado

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mostrar que las rutas se están cargando
console.log('✅ Cargando rutas API...');

// Rutas API
app.use('/api', routes);

// Servir archivos estáticos (por ejemplo, PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Verificar si la carpeta build existe
const buildPath = path.join(__dirname, '..', 'build');
console.log('📁 Build encontrado:', fs.existsSync(buildPath));

// Middleware global para capturar errores en rutas (debe ir ANTES del catch-all)
app.use((err, req, res, next) => {
  console.error('Error capturado en middleware global:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message, stack: err.stack });
});

// Servir archivos estáticos del build
app.use(express.static(path.join(__dirname, '..', 'build')));

// Catch-all: servir index.html para cualquier otra ruta (SPA)
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Puerto y listen al final
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

console.log('✅ Servidor configurado correctamente');

// Capturar errores no capturados globales para debug
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection en:', promise, 'razón:', reason);
});
