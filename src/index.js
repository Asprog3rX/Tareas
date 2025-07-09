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

// Rutas API
app.use('/api', routes);

// Servir archivos estáticos (PDFs entregados)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Servir los archivos estáticos de React (build)
app.use(express.static(path.join(__dirname, '..', 'build')));

// Para cualquier otra ruta no definida en API, enviar el index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
