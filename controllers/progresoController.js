const progresoModel = require('../models/progresoModel');
const estudianteModel = require('../models/estudianteModel');

/**
 * GET /estudiante/progreso
 * Muestra la vista de progreso con el resumen general y las gráficas.
 */
const mostrarProgreso = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    
    if (!estudiante) return res.redirect('/dashboard/estudiante');
    const id_estudiante = estudiante.id_estudiante;

    const resumen = await progresoModel.obtenerResumenGeneral(id_estudiante);
    const entrenamientosPorMes = await progresoModel.obtenerEntrenamientosPorMes(id_estudiante);
    const ejercicios = await progresoModel.obtenerEjerciciosRealizados(id_estudiante);

    res.render('estudiante/progreso', {
      usuario: req.session.usuario,
      resumen,
      entrenamientosPorMes,
      ejercicios
    });

  } catch (err) {
    console.error('[progresoController] mostrarProgreso:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * GET /estudiante/progreso/api/evolucion/:id_ejercicio
 * Endpoint para obtener la evolución del peso levantado por ejercicio en formato JSON.
 */
const apiEvolucionPeso = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const { id_ejercicio } = req.params;

    const estudiante = await estudianteModel.buscarPorIdUsuario(id_usuario);
    if (!estudiante) return res.status(403).json({ error: 'No autorizado.' });

    const evolucion = await progresoModel.obtenerEvolucionPeso(estudiante.id_estudiante, id_ejercicio);

    res.json(evolucion);
  } catch (err) {
    console.error('[progresoController] apiEvolucionPeso:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  mostrarProgreso,
  apiEvolucionPeso
};
