const pool = require('../config/db');

/**
 * Obtiene la cantidad de personas actualmente en el gimnasio.
 * (Estudiantes con fecha_ingreso pero sin fecha_salida)
 */
const obtenerOcupacionActual = async () => {
  const query = `
    SELECT COUNT(*) AS presentes
      FROM asistencias
     WHERE fecha_salida IS NULL;
  `;
  const { rows } = await pool.query(query);
  return parseInt(rows[0].presentes) || 0;
};

/**
 * Obtiene el total de visitas de los últimos 7 días.
 */
const obtenerTendenciaSemanal = async () => {
  const query = `
    SELECT to_char(fecha_ingreso, 'YYYY-MM-DD') AS fecha, COUNT(*) AS total
      FROM asistencias
     WHERE fecha_ingreso >= CURRENT_DATE - INTERVAL '6 days'
     GROUP BY to_char(fecha_ingreso, 'YYYY-MM-DD')
     ORDER BY fecha ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtiene las horas del día con mayor afluencia históricamente.
 */
const obtenerHorasPico = async () => {
  const query = `
    SELECT EXTRACT(HOUR FROM fecha_ingreso) AS hora, COUNT(*) AS total
      FROM asistencias
     GROUP BY EXTRACT(HOUR FROM fecha_ingreso)
     ORDER BY hora ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtiene estadísticas generales del aforo.
 */
const obtenerEstadisticas = async () => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM asistencias WHERE fecha_ingreso::DATE = CURRENT_DATE) AS ingresos_hoy,
      (SELECT COUNT(*) FROM asistencias) / GREATEST((CURRENT_DATE - MIN(fecha_ingreso::DATE)), 1) AS promedio_diario
    FROM asistencias;
  `;
  const { rows } = await pool.query(query);
  if (!rows.length || rows[0].ingresos_hoy === null) {
    return { ingresos_hoy: 0, promedio_diario: 0 };
  }
  return {
    ingresos_hoy: parseInt(rows[0].ingresos_hoy) || 0,
    promedio_diario: Math.round(parseFloat(rows[0].promedio_diario)) || 0
  };
};

module.exports = {
  obtenerOcupacionActual,
  obtenerTendenciaSemanal,
  obtenerHorasPico,
  obtenerEstadisticas
};
