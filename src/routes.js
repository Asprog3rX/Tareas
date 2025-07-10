const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const {
  crearTarea,
  obtenerTareas,
  editarTarea,
  eliminarTarea,
  obtenerSubtareas,
  crearSubtarea,
  editarSubtarea,
  eliminarSubtarea,
  upload,
  subirArchivoEntrega,
  verificarArchivoEntrega,
  descargarArchivoEntrega,
  obtenerEntregas,
  obtenerEstadisticas,
} = require('./controllers');

const {
  registrarUsuario,
  loginUsuario
} = require('./authController');

const {
  verificarToken,
  verificarRol
} = require('./middleware/auth');


// Middleware para loguear cada petición
router.use((req, res, next) => {
  console.log(`[RUTA] ${req.method} ${req.originalUrl}`);
  next();
});

console.log('Montando rutas de autenticación');
// ===== RUTAS AUTENTICACIÓN =====
router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);

console.log('Montando rutas de tareas');
// ===== TAREAS =====
router.post('/tasks', verificarToken, verificarRol(['administrativo']), crearTarea);
router.get('/tasks', verificarToken, obtenerTareas);
router.put('/tasks/:id', verificarToken, verificarRol(['administrativo']), editarTarea);
router.delete('/tasks/:id', verificarToken, verificarRol(['administrativo']), eliminarTarea);

// ===== ESTADÍSTICAS =====
router.get('/stats', verificarToken, obtenerEstadisticas);

router.patch('/tasks/:id/status', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const estadosValidos = ['Pendiente', 'En progreso', 'Completada', 'Cancelada'];

  if (!estadosValidos.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

console.log('Montando rutas de subtareas');
// ===== SUBTAREAS =====
router.get('/tasks/:taskId/subtasks', verificarToken, obtenerSubtareas);
router.post('/tasks/:taskId/subtasks', verificarToken, verificarRol(['administrativo']), crearSubtarea);
router.put('/subtasks/:id', verificarToken, verificarRol(['administrativo']), editarSubtarea);
router.delete('/subtasks/:id', verificarToken, verificarRol(['administrativo']), eliminarSubtarea);

console.log('Montando rutas de entregas');
// ===== ENTREGAS =====
router.get('/tasks/:taskId/entregas', verificarToken, obtenerEntregas);

router.post('/tasks/:id/entregas', verificarToken, async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user.id;

  try {
    const existe = await pool.query(
      'SELECT * FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [id, usuarioId]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya entregaste esta tarea' });
    }

    const result = await pool.query(
      'INSERT INTO entregas (tarea_id, usuario_id, fecha_entrega) VALUES ($1, $2, NOW()) RETURNING *',
      [id, usuarioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar entrega:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post(
  '/tasks/:id/entregas/file',
  verificarToken,
  upload.single('file'),
  subirArchivoEntrega
);

router.get(
  '/tasks/:tareaId/entregas/:usuarioId/archivo',
  verificarToken,
  descargarArchivoEntrega
);

router.head(
  '/tasks/:tareaId/entregas/:usuarioId/archivo',
  verificarToken,
  verificarArchivoEntrega
);

router.get('/entregas/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('❌ Error al enviar archivo:', err);
      if (!res.headersSent) {
        res.status(500).send('Error al descargar el archivo');
      }
    }
  });
});
// Función para imprimir rutas registradas
function printRoutes(router) {
  console.log('=== RUTAS REGISTRADAS ===');
  router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .map(m => m.toUpperCase())
        .join(', ');
      console.log(`${methods} ${layer.route.path}`);
    }
  });
  console.log('=========================');
}

printRoutes(router);

module.exports = router;
