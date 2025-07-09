const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '12345678';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Esto incluye: { id, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const verificarRol = (rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado: rol no autorizado' });
  }
  next();
};

module.exports = { verificarToken, verificarRol };
