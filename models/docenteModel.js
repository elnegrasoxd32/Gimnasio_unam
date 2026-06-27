const pool = require('../config/db');

/**
 * Obtiene el ID del docente a partir del ID de usuario de sesión.
 * @param {number} id_usuario 
 * @returns {number|null} id_docente
 */
const obtenerIdDocente = async (id_usuario) => {
  const query = `
    SELECT id_docente
      FROM docentes
     WHERE id_usuario = $1;
  `;
  const { rows } = await pool.query(query, [id_usuario]);
  return rows.length > 0 ? rows[0].id_docente : null;
};

module.exports = {
  obtenerIdDocente
};
