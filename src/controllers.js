const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('./db');

// Directorio donde se guardan los archivos PDF
const uploadDir = path.join(__dirname, '..', 'uploads');

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.params.id}_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// Solo se aceptan archivos PDF
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'), false);
    }
    cb(null, true);
  }
});

// =================== FUNCIONES ====================

// Crear tarea
const crearTarea = async (req, res) => {
  try {
    const { title, description, due_date, priority, category } = req.body;
    const creator_id = req.user.id;

    const result = await pool.query(`
      INSERT INTO tasks (title, description, due_date, priority, category, creator_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [title, description, due_date, priority, category, creator_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

// Obtener tareas según el rol del usuario
const obtenerTareas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Obteniendo tareas para usuario:', { userId, userRole });

    let result;
    
    if (userRole === 'administrativo') {
      // Los administrativos ven todas las tareas
      result = await pool.query(`
        SELECT t.*, u.username AS creador_username,
               CASE 
                 WHEN e.usuario_id IS NOT NULL THEN 'Entregada'
                 ELSE t.status 
               END as status_mostrado
        FROM tasks t
        LEFT JOIN users u ON t.creator_id = u.id
        LEFT JOIN entregas e ON t.id = e.tarea_id
        ORDER BY t.created_at DESC
      `);
    } else {
      // Los miembros solo ven sus propias tareas
      result = await pool.query(`
        SELECT t.*, u.username AS creador_username,
               CASE 
                 WHEN e.usuario_id IS NOT NULL THEN 'Entregada'
                 ELSE t.status 
               END as status_mostrado
        FROM tasks t
        LEFT JOIN users u ON t.creator_id = u.id
        LEFT JOIN entregas e ON t.id = e.tarea_id AND e.usuario_id = $1
        WHERE t.creator_id = $1
        ORDER BY t.created_at DESC
      `, [userId]);
    }
    
    console.log(`Tareas obtenidas para ${userRole}:`, result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

// Editar tarea
const editarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, priority, category, status } = req.body;

    const result = await pool.query(`
      UPDATE tasks SET title = $1, description = $2, due_date = $3,
      priority = $4, category = $5, status = $6
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
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

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
      'INSERT INTO subtasks (task_id, description) VALUES ($1, $2) RETURNING *',
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

    const result = await pool.query(`
      UPDATE subtasks SET description = $1, status = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *`,
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

    const result = await pool.query('DELETE FROM subtasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtarea no encontrada' });
    }

    res.json({ mensaje: 'Subtarea eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar subtarea' });
  }
};

// Subir archivo PDF de entrega
const subirArchivoEntrega = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido y debe ser PDF' });
  }

  try {
    const tareaId = req.params.id;
    const usuarioId = req.user.id;
    const archivoNombre = req.file.filename;

    const existe = await pool.query(
      'SELECT * FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [tareaId, usuarioId]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE entregas SET archivo = $1, fecha_entrega = NOW() WHERE tarea_id = $2 AND usuario_id = $3',
        [archivoNombre, tareaId, usuarioId]
      );
    } else {
      await pool.query(
        'INSERT INTO entregas (tarea_id, usuario_id, fecha_entrega, archivo) VALUES ($1, $2, NOW(), $3)',
        [tareaId, usuarioId, archivoNombre]
      );
    }

    res.json({ mensaje: 'Entrega registrada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar entrega' });
  }
};

