const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes'); // Asegúrate que exporta el router con /login y demás rutas

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para loguear cada petición (todas las rutas que llegan)
app.use((req, res, next) => {
  console.log('[REQUEST]', req.method, req.originalUrl);
  next();
});

// --- PRUEBA 1: comentar rutas API para probar si error sigue ---
// app.use('/api', routes);

// --- Para probar que las rutas se cargan, descomenta la línea siguiente ---
app.use('/api', routes);

// Middleware para loguear cada ruta registrada (automático)
function printRegisteredRoutes(app) {
  console.log('=== RUTAS REGISTRADAS AUTOMÁTICAMENTE ===');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Ruta directa
      const methods = Object.keys(middleware.route.methods)
        .map(m => m.toUpperCase())
        .join(', ');
      console.log(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Rutas dentro de router (como en app.use('/api', routes))
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .map(m => m.toUpperCase())
            .join(', ');
          console.log(`${methods} ${middleware.regexp} + ${handler.route.path}`);
        }
      });
    }
  });
}
printRegisteredRoutes(app);

// Servir archivos estáticos (por ejemplo, PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Verificar y mostrar si la carpeta build existe
const buildPath = path.join(__dirname, '..', 'build');
console.log('Buscando carpeta build en:', buildPath);
console.log('¿Existe build?', fs.existsSync(buildPath));

if (fs.existsSync(buildPath)) {
  try {
    // Servir frontend React estático
    app.use(express.static(buildPath));

    // Todas las rutas que no sean /api ni /uploads servirán index.html para React Router
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        // Dejar pasar la petición o responder 404 para rutas API y uploads no encontradas
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } catch (err) {
    console.error('Error sirviendo el build:', err);
  }
} else {
  console.warn('⚠️ La carpeta build no fue encontrada. El frontend no será servido.');
}

// Middleware global para capturar errores en rutas y mostrar detalles
app.use((err, req, res, next) => {
  console.error('Error capturado en middleware global:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message, stack: err.stack });
});

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
