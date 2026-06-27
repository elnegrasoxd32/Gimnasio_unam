const pool = require('../config/db');

/**
 * Obtiene todos los ejercicios del catálogo ordenados por grupo muscular y nombre.
 * @returns {Array} Lista de ejercicios
 */
const obtenerTodos = async () => {
  const query = `
    SELECT id_ejercicio, nombre, grupo_muscular, descripcion
      FROM ejercicios
     ORDER BY grupo_muscular, nombre;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  obtenerTodos
};
