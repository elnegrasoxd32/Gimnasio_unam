// ── Helper: construye la URL del dashboard según el rol ──────────────────────
const dashboardPorRol = (rol) => {
  const rutas = {
    ESTUDIANTE: '/dashboard/estudiante',
    DOCENTE: '/dashboard/docente',
  };
  return rutas[rol] ?? '/login';
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Middleware — verificarSesion
 *
 * Comprueba que exista una sesión activa (req.session.usuario).
 * Si no hay sesión → redirige a /login.
 * Si hay sesión   → delega al siguiente middleware (next()).
 */
const verificarSesion = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Middleware factory — verificarRol(rolesPermitidos)
 *
 * Recibe un array de roles autorizados para la ruta.
 * Si el rol del usuario está en la lista → delega a next().
 * Si el rol NO está en la lista → redirige al dashboard correcto
 * del usuario (Opción B: redirección silenciosa, sin página de error).
 *
 * Uso en la ruta:
 *   router.get('/dashboard/estudiante',
 *     verificarSesion,
 *     verificarRol(['ESTUDIANTE']),
 *     dashboardCtrl.mostrarEstudiante
 *   );
 *
 * @param {string[]} rolesPermitidos - Array de roles con acceso a la ruta
 * @returns {Function} Middleware de Express
 */
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    const { rol } = req.session.usuario;

    if (rolesPermitidos.includes(rol)) {
      return next();
    }

    // Redirige al dashboard que le corresponde al usuario autenticado
    return res.redirect(dashboardPorRol(rol));
  };
};

module.exports = { verificarSesion, verificarRol };
