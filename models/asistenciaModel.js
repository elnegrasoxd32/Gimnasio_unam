const pool = require('../config/db');

/**
 * Obtiene la asistencia abierta (sin fecha_salida) de un estudiante.
 * @param {number} id_estudiante 
 */
const obtenerAsistenciaAbierta = async (id_estudiante) => {
  const query = `
    SELECT * 
      FROM asistencias 
     WHERE id_estudiante = $1 AND fecha_salida IS NULL 
     ORDER BY fecha_ingreso DESC 
     LIMIT 1;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0] || null;
};

/**
 * Registra un nuevo ingreso manual para el estudiante.
 * @param {number} id_estudiante 
 */
const registrarIngreso = async (id_estudiante) => {
  const query = `
    INSERT INTO asistencias (id_estudiante, metodo) 
    VALUES ($1, 'MANUAL') 
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0];
};

/**
 * Registra la salida actualizando la fecha_salida con CURRENT_TIMESTAMP.
 * @param {number} id_asistencia 
 */
const registrarSalida = async (id_asistencia) => {
  const query = `
    UPDATE asistencias 
       SET fecha_salida = CURRENT_TIMESTAMP 
     WHERE id_asistencia = $1 
     RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_asistencia]);
  return rows[0];
};

/**
 * Obtiene el historial de asistencias de un estudiante.
 * @param {number} id_estudiante 
 */
const obtenerHistorialEstudiante = async (id_estudiante) => {
  const query = `
    SELECT id_asistencia, fecha_ingreso, fecha_salida, metodo,
           EXTRACT(EPOCH FROM (COALESCE(fecha_salida, CURRENT_TIMESTAMP) - fecha_ingreso)) / 60 AS duracion_minutos
      FROM asistencias
     WHERE id_estudiante = $1
     ORDER BY fecha_ingreso DESC;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * Obtiene todas las asistencias para el dashboard del docente con filtros opcionales.
 * @param {string} filtroEstudiante (Nombre o código)
 * @param {string} filtroFecha (YYYY-MM-DD)
 */
const obtenerTodasAsistencias = async (filtroEstudiante = '', filtroFecha = '') => {
  let query = `
    SELECT a.id_asistencia, a.fecha_ingreso, a.fecha_salida, a.metodo,
           EXTRACT(EPOCH FROM (COALESCE(a.fecha_salida, CURRENT_TIMESTAMP) - a.fecha_ingreso)) / 60 AS duracion_minutos,
           u.codigo, u.nombres, u.apellidos
      FROM asistencias a
      JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      JOIN usuarios u ON e.id_usuario = u.id_usuario
     WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filtroEstudiante) {
    query += ` AND (u.codigo ILIKE $${paramIndex} OR u.nombres ILIKE $${paramIndex} OR u.apellidos ILIKE $${paramIndex})`;
    params.push(`%${filtroEstudiante}%`);
    paramIndex++;
  }

  if (filtroFecha) {
    // Cast to DATE to ignore time part
    query += ` AND a.fecha_ingreso::DATE = $${paramIndex}::DATE`;
    params.push(filtroFecha);
    paramIndex++;
  }

  query += ` ORDER BY a.fecha_ingreso DESC;`;

  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  obtenerAsistenciaAbierta,
  registrarIngreso,
  registrarSalida,
  obtenerHistorialEstudiante,
  obtenerTodasAsistencias
};
