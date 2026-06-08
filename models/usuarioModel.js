const pool = require('../config/db');

/**
 * Busca un usuario por su código universitario.
 * @param {string} codigo
 * @returns {Object|null} Fila de la tabla usuarios o null si no existe
 */
const buscarPorCodigo = async (codigo) => {
  const { rows } = await pool.query(
    `SELECT id_usuario, codigo, nombres, apellidos,
            correo, password, rol, estado
       FROM usuarios
      WHERE codigo = $1`,
    [codigo]
  );
  return rows[0] ?? null;
};

/**
 * Verifica si un código universitario ya está registrado.
 * @param {string} codigo
 * @returns {boolean}
 */
const codigoExiste = async (codigo) => {
  const { rows } = await pool.query(
    'SELECT 1 FROM usuarios WHERE codigo = $1',
    [codigo]
  );
  return rows.length > 0;
};

/**
 * Inserta un nuevo usuario en la base de datos.
 * IMPORTANTE: La contraseña debe llegar ya hasheada con bcrypt desde el controlador.
 * @param {Object} datos - { codigo, nombres, apellidos, correo, passwordHash, rol }
 * @returns {Object} Usuario recién creado (sin contraseña)
 */
const crearUsuario = async ({ codigo, nombres, apellidos, correo, passwordHash, rol }) => {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (codigo, nombres, apellidos, correo, password, rol)
          VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_usuario, codigo, nombres, apellidos, correo, rol`,
    [codigo, nombres, apellidos, correo, passwordHash, rol]
  );
  return rows[0];
};

/**
 * Obtiene el perfil completo de un usuario por su clave primaria.
 * Usada por el dashboardController para mostrar datos frescos de la BD.
 * @param {number} id_usuario
 * @returns {Object|null}
 */
const buscarPorId = async (id_usuario) => {
  const { rows } = await pool.query(
    `SELECT id_usuario, codigo, nombres, apellidos,
            correo, rol, estado, fecha_registro
       FROM usuarios
      WHERE id_usuario = $1`,
    [id_usuario]
  );
  return rows[0] ?? null;
};

module.exports = { buscarPorCodigo, codigoExiste, crearUsuario, buscarPorId };
