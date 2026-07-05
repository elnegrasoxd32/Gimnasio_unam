const pool = require('../config/db');

/**
 * Inicia una sesión de entrenamiento para un estudiante.
 * @param {number} id_estudiante 
 * @returns {Object} { id_sesion, fecha }
 */
const iniciarSesion = async (id_estudiante) => {
  const query = `
    INSERT INTO sesiones_entrenamiento (id_estudiante, fecha)
    VALUES ($1, CURRENT_TIMESTAMP)
    RETURNING id_sesion, fecha;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0];
};

/**
 * Obtiene la sesión activa (sin finalizar) de un estudiante, si existe.
 * @param {number} id_estudiante 
 * @returns {Object|null}
 */
const obtenerSesionActiva = async (id_estudiante) => {
  const query = `
    SELECT id_sesion, fecha 
      FROM sesiones_entrenamiento
     WHERE id_estudiante = $1 AND tiempo_total_minutos IS NULL
     ORDER BY fecha DESC
     LIMIT 1;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0] ?? null;
};

/**
 * Registra una serie de un ejercicio en la sesión.
 * @param {number} id_sesion 
 * @param {number} id_ejercicio 
 * @param {number} numero_serie 
 * @param {number} peso 
 * @param {number} repeticiones_realizadas 
 */
const registrarSerie = async (id_sesion, id_ejercicio, numero_serie, peso, repeticiones_realizadas) => {
  // Upsert pattern based on unique constraint? Wait, there is no unique constraint on (id_sesion, id_ejercicio, numero_serie).
  // I will just insert it. Or maybe delete existing one first? The prompt doesn't specify uniqueness but it makes sense to replace if they re-submit.
  // I'll just delete first to act as upsert.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM registros_ejercicio 
        WHERE id_sesion = $1 AND id_ejercicio = $2 AND numero_serie = $3`,
      [id_sesion, id_ejercicio, numero_serie]
    );
    const { rows } = await client.query(
      `INSERT INTO registros_ejercicio (id_sesion, id_ejercicio, numero_serie, peso, repeticiones_realizadas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_registro;`,
      [id_sesion, id_ejercicio, numero_serie, peso, repeticiones_realizadas]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Obtiene los registros guardados en una sesión (para mostrarlos en la UI si recarga).
 * @param {number} id_sesion 
 * @returns {Array} Lista de registros
 */
const obtenerRegistrosSesion = async (id_sesion) => {
  const query = `
    SELECT id_ejercicio, numero_serie, peso, repeticiones_realizadas
      FROM registros_ejercicio
     WHERE id_sesion = $1;
  `;
  const { rows } = await pool.query(query, [id_sesion]);
  return rows;
};

/**
 * Finaliza la sesión de entrenamiento.
 * Calcula los minutos transcurridos desde 'fecha' hasta CURRENT_TIMESTAMP.
 * Se asegura de que el mínimo sea 1 minuto.
 * @param {number} id_sesion 
 */
const finalizarSesion = async (id_sesion) => {
  const query = `
    UPDATE sesiones_entrenamiento
       SET tiempo_total_minutos = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha))/60))
     WHERE id_sesion = $1
     RETURNING id_sesion, tiempo_total_minutos;
  `;
  const { rows } = await pool.query(query, [id_sesion]);
  return rows[0];
};

/**
 * Obtiene el historial de sesiones finalizadas de un estudiante.
 * Incluye la fecha, tiempo total y la cantidad de ejercicios únicos realizados.
 * Solo muestra sesiones con al menos 1 ejercicio registrado (INNER JOIN).
 * @param {number} id_estudiante 
 * @returns {Array} Lista de sesiones
 */
const obtenerHistorialSesiones = async (id_estudiante) => {
  const query = `
    SELECT s.id_sesion, s.fecha, s.tiempo_total_minutos,
           COUNT(DISTINCT r.id_ejercicio) AS cantidad_ejercicios
      FROM sesiones_entrenamiento s
      JOIN registros_ejercicio r ON s.id_sesion = r.id_sesion
     WHERE s.id_estudiante = $1 AND s.tiempo_total_minutos IS NOT NULL
     GROUP BY s.id_sesion, s.fecha, s.tiempo_total_minutos
     ORDER BY s.fecha DESC;
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows;
};

/**
 * Obtiene el detalle de todos los registros de una sesión específica.
 * @param {number} id_sesion 
 * @returns {Array} Lista de registros con el nombre del ejercicio
 */
const obtenerDetalleSesion = async (id_sesion) => {
  const query = `
    SELECT r.id_registro, r.id_sesion, e.nombre AS nombre_ejercicio, 
           r.numero_serie, r.peso, r.repeticiones_realizadas, r.fecha_registro
      FROM registros_ejercicio r
      JOIN ejercicios e ON r.id_ejercicio = e.id_ejercicio
     WHERE r.id_sesion = $1
     ORDER BY e.nombre, r.numero_serie;
  `;
  const { rows } = await pool.query(query, [id_sesion]);
  return rows;
};

/**
 * Actualiza el peso y las repeticiones de un registro específico, validando que 
 * la sesión pertenece al estudiante.
 * @param {number} id_registro 
 * @param {number} peso 
 * @param {number} repeticiones_realizadas 
 * @param {number} id_estudiante 
 */
const actualizarRegistro = async (id_registro, peso, repeticiones_realizadas, id_estudiante) => {
  const query = `
    UPDATE registros_ejercicio r
       SET peso = $1, repeticiones_realizadas = $2
      FROM sesiones_entrenamiento s
     WHERE r.id_sesion = s.id_sesion
       AND r.id_registro = $3
       AND s.id_estudiante = $4
     RETURNING r.id_registro;
  `;
  const { rows } = await pool.query(query, [peso, repeticiones_realizadas, id_registro, id_estudiante]);
  return rows[0];
};

/**
 * Elimina un registro de la base de datos, validando que la sesión pertenece al estudiante.
 * Si al eliminar el registro la sesión queda vacía (0 registros), elimina automáticamente la sesión.
 * @param {number} id_registro 
 * @param {number} id_estudiante 
 * @returns {Object|null} { id_registro, sesionEliminada } o null si no se eliminó
 */
const eliminarRegistro = async (id_registro, id_estudiante) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Eliminar el registro y retornar el id_sesion al que pertenecía
    const { rows } = await client.query(`
      DELETE FROM registros_ejercicio r
       USING sesiones_entrenamiento s
       WHERE r.id_sesion = s.id_sesion
         AND r.id_registro = $1
         AND s.id_estudiante = $2
       RETURNING r.id_sesion;
    `, [id_registro, id_estudiante]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const id_sesion = rows[0].id_sesion;

    // Contar cuántos registros quedan en la sesión
    const countRes = await client.query(
      `SELECT COUNT(*) AS total FROM registros_ejercicio WHERE id_sesion = $1`, 
      [id_sesion]
    );
    
    let sesionEliminada = false;
    if (parseInt(countRes.rows[0].total) === 0) {
      await client.query(`DELETE FROM sesiones_entrenamiento WHERE id_sesion = $1`, [id_sesion]);
      sesionEliminada = true;
    }

    await client.query('COMMIT');
    return { id_registro, sesionEliminada };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  iniciarSesion,
  obtenerSesionActiva,
  registrarSerie,
  obtenerRegistrosSesion,
  finalizarSesion,
  obtenerHistorialSesiones,
  obtenerDetalleSesion,
  actualizarRegistro,
  eliminarRegistro
};
