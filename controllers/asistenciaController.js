const asistenciaModel = require('../models/asistenciaModel');
const estudianteModel = require('../models/estudianteModel');
const crypto = require('crypto');

// Memoria simple para el token QR
let currentQrToken = null;
let currentQrExpires = 0;

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

/**
 * DOCENTE: Mostrar la vista del QR Institucional.
 */
const mostrarPuntoAsistenciaQR = (req, res) => {
  res.render('docente/asistencia_qr', {
    usuario: req.session.usuario
  });
};

/**
 * DOCENTE: API para generar y obtener un nuevo token QR temporal (5 mins).
 */
const generarTokenQR = (req, res) => {
  try {
    currentQrToken = crypto.randomBytes(16).toString('hex');
    currentQrExpires = Date.now() + 5 * 60 * 1000;
    res.json({ token: currentQrToken, expiresAt: currentQrExpires });
  } catch (err) {
    console.error('[asistenciaController] generarTokenQR:', err.message);
    res.status(500).json({ error: 'Error al generar el token QR.' });
  }
};

/**
 * ESTUDIANTE: Registrar asistencia escaneando el QR institucional.
 */
const registrarAsistenciaQR = async (req, res) => {
  try {
    const { token } = req.query;
    
    // Validar token temporal
    if (!token || token !== currentQrToken || Date.now() > currentQrExpires) {
      return res.redirect('/estudiante/asistencia?error=Código QR inválido o expirado. Solicite al docente que genere uno nuevo.');
    }
    
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');
    
    const id_estudiante = estudiante.id_estudiante;
    const asistenciaActiva = await asistenciaModel.obtenerAsistenciaAbierta(id_estudiante);
    
    let tipo = 'Entrada';
    let fecha = new Date();
    
    if (asistenciaActiva) {
      await asistenciaModel.registrarSalida(asistenciaActiva.id_asistencia);
      tipo = 'Salida';
    } else {
      await asistenciaModel.registrarIngreso(id_estudiante, 'QR');
    }
    
    // Mostrar página elegante de confirmación
    res.render('estudiante/asistencia_qr_success', {
      usuario: req.session.usuario,
      tipo,
      fecha
    });
    
  } catch (err) {
    console.error('[asistenciaController] registrarAsistenciaQR:', err.message);
    res.redirect('/estudiante/asistencia?error=Ocurrió un error interno al registrar la asistencia mediante QR.');
  }
};

module.exports = {
  mostrarAsistenciaEstudiante,
  registrarIngreso,
  registrarSalida,
  mostrarAsistenciasDocente,
  mostrarPuntoAsistenciaQR,
  generarTokenQR,
  registrarAsistenciaQR
};
