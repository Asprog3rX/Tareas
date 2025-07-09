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

// Rutas API
app.use('/api', routes);

// Servir archivos estáticos (por ejemplo, PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 🔐 OPCIONAL: Servir frontend (React) si existe carpeta build
// Solo útil si combinas frontend y backend en el mismo servidor
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

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

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
