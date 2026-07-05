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

/**
 * Obtiene la rutina activa de un estudiante a partir de su id_usuario.
 * Realiza JOINs entre estudiantes, rutinas, rutina_ejercicios y ejercicios.
 * Devuelve la rutina con sus ejercicios agrupados por dia_semana.
 * 
 * @param {number} id_usuario
 * @returns {Object|null} { id_rutina, nombre, fecha_creacion, activa, ejerciciosPorDia: { Lunes: [...], ... } }
 */
const obtenerRutinaActivaPorUsuario = async (id_usuario) => {
  // 1. Obtener la rutina activa
  const resRutina = await pool.query(
    `SELECT r.id_rutina, r.nombre, r.fecha_creacion, r.activa
       FROM rutinas r
       JOIN estudiantes e ON r.id_estudiante = e.id_estudiante
      WHERE e.id_usuario = $1 AND r.activa = true
      LIMIT 1`,
    [id_usuario]
  );

  if (resRutina.rows.length === 0) return null;

  const rutina = resRutina.rows[0];

  // 2. Obtener los ejercicios de esa rutina
  const resEjercicios = await pool.query(
    `SELECT re.dia_semana, re.series, re.repeticiones, re.orden,
            ej.id_ejercicio, ej.nombre AS nombre_ejercicio, ej.grupo_muscular, ej.descripcion
       FROM rutina_ejercicios re
       JOIN ejercicios ej ON re.id_ejercicio = ej.id_ejercicio
      WHERE re.id_rutina = $1
      ORDER BY re.dia_semana, COALESCE(re.orden, re.id_rutina_ejercicio)`,
    [rutina.id_rutina]
  );

  // 3. Agrupar ejercicios por dia_semana
  const ejerciciosPorDia = {};
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  for (const ej of resEjercicios.rows) {
    const dia = ej.dia_semana || 'Sin asignar';
    if (!ejerciciosPorDia[dia]) ejerciciosPorDia[dia] = [];
    ejerciciosPorDia[dia].push({
      id_ejercicio: ej.id_ejercicio,
      nombre: ej.nombre_ejercicio,
      grupo_muscular: ej.grupo_muscular,
      descripcion: ej.descripcion,
      series: ej.series,
      repeticiones: ej.repeticiones
    });
  }

  // 4. Ordenar las claves por día de la semana
  const ejerciciosOrdenados = {};
  ordenDias.forEach(dia => {
    if (ejerciciosPorDia[dia]) ejerciciosOrdenados[dia] = ejerciciosPorDia[dia];
  });
  // Agregar días que no estén en la lista estándar
  Object.keys(ejerciciosPorDia).forEach(dia => {
    if (!ejerciciosOrdenados[dia]) ejerciciosOrdenados[dia] = ejerciciosPorDia[dia];
  });

  return {
    id_rutina: rutina.id_rutina,
    nombre: rutina.nombre,
    fecha_creacion: rutina.fecha_creacion,
    activa: rutina.activa,
    ejerciciosPorDia: ejerciciosOrdenados
  };
};

module.exports = {
  crearRutinaConEjercicios,
  obtenerRutinaActivaPorUsuario
};
