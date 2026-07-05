const entrenamientoModel = require('../models/entrenamientoModel');
const estudianteModel = require('../models/estudianteModel');
const rutinaModel = require('../models/rutinaModel');

/**
 * POST /estudiante/entrenamiento/iniciar
 * Inicia una sesión y redirige a la vista de entrenamiento.
 */
const iniciarEntrenamiento = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    // Revisar si ya hay una sesión activa, para no duplicar
    let sesionActiva = await entrenamientoModel.obtenerSesionActiva(estudiante.id_estudiante);
    
    if (!sesionActiva) {
      sesionActiva = await entrenamientoModel.iniciarSesion(estudiante.id_estudiante);
    }
    
    res.redirect('/estudiante/entrenamiento');
  } catch (err) {
    console.error('[entrenamientoController] iniciarEntrenamiento:', err.message);
    res.redirect('/estudiante/rutina');
  }
};

/**
 * GET /estudiante/entrenamiento
 * Muestra la vista para registrar repeticiones y pesos.
 */
const mostrarEntrenamiento = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    const sesionActiva = await entrenamientoModel.obtenerSesionActiva(estudiante.id_estudiante);
    if (!sesionActiva) {
      // Si no hay sesión activa, redirige a Mi Rutina
      return res.redirect('/estudiante/rutina');
    }

    const rutina = await rutinaModel.obtenerRutinaActivaPorUsuario(id_usuario);
    if (!rutina) {
      return res.redirect('/estudiante/rutina');
    }

    // Obtener los registros ya guardados en esta sesión (por si recarga la página)
    const registrosPrevios = await entrenamientoModel.obtenerRegistrosSesion(sesionActiva.id_sesion);

    res.render('estudiante/entrenamiento', {
      usuario: req.session.usuario,
      rutina,
      sesionActiva,
      registrosPrevios,
      error: req.query.error
    });
  } catch (err) {
    console.error('[entrenamientoController] mostrarEntrenamiento:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * POST /estudiante/entrenamiento/registrar
 * API Endpoint para registrar una serie mediante AJAX.
 */
const registrarSerie = async (req, res) => {
  try {
    const { id_sesion, id_ejercicio, numero_serie, peso, repeticiones_realizadas } = req.body;
    
    if (!id_sesion || !id_ejercicio || !numero_serie || peso < 0 || repeticiones_realizadas < 0) {
      return res.status(400).json({ error: 'Datos inválidos. Peso y repeticiones deben ser valores positivos.' });
    }

    // Validar que la sesión pertenece al estudiante actual (por seguridad, extra checks podrían ir aquí)
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    const sesionActiva = await entrenamientoModel.obtenerSesionActiva(estudiante.id_estudiante);
    
    if (!sesionActiva || sesionActiva.id_sesion != id_sesion) {
      return res.status(403).json({ error: 'No tienes una sesión activa válida.' });
    }

    await entrenamientoModel.registrarSerie(id_sesion, id_ejercicio, numero_serie, peso, repeticiones_realizadas);
    
    res.json({ success: true, message: 'Serie registrada correctamente.' });
  } catch (err) {
    console.error('[entrenamientoController] registrarSerie:', err.message);
    res.status(500).json({ error: 'Error del servidor al guardar la serie.' });
  }
};

/**
 * POST /estudiante/entrenamiento/finalizar
 * Finaliza la sesión actual.
 */
const finalizarEntrenamiento = async (req, res) => {
  try {
    const { id_sesion } = req.body;
    
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    const sesionActiva = await entrenamientoModel.obtenerSesionActiva(estudiante.id_estudiante);

    if (!sesionActiva || sesionActiva.id_sesion != id_sesion) {
      // Error o intento de finalizar sesión inexistente
      return res.redirect('/dashboard/estudiante');
    }

    // Verificar que la sesión tenga al menos un registro
    const registros = await entrenamientoModel.obtenerRegistrosSesion(id_sesion);
    if (registros.length === 0) {
      return res.redirect('/estudiante/entrenamiento?error=empty_session');
    }

    await entrenamientoModel.finalizarSesion(id_sesion);

    // Redirigir al dashboard u otra vista de resumen
    res.redirect('/dashboard/estudiante');
  } catch (err) {
    console.error('[entrenamientoController] finalizarEntrenamiento:', err.message);
    res.redirect('/estudiante/entrenamiento');
  }
};

/**
 * GET /estudiante/historial
 * Muestra el historial de entrenamientos completados por el estudiante.
 */
const verHistorial = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    const sesiones = await entrenamientoModel.obtenerHistorialSesiones(estudiante.id_estudiante);

    res.render('estudiante/historial', {
      usuario: req.session.usuario,
      sesiones
    });
  } catch (err) {
    console.error('[entrenamientoController] verHistorial:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * GET /estudiante/historial/:id_sesion
 * Muestra el detalle de una sesión de entrenamiento específica.
 */
const verDetalleSesion = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const { id_sesion } = req.params;

    // Verificar que la sesión pertenezca al estudiante
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.redirect('/dashboard/estudiante');

    // Aquí podríamos validar que id_sesion pertenezca al estudiante,
    // pero por ahora vamos a traer el detalle directamente
    const registros = await entrenamientoModel.obtenerDetalleSesion(id_sesion);

    res.render('estudiante/detalle_sesion', {
      usuario: req.session.usuario,
      id_sesion,
      registros
    });
  } catch (err) {
    console.error('[entrenamientoController] verDetalleSesion:', err.message);
    res.redirect('/estudiante/historial');
  }
};

/**
 * PUT /estudiante/entrenamiento/registro/:id_registro
 * Actualiza el peso y repeticiones de un registro.
 */
const actualizarRegistro = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const { id_registro } = req.params;
    const { peso, repeticiones_realizadas } = req.body;

    if (peso < 0 || repeticiones_realizadas < 0) {
      return res.status(400).json({ error: 'Valores deben ser positivos.' });
    }

    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.status(403).json({ error: 'No autorizado.' });

    const actualizado = await entrenamientoModel.actualizarRegistro(id_registro, peso, repeticiones_realizadas, estudiante.id_estudiante);
    if (!actualizado) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece al estudiante.' });
    }

    res.json({ success: true, message: 'Registro actualizado correctamente.' });
  } catch (err) {
    console.error('[entrenamientoController] actualizarRegistro:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * DELETE /estudiante/entrenamiento/registro/:id_registro
 * Elimina un registro.
 */
const eliminarRegistro = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const { id_registro } = req.params;

    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.status(403).json({ error: 'No autorizado.' });

    const resultado = await entrenamientoModel.eliminarRegistro(id_registro, estudiante.id_estudiante);
    if (!resultado) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece al estudiante.' });
    }

    res.json({ 
      success: true, 
      message: 'Registro eliminado correctamente.',
      sesionEliminada: resultado.sesionEliminada
    });
  } catch (err) {
    console.error('[entrenamientoController] eliminarRegistro:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  iniciarEntrenamiento,
  mostrarEntrenamiento,
  registrarSerie,
  finalizarEntrenamiento,
  verHistorial,
  verDetalleSesion,
  actualizarRegistro,
  eliminarRegistro
};
