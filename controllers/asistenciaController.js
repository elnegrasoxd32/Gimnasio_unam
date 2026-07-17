const asistenciaModel = require('../models/asistenciaModel');
const estudianteModel = require('../models/estudianteModel');

/**
 * ESTUDIANTE: Mostrar pantalla de Asistencia (Botones e historial).
 */
const mostrarAsistenciaEstudiante = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    
    if (!estudiante) return res.redirect('/dashboard/estudiante');
    const id_estudiante = estudiante.id_estudiante;

    const asistenciaActiva = await asistenciaModel.obtenerAsistenciaAbierta(id_estudiante);
    const historial = await asistenciaModel.obtenerHistorialEstudiante(id_estudiante);

    res.render('estudiante/asistencia', {
      usuario: req.session.usuario,
      asistenciaActiva,
      historial,
      error: req.query.error,
      success: req.query.success
    });
  } catch (err) {
    console.error('[asistenciaController] mostrarAsistenciaEstudiante:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * ESTUDIANTE: Registrar ingreso.
 */
const registrarIngreso = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');
    
    const id_estudiante = estudiante.id_estudiante;

    const asistenciaActiva = await asistenciaModel.obtenerAsistenciaAbierta(id_estudiante);
    if (asistenciaActiva) {
      return res.redirect('/estudiante/asistencia?error=Ya tienes una asistencia en curso. Primero registra tu salida.');
    }

    await asistenciaModel.registrarIngreso(id_estudiante);
    res.redirect('/estudiante/asistencia?success=Ingreso registrado correctamente.');
  } catch (err) {
    console.error('[asistenciaController] registrarIngreso:', err.message);
    res.redirect('/estudiante/asistencia?error=Ocurrió un error al registrar el ingreso.');
  }
};

/**
 * ESTUDIANTE: Registrar salida.
 */
const registrarSalida = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');
    
    const id_estudiante = estudiante.id_estudiante;

    const asistenciaActiva = await asistenciaModel.obtenerAsistenciaAbierta(id_estudiante);
    if (!asistenciaActiva) {
      return res.redirect('/estudiante/asistencia?error=No tienes ninguna asistencia en curso para registrar salida.');
    }

    await asistenciaModel.registrarSalida(asistenciaActiva.id_asistencia);
    res.redirect('/estudiante/asistencia?success=Salida registrada correctamente.');
  } catch (err) {
    console.error('[asistenciaController] registrarSalida:', err.message);
    res.redirect('/estudiante/asistencia?error=Ocurrió un error al registrar la salida.');
  }
};

/**
 * DOCENTE: Ver todas las asistencias con filtros opcionales.
 */
const mostrarAsistenciasDocente = async (req, res) => {
  try {
    const { filtroEstudiante, filtroFecha } = req.query;

    const historial = await asistenciaModel.obtenerTodasAsistencias(filtroEstudiante, filtroFecha);

    res.render('docente/asistencias', {
      usuario: req.session.usuario,
      historial,
      filtroEstudiante: filtroEstudiante || '',
      filtroFecha: filtroFecha || ''
    });
  } catch (err) {
    console.error('[asistenciaController] mostrarAsistenciasDocente:', err.message);
    res.redirect('/dashboard/docente');
  }
};

module.exports = {
  mostrarAsistenciaEstudiante,
  registrarIngreso,
  registrarSalida,
  mostrarAsistenciasDocente
};