// Obtener entregas de una tarea
const obtenerEntregas = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log('Obteniendo entregas para tarea:', taskId);

    const result = await pool.query(
      `SELECT e.*, u.username
       FROM entregas e
       JOIN users u ON e.usuario_id = u.id
       WHERE e.tarea_id = $1`,
      [taskId]
    );

    console.log('Datos de entregas obtenidos de BD:', result.rows);

    const entregasConUrl = result.rows.map(entrega => ({
      ...entrega,
      fileUrl: entrega.archivo ? `/uploads/${entrega.archivo}` : null,
    }));

    console.log('Entregas procesadas:', entregasConUrl);
    res.json(entregasConUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

// Verificar si archivo existe
const verificarArchivoEntrega = async (req, res) => {
  try {
    console.log('Verificando archivo - Params recibidos:', req.params);
    const { tareaId, usuarioId } = req.params;

    const result = await pool.query(
      'SELECT archivo FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [tareaId, usuarioId]
    );

    if (result.rows.length === 0 || !result.rows[0].archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado en BD' });
    }

    const archivoNombre = result.rows[0].archivo;
    const filePath = path.join(uploadDir, archivoNombre);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en servidor' });
    }

    res.status(200).json({ existe: true, archivo: archivoNombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar archivo' });
  }
};

// Descargar archivo de entrega
const descargarArchivoEntrega = async (req, res) => {
  try {
    console.log('Descargando archivo - Params recibidos:', req.params);
    const { tareaId, usuarioId } = req.params;

    const result = await pool.query(
      'SELECT archivo FROM entregas WHERE tarea_id = $1 AND usuario_id = $2',
      [tareaId, usuarioId]
    );

    if (result.rows.length === 0 || !result.rows[0].archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const archivoNombre = result.rows[0].archivo;
    const filePath = path.join(uploadDir, archivoNombre);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en servidor' });
    }

    res.download(filePath, archivoNombre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al descargar archivo' });
  }
};

// Obtener estadísticas de tareas
const obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Obteniendo estadísticas para usuario:', { userId, userRole });

    let result;
    
    if (userRole === 'administrativo') {
      // Estadísticas globales para administrativos
      result = await pool.query(`
        SELECT 
          COUNT(*) as total_tareas,
          COUNT(CASE WHEN status = 'Pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN status = 'En progreso' THEN 1 END) as en_progreso,
          COUNT(CASE WHEN status = 'Completada' THEN 1 END) as completadas,
          COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as canceladas,
          COUNT(CASE WHEN e.usuario_id IS NOT NULL THEN 1 END) as entregadas
        FROM tasks t
        LEFT JOIN entregas e ON t.id = e.tarea_id
      `);
    } else {
      // Estadísticas personales para miembros
      result = await pool.query(`
        SELECT 
          COUNT(*) as total_tareas,
          COUNT(CASE WHEN status = 'Pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN status = 'En progreso' THEN 1 END) as en_progreso,
          COUNT(CASE WHEN status = 'Completada' THEN 1 END) as completadas,
          COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as canceladas,
          COUNT(CASE WHEN e.usuario_id IS NOT NULL THEN 1 END) as entregadas
        FROM tasks t
        LEFT JOIN entregas e ON t.id = e.tarea_id AND e.usuario_id = $1
        WHERE t.creator_id = $1
      `, [userId]);
    }
    
    // Obtener estadísticas por usuario (solo para administrativos)
    let estadisticasPorUsuario = [];
    if (userRole === 'administrativo') {
      const usuariosResult = await pool.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(t.id) as total_tareas,
          COUNT(CASE WHEN t.status = 'Pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN t.status = 'En progreso' THEN 1 END) as en_progreso,
          COUNT(CASE WHEN t.status = 'Completada' THEN 1 END) as completadas,
          COUNT(CASE WHEN e.usuario_id IS NOT NULL THEN 1 END) as entregadas
        FROM users u
        LEFT JOIN tasks t ON u.id = t.creator_id
        LEFT JOIN entregas e ON t.id = e.tarea_id
        WHERE u.role = 'miembro'
        GROUP BY u.id, u.username
        ORDER BY u.username
      `);
      estadisticasPorUsuario = usuariosResult.rows;
    }
    
    const estadisticas = {
      general: result.rows[0],
      porUsuario: estadisticasPorUsuario
    };
    
    console.log('Estadísticas obtenidas:', estadisticas);
    res.json(estadisticas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
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
  verificarArchivoEntrega,
  descargarArchivoEntrega,
  obtenerEntregas,
  obtenerEstadisticas,
};
