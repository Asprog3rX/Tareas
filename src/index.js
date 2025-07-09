const express = require('express');
const cors = require('cors');
const path = require('path');  // <- Agrega esta línea
const app = express();
const bcrypt = require('bcrypt');
require('dotenv').config();
const { verificarToken, verificarRol } = require('./middleware/auth');
const routes = require('./routes');

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});
