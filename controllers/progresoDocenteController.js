const progresoDocenteModel = require('../models/progresoDocenteModel');
const progresoModel = require('../models/progresoModel');
const estudianteModel = require('../models/estudianteModel');
const asistenciaModel = require('../models/asistenciaModel');

/**
 * GET /docente/progreso
 * Muestra la lista de estudiantes con filtro de búsqueda.
 */
const listarEstudiantes = async (req, res) => {
  try {
    const { search } = req.query;
    const estudiantes = await progresoDocenteModel.obtenerEstudiantes(search || '');

    res.render('docente/progreso_lista', {
      usuario: req.session.usuario,
      estudiantes,
      search: search || ''
    });
  } catch (err) {
    console.error('[progresoDocenteController] listarEstudiantes:', err.message);
    res.redirect('/dashboard/docente');
  }
};

/**
 * GET /docente/progreso/:id_estudiante
 * Muestra el dashboard completo de progreso del estudiante seleccionado.
 */
const verDetalleProgreso = async (req, res) => {
  try {
    const { id_estudiante } = req.params;
    
    // Obtener datos básicos del estudiante
    const estudianteInfo = await estudianteModel.buscarEstudianteCompleto(id_estudiante);
    if (!estudianteInfo) return res.redirect('/docente/progreso');

    // Extraer rutina activa y última sesión del listado general o consultarlo
    const lista = await progresoDocenteModel.obtenerEstudiantes();
    const estudianteLista = lista.find(e => parseInt(e.id_estudiante) === parseInt(id_estudiante));
    estudianteInfo.rutina_activa = estudianteLista ? estudianteLista.rutina_activa : 'No asignada';
    estudianteInfo.ultimo_entrenamiento = estudianteLista ? estudianteLista.ultimo_entrenamiento : null;

    // Obtener última asistencia
    const asistencias = await asistenciaModel.obtenerHistorialEstudiante(id_estudiante);
    estudianteInfo.ultima_asistencia = asistencias.length > 0 ? asistencias[0].fecha_ingreso : null;

    // Reutilizar modelo de progreso del estudiante
    const resumen = await progresoModel.obtenerResumenGeneral(id_estudiante);
    const entrenamientosPorMes = await progresoModel.obtenerEntrenamientosPorMes(id_estudiante);
    const ejercicios = await progresoModel.obtenerEjerciciosRealizados(id_estudiante);
    
    // Modelos específicos del docente (historial detallado y promedios)
    const historial = await progresoDocenteModel.obtenerHistorialDetallado(id_estudiante);
    const tiempoPromedio = await progresoDocenteModel.obtenerTiempoPromedio(id_estudiante);
    const promedioSemanal = await progresoDocenteModel.obtenerPromedioSemanal(id_estudiante);
    const promedioMensual = await progresoDocenteModel.obtenerPromedioMensual(id_estudiante);

    res.render('docente/progreso_detalle', {
      usuario: req.session.usuario,
      estudiante: estudianteInfo,
      resumen,
      entrenamientosPorMes,
      ejercicios,
      historial,
      tiempoPromedio,
      promedioSemanal,
      promedioMensual
    });
  } catch (err) {
    console.error('[progresoDocenteController] verDetalleProgreso:', err.message);
    res.redirect('/docente/progreso');
  }
};

/**
 * GET /docente/progreso/api/evolucion/:id_estudiante/:id_ejercicio
 * Reutiliza la misma lógica del estudiante para devolver los datos de evolución.
 */
const apiEvolucionPeso = async (req, res) => {
  try {
    const { id_estudiante, id_ejercicio } = req.params;
    const evolucion = await progresoModel.obtenerEvolucionPeso(id_estudiante, id_ejercicio);
    res.json(evolucion);
  } catch (err) {
    console.error('[progresoDocenteController] apiEvolucionPeso:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  listarEstudiantes,
  verDetalleProgreso,
  apiEvolucionPeso
};
