const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('./db');

// Carpeta uploads fuera de src (nivel backend)
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${req.params.id}_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'), false);
    }
    cb(null, true);
  }
});

// Crear tarea
const crearTarea = async (req, res) => {
  try {
    const { title, description, due_date, priority, category } = req.body;
    const creator_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, due_date, priority, category, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, due_date, priority, category, creator_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

// Obtener tareas
const obtenerTareas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.username AS creador_username
      FROM tasks t
      LEFT JOIN users u ON t.creator_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

// Obtener entregas
const obtenerEntregas = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      `SELECT e.*, u.username
       FROM entregas e
       JOIN users u ON e.usuario_id = u.id
       WHERE e.tarea_id = $1`,
      [taskId]
    );

    const entregasConUrl = result.rows.map(e => ({
      ...e,
      fileUrl: e.archivo ? `/uploads/${e.archivo}` : null,
    }));

    res.json(entregasConUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

// Editar tarea
const editarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, priority, category, status } = req.body;

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           due_date = $3,
           priority = $4,
           category = $5,
           status = $6
       WHERE id = $7
       RETURNING *`,
      [title, description, due_date, priority, category, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar tarea' });
  }
};

// Eliminar tarea
const eliminarTarea = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ mensaje: 'Tarea eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

// Obtener subtareas
const obtenerSubtareas = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener subtareas' });
  }
};

// Crear subtarea
const crearSubtarea = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;
    const result = await pool.query(
      `INSERT INTO subtasks (task_id, description) VALUES ($1, $2) RETURNING *`,
      [taskId, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear subtarea' });
  }
};

// Editar subtarea
const editarSubtarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, status } = req.body;
    const result = await pool.query(
      `UPDATE subtasks 
       SET description = $1, status = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar subtarea' });
  }
};

// Eliminar subtarea
const eliminarSubtarea = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM subtasks WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }
    res.json({ mensaje: 'Subtarea eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar subtarea' });
  }
};

// Registrar entrega con archivo (upload) solo PDF
const subirArchivoEntrega = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido y debe ser PDF' });
  }

  try {
    const tareaId = req.params.id;
    const usuarioId = req.user.id;
    const archivoNombre = req.file.filename;

    // Verificar si ya entregó
    const existe = await pool.query(
      'SELECT * FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [tareaId, usuarioId]
    );

    if (existe.rows.length > 0) {
      // Actualizar archivo y fecha entrega
      await pool.query(
        'UPDATE entregas SET archivo = $1, fecha_entrega = NOW() WHERE tarea_id = $2 AND usuario_id = $3',
        [archivoNombre, tareaId, usuarioId]
      );
    } else {
      // Insertar entrega nueva
      await pool.query(
        'INSERT INTO entregas (tarea_id, usuario_id, fecha_entrega, archivo) VALUES ($1, $2, NOW(), $3)',
        [tareaId, usuarioId, archivoNombre]
      );
    }

    res.json({ mensaje: 'Archivo PDF subido y entrega registrada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error guardando entrega' });
  }
};

// Descargar archivo entrega validando extensión PDF y existencia
const descargarArchivoEntrega = async (req, res) => {
  try {
    const { tareaId, usuarioId } = req.params;
    console.log(`Petición para descargar archivo de tarea ${tareaId}, usuario ${usuarioId}`);

    const result = await pool.query(
      'SELECT archivo FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [tareaId, usuarioId]
    );

    if (result.rows.length === 0 || !result.rows[0].archivo) {
      console.log('Archivo no encontrado en la base de datos');
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const archivoNombre = result.rows[0].archivo;
    const filePath = path.join(uploadDir, archivoNombre);

    console.log('Intentando descargar archivo desde:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('Archivo no existe en el servidor:', filePath);
      return res.status(404).json({ error: 'Archivo no existe en el servidor' });
    }

    res.download(filePath, archivoNombre);
  } catch (error) {
    console.error('Error en descargarArchivoEntrega:', error);
    res.status(500).json({ error: 'Error descargando archivo' });
  }
};

module.exports = {
  upload,
  crearTarea,
  obtenerTareas,
  editarTarea,
  eliminarTarea,
  obtenerSubtareas,
  crearSubtarea,
  editarSubtarea,
  eliminarSubtarea,
  subirArchivoEntrega,
  descargarArchivoEntrega,
  obtenerEntregas,
};
