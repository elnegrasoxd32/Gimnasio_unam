const pool = require('../config/db');

/**
 * Obtiene el resumen general de progreso del estudiante.
 * @param {number} id_estudiante 
 */
const obtenerResumenGeneral = async (id_estudiante) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM sesiones_entrenamiento WHERE id_estudiante = $1 AND tiempo_total_minutos IS NOT NULL) AS total_sesiones,
      (SELECT COUNT(*) FROM registros_ejercicio r JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion WHERE s.id_estudiante = $1) AS total_ejercicios,
      (SELECT MAX(peso) FROM registros_ejercicio r JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion WHERE s.id_estudiante = $1) AS peso_maximo,
      (SELECT AVG(peso) FROM registros_ejercicio r JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion WHERE s.id_estudiante = $1 AND peso > 0) AS peso_promedio,
      (
        SELECT e.nombre
          FROM registros_ejercicio r
          JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion
          JOIN ejercicios e ON r.id_ejercicio = e.id_ejercicio
         WHERE s.id_estudiante = $1
         GROUP BY e.id_ejercicio, e.nombre
         ORDER BY COUNT(*) DESC
         LIMIT 1
      ) AS ejercicio_favorito
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0];
};

/**
 * Obtiene la cantidad de entrenamientos finalizados agrupados por mes (para gráfica de barras).
 * @param {number} id_estudiante 
 */
const obtenerEntrenamientosPorMes = async (id_estudiante) => {
  const query = `
    SELECT 
      TO_CHAR(fecha, 'YYYY-MM') AS mes,
      COUNT(*) AS cantidad
    FROM sesiones_entrenamiento
    WHERE id_estudiante = $1 AND tiempo_total_minutos IS NOT NULL
    GROUP BY TO_CHAR(fecha, 'YYYY-MM')
    ORDER BY mes ASC
    LIMIT 12;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * Obtiene la lista de ejercicios únicos que ha realizado el estudiante (para el select).
 * @param {number} id_estudiante 
 */
const obtenerEjerciciosRealizados = async (id_estudiante) => {
  const query = `
    SELECT DISTINCT e.id_ejercicio, e.nombre
      FROM registros_ejercicio r
      JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion
      JOIN ejercicios e ON r.id_ejercicio = e.id_ejercicio
     WHERE s.id_estudiante = $1
     ORDER BY e.nombre ASC;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * Obtiene la evolución del peso máximo levantado por sesión para un ejercicio específico.
 * @param {number} id_estudiante 
 * @param {number} id_ejercicio 
 */
const obtenerEvolucionPeso = async (id_estudiante, id_ejercicio) => {
  const query = `
    SELECT 
      TO_CHAR(s.fecha, 'YYYY-MM-DD') AS fecha,
      MAX(r.peso) AS peso_maximo
    FROM registros_ejercicio r
    JOIN sesiones_entrenamiento s ON r.id_sesion = s.id_sesion
    WHERE s.id_estudiante = $1 AND r.id_ejercicio = $2 AND s.tiempo_total_minutos IS NOT NULL
    GROUP BY TO_CHAR(s.fecha, 'YYYY-MM-DD'), s.fecha
    ORDER BY s.fecha ASC;
  `;
  const { rows } = await pool.query(query, [id_estudiante, id_ejercicio]);
  return rows;
};

module.exports = {
  obtenerResumenGeneral,
  obtenerEntrenamientosPorMes,
  obtenerEjerciciosRealizados,
  obtenerEvolucionPeso
};
