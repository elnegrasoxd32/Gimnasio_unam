const pool = require('../config/db');

/**
 * Obtiene la lista de estudiantes con su rutina activa, objetivo y última sesión.
 * @param {string} search Texto de búsqueda (código, nombre o apellido)
 */
const obtenerEstudiantes = async (search = '') => {
  let query = `
    SELECT e.id_estudiante, u.codigo, u.nombres, u.apellidos, e.objetivo_principal,
           (SELECT r.nombre
              FROM rutinas r
             WHERE r.id_estudiante = e.id_estudiante AND r.activa = true
             LIMIT 1
           ) AS rutina_activa,
           (SELECT s.fecha
              FROM sesiones_entrenamiento s
             WHERE s.id_estudiante = e.id_estudiante AND s.tiempo_total_minutos IS NOT NULL
             ORDER BY s.fecha DESC
             LIMIT 1
           ) AS ultimo_entrenamiento
      FROM estudiantes e
     INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
     WHERE u.rol = 'ESTUDIANTE' AND u.estado = true
  `;
  const params = [];

  if (search) {
    query += ` AND (u.codigo ILIKE $1 OR u.nombres ILIKE $1 OR u.apellidos ILIKE $1)`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY u.nombres, u.apellidos;`;

  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Obtiene el historial detallado de entrenamientos del estudiante.
 * @param {number} id_estudiante 
 */
const obtenerHistorialDetallado = async (id_estudiante) => {
  const query = `
    SELECT s.fecha, ej.nombre AS ejercicio, r.numero_serie, r.peso, r.repeticiones_realizadas
      FROM registros_ejercicio r
     INNER JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion
     INNER JOIN ejercicios ej ON r.id_ejercicio = ej.id_ejercicio
     WHERE s.id_estudiante = $1 AND s.tiempo_total_minutos IS NOT NULL
     ORDER BY s.fecha DESC, ej.nombre ASC, r.numero_serie ASC;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * Obtiene el tiempo promedio por entrenamiento.
 * @param {number} id_estudiante 
 */
const obtenerTiempoPromedio = async (id_estudiante) => {
  const query = `
    SELECT AVG(tiempo_total_minutos) AS promedio
      FROM sesiones_entrenamiento
     WHERE id_estudiante = $1 AND tiempo_total_minutos IS NOT NULL;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows.length > 0 && rows[0].promedio !== null ? Math.round(parseFloat(rows[0].promedio)) : 0;
};

/**
 * Obtiene el promedio de entrenamientos por semana.
 * @param {number} id_estudiante 
 */
const obtenerPromedioSemanal = async (id_estudiante) => {
  const query = `
    WITH semanas AS (
      SELECT date_trunc('week', fecha) AS semana, COUNT(*) AS cantidad
        FROM sesiones_entrenamiento
       WHERE id_estudiante = $1 AND tiempo_total_minutos IS NOT NULL
       GROUP BY date_trunc('week', fecha)
    )
    SELECT AVG(cantidad) AS promedio FROM semanas;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows.length > 0 && rows[0].promedio !== null ? parseFloat(rows[0].promedio).toFixed(1) : 0;
};

/**
 * Obtiene el promedio de entrenamientos por mes.
 * @param {number} id_estudiante 
 */
const obtenerPromedioMensual = async (id_estudiante) => {
  const query = `
    WITH meses AS (
      SELECT date_trunc('month', fecha) AS mes, COUNT(*) AS cantidad
        FROM sesiones_entrenamiento
       WHERE id_estudiante = $1 AND tiempo_total_minutos IS NOT NULL
       GROUP BY date_trunc('month', fecha)
    )
    SELECT AVG(cantidad) AS promedio FROM meses;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows.length > 0 && rows[0].promedio !== null ? parseFloat(rows[0].promedio).toFixed(1) : 0;
};

module.exports = {
  obtenerEstudiantes,
  obtenerHistorialDetallado,
  obtenerTiempoPromedio,
  obtenerPromedioSemanal,
  obtenerPromedioMensual
};
