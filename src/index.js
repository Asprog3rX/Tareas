const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes'); // Asegúrate de que esté bien exportado

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas principales
app.use('/api', routes);

// Servir archivos estáticos (PDFs entregados)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
  res.send('🎉 Bienvenido al backend de Gestión de Tareas');
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
