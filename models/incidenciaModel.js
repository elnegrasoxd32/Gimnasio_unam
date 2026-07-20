const pool = require('../config/db');
// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Obtiene todos los tipos de incidencia del catálogo.
 */
const obtenerTipos = async () => {
    const query = `SELECT id_tipo, nombre FROM tipos_incidencia ORDER BY nombre;`;
    const { rows } = await pool.query(query);
    return rows;
};
// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIANTE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Crea una nueva incidencia para el estudiante.
 */
const crear = async (id_estudiante, id_tipo, descripcion) => {
    const query = `
    INSERT INTO incidencias (id_estudiante, id_tipo, descripcion, estado)
    VALUES ($1, $2, $3, 'PENDIENTE')
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [id_estudiante, id_tipo, descripcion]);
    return rows[0];
};
/**
 * Obtiene todas las incidencias de un estudiante, ordenadas de más reciente a más antigua.
 */
const obtenerPorEstudiante = async (id_estudiante) => {
    const query = `
    SELECT i.id_incidencia, i.descripcion, i.estado, i.fecha_reporte,
           t.nombre AS tipo
      FROM incidencias i
     INNER JOIN tipos_incidencia t ON i.id_tipo = t.id_tipo
     WHERE i.id_estudiante = $1
     ORDER BY i.fecha_reporte DESC;
  `;
    const { rows } = await pool.query(query, [id_estudiante]);
    return rows;
};
/**
 * Cuenta las incidencias abiertas (PENDIENTE + EN_PROCESO) del estudiante.
 */
const contarAbiertasPorEstudiante = async (id_estudiante) => {
    const query = `
    SELECT COUNT(*) AS total
      FROM incidencias
     WHERE id_estudiante = $1
       AND estado IN ('PENDIENTE', 'EN_PROCESO');
  `;
    const { rows } = await pool.query(query, [id_estudiante]);
    return parseInt(rows[0].total) || 0;
};
// ─────────────────────────────────────────────────────────────────────────────
// DOCENTE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Obtiene el listado completo de incidencias con filtros opcionales.
 * @param {string} search   - Texto libre para código o nombre
 * @param {string} estado   - 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | '' (todos)
 * @param {string} orden    - 'ASC' | 'DESC'
 */
const obtenerTodas = async (search = '', estado = '', orden = 'DESC') => {
    const sortDir = orden === 'ASC' ? 'ASC' : 'DESC';
    let query = `
    SELECT i.id_incidencia, i.descripcion, i.estado, i.fecha_reporte,
           t.nombre AS tipo,
           u.codigo, u.nombres, u.apellidos
      FROM incidencias i
     INNER JOIN tipos_incidencia t ON i.id_tipo = t.id_tipo
     INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
     INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
     WHERE 1=1
  `;
    const params = [];
    let idx = 1;
    if (search) {
        query += ` AND (u.codigo ILIKE $${idx} OR u.nombres ILIKE $${idx} OR u.apellidos ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
    }
    if (estado && ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'].includes(estado)) {
        query += ` AND i.estado = $${idx}`;
        params.push(estado);
        idx++;
    }
    query += ` ORDER BY i.fecha_reporte ${sortDir}`;
    const { rows } = await pool.query(query, params);
    return rows;
};
/**
 * Obtiene el detalle completo de una incidencia junto con datos del estudiante.
 */
const obtenerDetalle = async (id_incidencia) => {
    const query = `
    SELECT i.id_incidencia, i.descripcion, i.estado, i.fecha_reporte,
           t.nombre AS tipo,
           u.codigo, u.nombres, u.apellidos,
           e.id_estudiante, e.objetivo_principal,
           (SELECT r.nombre
              FROM rutinas r
             WHERE r.id_estudiante = e.id_estudiante AND r.activa = true
             LIMIT 1
           ) AS rutina_activa,
           (SELECT a.fecha_ingreso
              FROM asistencias a
             WHERE a.id_estudiante = e.id_estudiante
             ORDER BY a.fecha_ingreso DESC
             LIMIT 1
           ) AS ultima_asistencia,
           (SELECT s.fecha
              FROM sesiones_entrenamiento s
             WHERE s.id_estudiante = e.id_estudiante AND s.tiempo_total_minutos IS NOT NULL
             ORDER BY s.fecha DESC
             LIMIT 1
           ) AS ultimo_entrenamiento
      FROM incidencias i
     INNER JOIN tipos_incidencia t ON i.id_tipo = t.id_tipo
     INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
     INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
     WHERE i.id_incidencia = $1;
  `;
    const { rows } = await pool.query(query, [id_incidencia]);
    return rows[0] ?? null;
};
/**
 * Cambia el estado de una incidencia. Solo permite las transiciones válidas:
 *   PENDIENTE → EN_PROCESO
 *   EN_PROCESO → RESUELTO
 */
const cambiarEstado = async (id_incidencia, nuevoEstado) => {
    const transiciones = {
        'PENDIENTE': 'EN_PROCESO',
        'EN_PROCESO': 'RESUELTO'
    };
    // Verificar estado actual
    const { rows: current } = await pool.query(
        `SELECT estado FROM incidencias WHERE id_incidencia = $1`,
        [id_incidencia]
    );
    if (!current[0]) return null;
    const estadoActual = current[0].estado;
    if (transiciones[estadoActual] !== nuevoEstado) return null;
    const query = `
    UPDATE incidencias
       SET estado = $1
     WHERE id_incidencia = $2
     RETURNING *;
  `;
    const { rows } = await pool.query(query, [nuevoEstado, id_incidencia]);
    return rows[0];
};
/**
 * Obtiene estadísticas globales de incidencias para el dashboard del docente.
 */
const obtenerEstadisticas = async () => {
    const query = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE estado = 'PENDIENTE')  AS pendientes,
      COUNT(*) FILTER (WHERE estado = 'EN_PROCESO') AS en_proceso,
      COUNT(*) FILTER (WHERE estado = 'RESUELTO')   AS resueltas
    FROM incidencias;
  `;
    const { rows } = await pool.query(query);
    return rows[0];
};
module.exports = {
    obtenerTipos,
    crear,
    obtenerPorEstudiante,
    contarAbiertasPorEstudiante,
    obtenerTodas,
    obtenerDetalle,
    cambiarEstado,
    obtenerEstadisticas
};
