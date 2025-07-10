const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('=== PRUEBA DEL SERVIDOR ===');

const app = express();
const buildPath = path.join(__dirname, 'build');

// Simular el setup del servidor
app.use(express.static(buildPath));

// Catch-all para React Router
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }

  const indexPath = path.join(buildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`✅ Ruta ${req.originalUrl} -> index.html`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`❌ Error en ${req.originalUrl}:`, err);
      }
    });
  } else {
    console.error(`❌ index.html no encontrado para ${req.originalUrl}`);
    res.status(500).send('Error: index.html no encontrado');
  }
});

// Rutas de prueba
const testRoutes = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/api/test',
  '/uploads/test.pdf'
];

console.log('🧪 Probando rutas:');
testRoutes.forEach(route => {
  const req = { originalUrl: route };
  const res = {
    sendFile: (file, callback) => {
      console.log(`  ✅ ${route} -> index.html`);
      if (callback) callback(null);
    },
    status: (code) => ({
      send: (msg) => console.log(`  ❌ ${route} -> ${code}: ${msg}`),
      json: (data) => console.log(`  ❌ ${route} -> ${code}: ${JSON.stringify(data)}`)
    })
  };
  
  // Simular la ruta
  app._router.handle(req, res, () => {
    console.log(`  ⏭️  ${route} -> continuando`);
  });
});

console.log('\n=== FIN PRUEBA ==='); 