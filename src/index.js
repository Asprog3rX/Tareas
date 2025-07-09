const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // 👈 ESTA LÍNEA FALTABA
const bcrypt = require('bcrypt');
require('dotenv').config();

const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes'); // Asegúrate de que esté bien exportado

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api', routes);

// Servir archivos estáticos (por ejemplo, PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Servir frontend si existe carpeta build (protección para Render)
//const buildPath = path.join(__dirname, '..', 'build');
//if (fs.existsSync(buildPath)) {
 // app.use(express.static(buildPath));
  //app.get('*', (req, res) => {
   // res.sendFile(path.join(buildPath, 'index.html'));
  //});
//}

// Mostrar todas las rutas registradas
console.log('=== TODAS LAS RUTAS EXPRESS ===');
app._router.stack.forEach((layer) => {
  if (layer.route && layer.route.path) {
    console.log(`${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach((subLayer) => {
      if (subLayer.route && subLayer.route.path) {
        console.log(`${Object.keys(subLayer.route.methods).join(', ').toUpperCase()} ${subLayer.route.path}`);
      }
    });
  }
});
console.log('===============================');

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
