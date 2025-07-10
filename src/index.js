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

// Función para listar rutas del router (incluye routers anidados)
const getRoutesFromStack = (stack) =>
  stack
    .map((layer) => {
      if (layer.route) {
        return layer.route.path;
      } else if (layer.name === 'router' && layer.handle.stack) {
        return getRoutesFromStack(layer.handle.stack);
      }
      return null;
    })
    .flat()
    .filter(Boolean);

// Mostrar rutas cargadas en /api antes de usarlas
try {
  const allRoutes = getRoutesFromStack(routes.stack);
  console.log('Rutas encontradas en router /api:', allRoutes);
} catch (e) {
  console.error('Error extrayendo rutas del router:', e);
}

// Rutas API
app.use('/api', routes);

// Servir archivos estáticos (por ejemplo, PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Verificar y mostrar si la carpeta build existe
const buildPath = path.join(__dirname, '..', 'build');
console.log('Buscando carpeta build en:', buildPath);
console.log('¿Existe build?', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  try {
    console.log('✅ Serviendo archivos estáticos desde:', buildPath);
    
    // Servir archivos estáticos del build (CSS, JS, imágenes, etc.)
    app.use(express.static(buildPath));

    // IMPORTANTE: Catch-all para React Router - debe ir al final
    app.get('*', (req, res) => {
      // Si es una ruta de API o uploads, no manejarla aquí
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return res.status(404).json({ error: 'Endpoint no encontrado' });
      }

      // Para TODAS las demás rutas (/, /login, /register, /dashboard, etc.), servir index.html
      const indexPath = path.join(buildPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        console.log(`📄 Sirviendo index.html para ruta: ${req.originalUrl}`);
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('❌ Error enviando index.html:', err);
            res.status(500).send('Error interno del servidor');
          }
        });
      } else {
        console.error('❌ index.html no encontrado en:', indexPath);
        res.status(500).send('Error: index.html no encontrado');
      }
    });
    
  } catch (err) {
    console.error('❌ Error sirviendo el build:', err);
  }
} else {
  console.warn('⚠️ La carpeta build no fue encontrada. El frontend no será servido.');
}

// Middleware global para capturar errores en rutas (debe ir ANTES del catch-all)
app.use((err, req, res, next) => {
  console.error('Error capturado en middleware global:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message, stack: err.stack });
});

// Log básico de rutas cargadas (manual)
console.log('=== RUTAS REGISTRADAS ===');
console.log('POST /api/register');
console.log('POST /api/login');
console.log('GET  /api/tasks');
console.log('POST /api/tasks');
console.log('PUT  /api/tasks/:id');
console.log('DELETE /api/tasks/:id');
console.log('PATCH /api/tasks/:id/status');
console.log('GET  /api/tasks/:taskId/subtasks');
console.log('POST /api/tasks/:taskId/subtasks');
console.log('PUT  /api/subtasks/:id');
console.log('DELETE /api/subtasks/:id');
console.log('GET  /api/tasks/:taskId/entregas');
console.log('POST /api/tasks/:id/entregas');
console.log('POST /api/tasks/:id/entregas/file');
console.log('GET  /api/tasks/:tareaId/entregas/:usuarioId/archivo');
console.log('GET  /entregas/:archivo');
console.log('=========================');

// Capturar errores no capturados globales para debug
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
