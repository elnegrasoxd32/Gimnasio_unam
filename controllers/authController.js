const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');

const SALT_ROUNDS = 10;

// ── Helper: redirige al dashboard según el rol del usuario ───────────────────
const redirigirPorRol = (res, rol) => {
  const rutas = {
    ESTUDIANTE: '/dashboard/estudiante',
    DOCENTE: '/dashboard/docente',
  };
  return res.redirect(rutas[rol] ?? '/login');
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /login
 * Muestra el formulario de inicio de sesión.
 * Si el usuario ya tiene sesión activa, lo redirige a su dashboard.
 */
const mostrarLogin = (req, res) => {
  if (req.session.usuario) {
    return redirigirPorRol(res, req.session.usuario.rol);
  }

  // Mensaje de éxito si viene de un registro exitoso
  const success = req.query.registered
    ? '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.'
    : null;

  res.render('login', { error: null, success });
};

/**
 * POST /login
 * Valida el código y la contraseña. Si son correctos, crea la sesión
 * y redirige al dashboard correspondiente al rol del usuario.
 */
const procesarLogin = async (req, res) => {
  const { codigo, password } = req.body;

  try {
    // 1. Campos obligatorios
    if (!codigo?.trim() || !password) {
      return res.render('login', {
        error: 'Por favor, completa todos los campos.',
        success: null,
      });
    }

    // 2. Buscar usuario en la BD
    const usuario = await usuarioModel.buscarPorCodigo(codigo.trim());
    if (!usuario) {
      // Mensaje genérico: no revelar si el código existe o no
      return res.render('login', {
        error: 'Código o contraseña incorrectos.',
        success: null,
      });
    }

    // 3. Comparar contraseña con el hash almacenado
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.render('login', {
        error: 'Código o contraseña incorrectos.',
        success: null,
      });
    }

    // 4. Verificar estado de la cuenta
    if (!usuario.estado) {
      return res.render('login', {
        error: 'Tu cuenta está inactiva. Contacta al administrador del gimnasio.',
        success: null,
      });
    }

    // 5. Crear sesión con datos mínimos necesarios
    req.session.usuario = {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
    };

    // 6. Redirigir según rol
    return redirigirPorRol(res, usuario.rol);

  } catch (err) {
    console.error('[authController] procesarLogin:', err.message);
    res.render('login', {
      error: 'Error interno del servidor. Intenta de nuevo.',
      success: null,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTRO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /registro
 * Muestra el formulario de registro de nuevo usuario.
 */
const mostrarRegistro = (req, res) => {
  res.render('registro', { error: null });
};

/**
 * POST /registro
 * Valida los datos del formulario, hashea la contraseña con bcrypt
 * e inserta el nuevo usuario en la base de datos.
 */
const procesarRegistro = async (req, res) => {
  const { codigo, nombres, apellidos, correo, password, confirmar_password, rol } = req.body;

  try {
    // 1. Campos obligatorios
    if (!codigo || !nombres || !apellidos || !correo || !password || !confirmar_password || !rol) {
      return res.render('registro', { error: 'Por favor, completa todos los campos.' });
    }

    // 2. Confirmación de contraseñas
    if (password !== confirmar_password) {
      return res.render('registro', { error: 'Las contraseñas no coinciden.' });
    }

    // 3. Longitud mínima de contraseña
    if (password.length < 8) {
      return res.render('registro', { error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // 4. Rol válido
    if (!['ESTUDIANTE', 'DOCENTE'].includes(rol)) {
      return res.render('registro', { error: 'El rol seleccionado no es válido.' });
    }

    // 5. Código universitario único
    const existe = await usuarioModel.codigoExiste(codigo.trim());
    if (existe) {
      return res.render('registro', { error: 'El código universitario ya está registrado.' });
    }

    // 6. Hash de la contraseña (NUNCA se almacena en texto plano)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 7. Insertar en la base de datos
    await usuarioModel.crearUsuario({
      codigo: codigo.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim().toLowerCase(),
      passwordHash,
      rol,
    });

    // 8. Redirigir al login con mensaje de éxito
    return res.redirect('/login?registered=true');

  } catch (err) {
    console.error('[authController] procesarRegistro:', err.message);
    res.render('registro', { error: 'Error interno del servidor. Intenta de nuevo.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /logout
 * Destruye la sesión del usuario y lo redirige al login.
 */
const cerrarSesion = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('[authController] cerrarSesion:', err.message);
    res.redirect('/login');
  });
};

module.exports = {
  mostrarLogin,
  procesarLogin,
  mostrarRegistro,
  procesarRegistro,
  cerrarSesion,
};
