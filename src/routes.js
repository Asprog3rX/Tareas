const express = require('express');
const pool = require('./db');
const path = require('path');
const fs = require('fs');
const router = express.Router();

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
  descargarArchivoEntrega,
  obtenerEntregas,
} = require('./controllers');

const {
  registrarUsuario,
  loginUsuario
} = require('./authController');

const {
  verificarToken,
  verificarRol
} = require('./middleware/auth');

// === RUTAS DE TAREAS ===
router.post('/tasks', verificarToken, verificarRol(['administrativo']), crearTarea);
router.get('/tasks', verificarToken, obtenerTareas);
router.put('/tasks/:id', verificarToken, verificarRol(['administrativo']), editarTarea);
router.delete('/tasks/:id', verificarToken, verificarRol(['administrativo']), eliminarTarea);

// === CAMBIAR SOLO ESTADO DE TAREA ===
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
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === SUBTAREAS ===
router.get('/tasks/:taskId/subtasks', verificarToken, obtenerSubtareas);
router.post('/tasks/:taskId/subtasks', verificarToken, verificarRol(['administrativo']), crearSubtarea);
router.put('/subtasks/:id', verificarToken, verificarRol(['administrativo']), editarSubtarea);
router.delete('/subtasks/:id', verificarToken, verificarRol(['administrativo']), eliminarSubtarea);

// === ENTREGAS ===
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

// === SUBIR Y DESCARGAR ARCHIVOS DE ENTREGA ===
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

// === DESCARGA DIRECTA DE ARCHIVOS POR NOMBRE (PUBLICA) ===
router.get('/entregas/:archivo', (req, res) => {
  const { archivo } = req.params;

  const filePath = path.join(__dirname, '..', 'uploads', archivo);

  console.log('📁 Buscando archivo en:', filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  res.download(filePath, archivo, (err) => {
    if (err) {
      console.error('❌ Error al enviar archivo:', err);
      if (!res.headersSent) {
        res.status(500).send('Error al descargar el archivo');
      }
    }
  });
});

// === AUTENTICACIÓN ===
router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;
