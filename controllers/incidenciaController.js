const incidenciaModel = require('../models/incidenciaModel');
const estudianteModel = require('../models/estudianteModel');

// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIANTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /estudiante/incidencias
 * Muestra el formulario de creación y el listado de incidencias del estudiante.
 */
const mostrarIncidenciasEstudiante = async (req, res) => {
  try {
    const estudiante = await estudianteModel.buscarPorIdUsuario(req.session.usuario.id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    const tipos = await incidenciaModel.obtenerTipos();
    const incidencias = await incidenciaModel.obtenerPorEstudiante(estudiante.id_estudiante);

    res.render('estudiante/incidencias', {
      usuario: req.session.usuario,
      tipos,
      incidencias,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('[incidenciaController] mostrarIncidenciasEstudiante:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * POST /estudiante/incidencias
 * Crea una nueva incidencia.
 */
const crearIncidencia = async (req, res) => {
  try {
    const estudiante = await estudianteModel.buscarPorIdUsuario(req.session.usuario.id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    const { id_tipo, descripcion } = req.body;

    // Validaciones
    if (!id_tipo) {
      return res.redirect('/estudiante/incidencias?error=Debes seleccionar un tipo de incidencia.');
    }

    const desc = (descripcion || '').trim();
    if (desc.length < 15 || desc.length > 500) {
      return res.redirect('/estudiante/incidencias?error=La descripción debe tener entre 15 y 500 caracteres.');
    }

    await incidenciaModel.crear(estudiante.id_estudiante, id_tipo, desc);
    res.redirect('/estudiante/incidencias?success=Incidencia reportada exitosamente.');
  } catch (err) {
    console.error('[incidenciaController] crearIncidencia:', err.message);
    res.redirect('/estudiante/incidencias?error=Error al registrar la incidencia.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /docente/incidencias
 * Muestra el listado de todas las incidencias con filtros.
 */
const listarIncidencias = async (req, res) => {
  try {
    const { search, estado, orden } = req.query;

    const incidencias = await incidenciaModel.obtenerTodas(
      search || '',
      estado || '',
      orden || 'DESC'
    );

    res.render('docente/incidencias_lista', {
      usuario: req.session.usuario,
      incidencias,
      search: search || '',
      estado: estado || '',
      orden: orden || 'DESC'
    });
  } catch (err) {
    console.error('[incidenciaController] listarIncidencias:', err.message);
    res.redirect('/dashboard/docente');
  }
};

/**
 * GET /docente/incidencias/:id_incidencia
 * Muestra el detalle de una incidencia.
 */
const verDetalle = async (req, res) => {
  try {
    const { id_incidencia } = req.params;
    const detalle = await incidenciaModel.obtenerDetalle(id_incidencia);

    if (!detalle) return res.redirect('/docente/incidencias');

    res.render('docente/incidencias_detalle', {
      usuario: req.session.usuario,
      detalle,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('[incidenciaController] verDetalle:', err.message);
    res.redirect('/docente/incidencias');
  }
};

/**
 * POST /docente/incidencias/:id_incidencia/estado
 * Cambia el estado de una incidencia (PENDIENTE → EN_PROCESO → RESUELTO).
 */
const cambiarEstado = async (req, res) => {
  const { id_incidencia } = req.params;
  const { nuevo_estado } = req.body;

  try {
    if (!nuevo_estado || !['EN_PROCESO', 'RESUELTO'].includes(nuevo_estado)) {
      return res.redirect(`/docente/incidencias/${id_incidencia}?error=Estado no válido.`);
    }

    const actualizado = await incidenciaModel.cambiarEstado(id_incidencia, nuevo_estado);

    if (!actualizado) {
      return res.redirect(`/docente/incidencias/${id_incidencia}?error=No se puede realizar esa transición de estado.`);
    }

    res.redirect(`/docente/incidencias/${id_incidencia}?success=Estado actualizado correctamente.`);
  } catch (err) {
    console.error('[incidenciaController] cambiarEstado:', err.message);
    res.redirect(`/docente/incidencias/${id_incidencia}?error=Error al actualizar el estado.`);
  }
};

module.exports = {
  mostrarIncidenciasEstudiante,
  crearIncidencia,
  listarIncidencias,
  verDetalle,
  cambiarEstado
};
