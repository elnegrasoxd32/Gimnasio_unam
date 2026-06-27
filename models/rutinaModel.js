const pool = require('../config/db');

/**
 * Crea una nueva rutina y sus ejercicios, desactivando la anterior.
 * Todo se ejecuta dentro de una transacción SQL.
 * 
 * @param {number} id_estudiante 
 * @param {number} id_docente 
 * @param {string} nombre_rutina 
 * @param {Array} ejercicios [{ dia_semana, id_ejercicio, series, repeticiones }]
 * @returns {number} id_rutina creada
 */
const crearRutinaConEjercicios = async (id_estudiante, id_docente, nombre_rutina, ejercicios) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Desactivar cualquier rutina anterior del estudiante
    await client.query(
      `UPDATE rutinas 
          SET activa = false 
        WHERE id_estudiante = $1`,
      [id_estudiante]
    );

    // 2. Insertar la nueva rutina
    const resRutina = await client.query(
      `INSERT INTO rutinas (id_estudiante, id_docente, nombre, activa) 
       VALUES ($1, $2, $3, true) 
       RETURNING id_rutina`,
      [id_estudiante, id_docente, nombre_rutina || 'Rutina Personalizada']
    );
    const id_rutina = resRutina.rows[0].id_rutina;

    // 3. Insertar los ejercicios en rutina_ejercicios
    // Si no enviaron ejercicios (array vacío), no inserta nada pero guarda la rutina vacía
    if (ejercicios && ejercicios.length > 0) {
      for (const ej of ejercicios) {
        await client.query(
          `INSERT INTO rutina_ejercicios (id_rutina, id_ejercicio, dia_semana, series, repeticiones)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_rutina, ej.id_ejercicio, ej.dia_semana, ej.series, ej.repeticiones]
        );
      }
    }

    await client.query('COMMIT');
    return id_rutina;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  crearRutinaConEjercicios
};
