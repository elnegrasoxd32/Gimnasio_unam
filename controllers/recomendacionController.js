const recomendacionModel = require('../models/recomendacionModel');
const docenteModel = require('../models/docenteModel');
const estudianteModel = require('../models/estudianteModel');

// ─────────────────────────────────────────────────────────────────────────────
// DOCENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Muestra la lista de estudiantes para que el docente elija a quién recomendar.
 */
const listarEstudiantes = async (req, res) => {
  try {
    const { search } = req.query;
    const estudiantes = await recomendacionModel.buscarEstudiantes(search || '');

    res.render('docente/recomendaciones_lista', {
      usuario: req.session.usuario,
      estudiantes,
      search: search || ''
    });
  } catch (err) {
    console.error('[recomendacionController] listarEstudiantes:', err.message);
    res.redirect('/dashboard/docente');
  }
};

/**
 * Muestra el detalle de un estudiante, el formulario y el historial de recomendaciones.
 */
const mostrarDetalleEstudiante = async (req, res) => {
  try {
    const { id_estudiante } = req.params;
    const { search, sortOrder } = req.query;
    const id_usuario_docente = req.session.usuario.id_usuario;

    const id_docente = await docenteModel.obtenerIdDocente(id_usuario_docente);

    if (!id_docente) {
    return res.redirect('/dashboard/docente');
    }

    const resumen = await recomendacionModel.obtenerResumenEstudiante(id_estudiante);
    if (!resumen) {
        return res.redirect('/docente/recomendaciones');
    }

    const recomendaciones = await recomendacionModel.obtenerRecomendacionesPorEstudiante(
        id_estudiante,
        search || '',
        sortOrder || 'DESC'
    );

const stats = await recomendacionModel.obtenerEstadisticasDocente(id_docente);

    res.render('docente/recomendaciones_detalle', {
      usuario: req.session.usuario,
      resumen,
      id_estudiante,
      recomendaciones,
      stats,
      search: search || '',
      sortOrder: sortOrder || 'DESC',
      error: req.query.error,
      success: req.query.success
    });
  } catch (err) {
    console.error('[recomendacionController] mostrarDetalleEstudiante:', err.message);
    res.redirect('/docente/recomendaciones');
  }
};

/**
 * Crea una nueva recomendación.
 */
const crearRecomendacion = async (req, res) => {
  const { id_estudiante } = req.params;
  const { mensaje } = req.body;
  try {
    if (!mensaje || mensaje.trim().length < 10 || mensaje.trim().length > 500) {
      return res.redirect(`/docente/recomendaciones/${id_estudiante}?error=El mensaje debe tener entre 10 y 500 caracteres.`);
    }

    const id_docente = await docenteModel.obtenerIdDocente(req.session.usuario.id_usuario);
    if (!id_docente) {
      return res.redirect('/dashboard/docente');
    } 
    await recomendacionModel.crearRecomendacion(id_estudiante, id_docente, mensaje.trim());

    res.redirect(`/docente/recomendaciones/${id_estudiante}?success=Recomendación enviada exitosamente.`);
  } catch (err) {
    console.error('[recomendacionController] crearRecomendacion:', err.message);
    res.redirect(`/docente/recomendaciones/${id_estudiante}?error=Error al enviar la recomendación.`);
  }
};

/**
 * Edita una recomendación.
 */
const editarRecomendacion = async (req, res) => {
  const { id_recomendacion } = req.params;
  const { mensaje, id_estudiante } = req.body;

  try {
    if (!mensaje || mensaje.trim().length < 10 || mensaje.trim().length > 500) {
      return res.status(400).json({ error: 'El mensaje debe tener entre 10 y 500 caracteres.' });
    }

    const id_docente = await docenteModel.obtenerIdDocente(req.session.usuario.id_usuario);

    if (!id_docente) {
      return res.redirect('/dashboard/docente');
    } const editado = await recomendacionModel.editarRecomendacion(id_recomendacion, id_docente, mensaje.trim());

    if (!editado) return res.status(403).json({ error: 'No autorizado o recomendación no existe.' });

    res.json({ success: true, message: 'Recomendación actualizada.' });
  } catch (err) {
    console.error('[recomendacionController] editarRecomendacion:', err.message);
    res.status(500).json({ error: 'Error del servidor.' });
  }
};

/**
 * Elimina una recomendación.
 */
const eliminarRecomendacion = async (req, res) => {
  const { id_recomendacion } = req.params;

  try {
    const id_docente = await docenteModel.obtenerIdDocente(req.session.usuario.id_usuario);

    if (!id_docente) {
      return res.redirect('/dashboard/docente');
    } const eliminado = await recomendacionModel.eliminarRecomendacion(id_recomendacion, id_docente);

    if (!eliminado) return res.status(403).json({ error: 'No autorizado o recomendación no existe.' });

    res.json({ success: true, message: 'Recomendación eliminada.' });
  } catch (err) {
    console.error('[recomendacionController] eliminarRecomendacion:', err.message);
    res.status(500).json({ error: 'Error del servidor.' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIANTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Muestra las recomendaciones al estudiante.
 */
const mostrarRecomendacionesEstudiante = async (req, res) => {
  try {
    const estudiante = await estudianteModel.buscarPorIdUsuario(req.session.usuario.id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    const recomendaciones = await recomendacionModel.obtenerParaEstudiante(estudiante.id_estudiante);

    res.render('estudiante/recomendaciones', {
      usuario: req.session.usuario,
      recomendaciones
    });
  } catch (err) {
    console.error('[recomendacionController] mostrarRecomendacionesEstudiante:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

module.exports = {
  listarEstudiantes,
  mostrarDetalleEstudiante,
  crearRecomendacion,
  editarRecomendacion,
  eliminarRecomendacion,
  mostrarRecomendacionesEstudiante
};
