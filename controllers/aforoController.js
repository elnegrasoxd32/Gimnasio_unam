const aforoModel = require('../models/aforoModel');

// Configuración de capacidad máxima (podría moverse a BD si hubiera tabla de configuración)
const CAPACIDAD_MAXIMA = 50;

/**
 * Helper para calcular el nivel de aforo
 */
const calcularNivelAforo = (presentes) => {
  const porcentaje = Math.min((presentes / CAPACIDAD_MAXIMA) * 100, 100);
  if (porcentaje < 50) return { nivel: 'Bajo', color: 'success', porcentaje: porcentaje.toFixed(1) };
  if (porcentaje < 80) return { nivel: 'Medio', color: 'warning', porcentaje: porcentaje.toFixed(1) };
  return { nivel: 'Alto', color: 'danger', porcentaje: porcentaje.toFixed(1) };
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIANTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /estudiante/aforo
 * Muestra la vista de aforo para el estudiante.
 */
const mostrarAforoEstudiante = async (req, res) => {
  try {
    const presentes = await aforoModel.obtenerOcupacionActual();
    const aforo = calcularNivelAforo(presentes);

    res.render('estudiante/aforo', {
      usuario: req.session.usuario,
      presentes,
      capacidad_maxima: CAPACIDAD_MAXIMA,
      aforo
    });
  } catch (err) {
    console.error('[aforoController] mostrarAforoEstudiante:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /docente/aforo
 * Muestra el panel administrativo de aforo para el docente.
 */
const mostrarAforoDocente = async (req, res) => {
  try {
    const presentes = await aforoModel.obtenerOcupacionActual();
    const aforo = calcularNivelAforo(presentes);
    
    // Para gráficos
    const tendenciaSemanal = await aforoModel.obtenerTendenciaSemanal();
    const horasPico = await aforoModel.obtenerHorasPico();
    const estadisticas = await aforoModel.obtenerEstadisticas();

    res.render('docente/aforo', {
      usuario: req.session.usuario,
      presentes,
      capacidad_maxima: CAPACIDAD_MAXIMA,
      aforo,
      tendenciaSemanal: JSON.stringify(tendenciaSemanal),
      horasPico: JSON.stringify(horasPico),
      estadisticas
    });
  } catch (err) {
    console.error('[aforoController] mostrarAforoDocente:', err.message);
    res.redirect('/dashboard/docente');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/aforo
 * Endpoint para refrescar la cantidad de personas en tiempo real.
 */
const apiObtenerAforo = async (req, res) => {
  try {
    const presentes = await aforoModel.obtenerOcupacionActual();
    const aforo = calcularNivelAforo(presentes);
    res.json({ presentes, capacidad_maxima: CAPACIDAD_MAXIMA, aforo });
  } catch (err) {
    console.error('[aforoController] apiObtenerAforo:', err.message);
    res.status(500).json({ error: 'Error al obtener aforo' });
  }
};

module.exports = {
  mostrarAforoEstudiante,
  mostrarAforoDocente,
  apiObtenerAforo
};
