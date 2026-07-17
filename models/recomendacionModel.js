const pool = require('../config/db');

/**
 * DOCENTE: Buscar estudiantes por código, nombres o apellidos.
 * Retorna todos los estudiantes si search está vacío.
 */
const buscarEstudiantes = async (search = '') => {
  let query = `
    SELECT u.codigo, u.nombres, u.apellidos, e.id_estudiante, u.correo
      FROM usuarios u
      JOIN estudiantes e ON u.id_usuario = e.id_usuario
  `;
  const params = [];
  if (search) {
    query += ` WHERE u.codigo ILIKE $1 OR u.nombres ILIKE $1 OR u.apellidos ILIKE $1`;
    params.push(`%${search}%`);
  }
  query += ` ORDER BY u.apellidos, u.nombres`;
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * DOCENTE: Obtener el resumen de un estudiante (perfil, rutina, asistencias, último entrenamiento, etc).
 */
const obtenerResumenEstudiante = async (id_estudiante) => {
  const query = `
    SELECT 
      u.codigo, u.nombres, u.apellidos, e.objetivo_principal,
      (SELECT r.nombre FROM rutinas r WHERE r.id_estudiante = e.id_estudiante AND r.activa = true LIMIT 1) AS rutina_activa,
      (SELECT a.fecha_ingreso FROM asistencias a WHERE a.id_estudiante = e.id_estudiante ORDER BY a.fecha_ingreso DESC LIMIT 1) AS ultima_asistencia,
      (SELECT s.fecha FROM sesiones_entrenamiento s WHERE s.id_estudiante = e.id_estudiante AND s.tiempo_total_minutos IS NOT NULL ORDER BY s.fecha DESC LIMIT 1) AS ultimo_entrenamiento,
      (SELECT rec.fecha FROM recomendaciones rec WHERE rec.id_estudiante = e.id_estudiante ORDER BY rec.fecha DESC LIMIT 1) AS ultima_recomendacion
    FROM estudiantes e
    JOIN usuarios u ON e.id_usuario = u.id_usuario
    WHERE e.id_estudiante = $1;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0];
};

/**
 * DOCENTE: Crear una recomendación.
 */
const crearRecomendacion = async (id_estudiante, id_docente, mensaje) => {
  const query = `
    INSERT INTO recomendaciones (id_estudiante, id_docente, mensaje) 
    VALUES ($1, $2, $3) RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_estudiante, id_docente, mensaje]);
  return rows[0];
};

/**
 * DOCENTE: Editar una recomendación (verificando que pertenece al docente).
 */
const editarRecomendacion = async (id_recomendacion, id_docente, mensaje) => {
  const query = `
    UPDATE recomendaciones
       SET mensaje = $1
     WHERE id_recomendacion = $2 AND id_docente = $3
     RETURNING *;
  `;
  const { rows } = await pool.query(query, [mensaje, id_recomendacion, id_docente]);
  return rows[0];
};

/**
 * DOCENTE: Eliminar una recomendación (verificando que pertenece al docente).
 */
const eliminarRecomendacion = async (id_recomendacion, id_docente) => {
  const query = `
    DELETE FROM recomendaciones
     WHERE id_recomendacion = $1 AND id_docente = $2
     RETURNING id_recomendacion;
  `;
  const { rows } = await pool.query(query, [id_recomendacion, id_docente]);
  return rows[0];
};

/**
 * DOCENTE: Obtener recomendaciones de un estudiante con buscador y orden.
 */
const obtenerRecomendacionesPorEstudiante = async (id_estudiante, search = '', sortOrder = 'DESC') => {
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
  let query = `
    SELECT r.id_recomendacion, r.mensaje, r.fecha, u.nombres, u.apellidos, r.id_docente
      FROM recomendaciones r
      JOIN docentes d ON r.id_docente = d.id_docente
      JOIN usuarios u ON d.id_usuario = u.id_usuario
     WHERE r.id_estudiante = $1
  `;
  const params = [id_estudiante];

  if (search) {
    query += ` AND r.mensaje ILIKE $2`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY r.fecha ${order}`;
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * DOCENTE: Obtener estadísticas de recomendaciones para un docente.
 */
const obtenerEstadisticasDocente = async (id_docente) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM recomendaciones WHERE id_docente = $1) AS total_enviadas,
      (SELECT COUNT(*) FROM recomendaciones WHERE id_docente = $1 AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)) AS mes_actual,
      (SELECT COUNT(*) FROM recomendaciones WHERE id_docente = $1 AND fecha::DATE = CURRENT_DATE) AS hoy;
  `;
  const { rows } = await pool.query(query, [id_docente]);
  return rows[0];
};

/**
 * ESTUDIANTE: Obtener todas las recomendaciones.
 */
const obtenerParaEstudiante = async (id_estudiante) => {
  const query = `
    SELECT r.id_recomendacion, r.mensaje, r.fecha, u.nombres, u.apellidos,
           (r.fecha >= CURRENT_DATE - INTERVAL '7 days') AS es_nueva
      FROM recomendaciones r
      JOIN docentes d ON r.id_docente = d.id_docente
      JOIN usuarios u ON d.id_usuario = u.id_usuario
     WHERE r.id_estudiante = $1
     ORDER BY r.fecha DESC;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * ESTUDIANTE: Obtener conteo total para dashboard.
 */
const obtenerConteoParaEstudiante = async (id_estudiante) => {
  const query = `
    SELECT COUNT(*) AS total
      FROM recomendaciones
     WHERE id_estudiante = $1;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return parseInt(rows[0].total) || 0;
};

module.exports = {
  buscarEstudiantes,
  obtenerResumenEstudiante,
  crearRecomendacion,
  editarRecomendacion,
  eliminarRecomendacion,
  obtenerRecomendacionesPorEstudiante,
  obtenerEstadisticasDocente,
  obtenerParaEstudiante,
  obtenerConteoParaEstudiante
};
