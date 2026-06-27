const pool = require('../config/db');

/**
 * Busca el perfil físico de un estudiante por el ID de usuario.
 * @param {number} id_usuario 
 * @returns {Object|null} Fila de la tabla estudiantes o null si no ha sido creado
 */
const buscarPorIdUsuario = async (id_usuario) => {
  const { rows } = await pool.query(
    `SELECT id_estudiante, id_usuario, peso, altura, objetivo_principal, dias_disponibles
       FROM estudiantes
      WHERE id_usuario = $1`,
    [id_usuario]
  );
  return rows[0] ?? null;
};

/**
 * Inserta o actualiza (upsert) el perfil físico de un estudiante.
 * Utiliza ON CONFLICT sobre id_usuario ya que es UNIQUE en la tabla.
 * @param {Object} datos - Objeto con los datos del perfil
 */
const upsertPerfil = async ({ id_usuario, peso, altura, objetivo_principal, dias_disponibles }) => {
  const query = `
    INSERT INTO estudiantes (id_usuario, peso, altura, objetivo_principal, dias_disponibles)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id_usuario)
    DO UPDATE SET 
      peso = EXCLUDED.peso,
      altura = EXCLUDED.altura,
      objetivo_principal = EXCLUDED.objetivo_principal,
      dias_disponibles = EXCLUDED.dias_disponibles
    RETURNING id_estudiante, id_usuario, peso, altura, objetivo_principal, dias_disponibles;
  `;
  
  const { rows } = await pool.query(query, [id_usuario, peso, altura, objetivo_principal, dias_disponibles]);
  return rows[0];
};

/**
 * Obtiene la lista de estudiantes que tienen su perfil físico completo.
 * Realiza un INNER JOIN con la tabla usuarios para obtener datos básicos.
 * @returns {Array} Lista de estudiantes
 */
const obtenerEstudiantesConPerfil = async () => {
  const query = `
    SELECT u.codigo, u.nombres, u.apellidos, 
           e.id_estudiante, e.objetivo_principal, e.dias_disponibles
      FROM usuarios u
     INNER JOIN estudiantes e ON u.id_usuario = e.id_usuario
     WHERE u.rol = 'ESTUDIANTE' AND u.estado = true
     ORDER BY u.nombres, u.apellidos;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtiene los datos completos de un estudiante por su id_estudiante.
 * @param {number} id_estudiante 
 * @returns {Object|null}
 */
const buscarEstudianteCompleto = async (id_estudiante) => {
  const query = `
    SELECT u.codigo, u.nombres, u.apellidos, 
           e.id_estudiante, e.objetivo_principal, e.dias_disponibles
      FROM usuarios u
     INNER JOIN estudiantes e ON u.id_usuario = e.id_usuario
     WHERE e.id_estudiante = $1
  `;
  const { rows } = await pool.query(query, [id_estudiante]);
  return rows[0] ?? null;
};

module.exports = {
  buscarPorIdUsuario,
  upsertPerfil,
  obtenerEstudiantesConPerfil,
  buscarEstudianteCompleto
};
