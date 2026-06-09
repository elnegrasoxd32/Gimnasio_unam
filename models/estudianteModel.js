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

module.exports = {
  buscarPorIdUsuario,
  upsertPerfil
};
