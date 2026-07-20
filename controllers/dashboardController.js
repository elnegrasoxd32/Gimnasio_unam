const usuarioModel = require('../models/usuarioModel');
const estudianteModel = require('../models/estudianteModel');
const recomendacionModel = require('../models/recomendacionModel');
const incidenciaModel = require('../models/incidenciaModel');

// ── Helper: saludo según la hora local del servidor ───────────────────────────
const obtenerSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * GET /dashboard/estudiante
 * Consulta el perfil completo del estudiante autenticado y renderiza su dashboard.
 * El middleware ya garantizó sesión activa y rol ESTUDIANTE antes de llegar aquí.
 */
const mostrarEstudiante = async (req, res) => {
  try {
    const usuario = await usuarioModel.buscarPorId(req.session.usuario.id_usuario);

    // Si el usuario fue eliminado de la BD tras iniciar sesión
    if (!usuario) {
      req.session.destroy(() => { });
      return res.redirect('/login');
    }

    const perfilFisico = await estudianteModel.buscarPorIdUsuario(req.session.usuario.id_usuario);
    const conteoRecomendaciones = perfilFisico
      ? await recomendacionModel.obtenerConteoParaEstudiante(perfilFisico.id_estudiante)
      : 0;
    const incidenciasAbiertas = perfilFisico
      ? await incidenciaModel.contarAbiertasPorEstudiante(perfilFisico.id_estudiante)
      : 0;

    res.render('dashboard/estudiante', {
      usuario,
      perfilFisico,
      saludo: obtenerSaludo(),
      conteoRecomendaciones,
      incidenciasAbiertas,
    });

  } catch (err) {
    console.error('[dashboardController] mostrarEstudiante:', err.message);
    res.redirect('/login');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * GET /dashboard/docente
 * Consulta el perfil completo del docente autenticado y renderiza su dashboard.
 * El middleware ya garantizó sesión activa y rol DOCENTE antes de llegar aquí.
 */
const mostrarDocente = async (req, res) => {
  try {
    const usuario = await usuarioModel.buscarPorId(req.session.usuario.id_usuario);

    if (!usuario) {
      req.session.destroy(() => { });
      return res.redirect('/login');
    }

    const incidenciaStats = await incidenciaModel.obtenerEstadisticas();

    res.render('dashboard/docente', {
      usuario,
      saludo: obtenerSaludo(),
      incidenciaStats,
    });

  } catch (err) {
    console.error('[dashboardController] mostrarDocente:', err.message);
    res.redirect('/login');
  }
};

module.exports = { mostrarEstudiante, mostrarDocente };
