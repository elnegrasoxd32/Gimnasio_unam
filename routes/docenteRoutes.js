const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutinaController');
const { verificarSesion, verificarRol } = require('../middlewares/authMiddleware');

// ── Todas las rutas del docente están protegidas ─────────────────────────────
router.use(verificarSesion);
router.use(verificarRol(['DOCENTE']));

// ── Rutas de gestión de rutinas ──────────────────────────────────────────────
router.get('/rutinas', rutinaController.listarEstudiantes);
router.get('/rutinas/crear/:id_estudiante', rutinaController.mostrarFormularioCrear);
router.post('/rutinas/crear/:id_estudiante', rutinaController.crearRutina);

// ── Asistencias ────────────────────────────────────────────────────────────────
const asistenciaCtrl = require('../controllers/asistenciaController');
router.get('/asistencias', asistenciaCtrl.mostrarAsistenciasDocente);
router.get('/asistencia/qr', asistenciaCtrl.mostrarPuntoAsistenciaQR);
router.get('/api/asistencia/qr-token', asistenciaCtrl.generarTokenQR);

// ── Recomendaciones ───────────────────────────────────────────────────────────
const recomendacionCtrl = require('../controllers/recomendacionController');
router.get('/recomendaciones', recomendacionCtrl.listarEstudiantes);
router.get('/recomendaciones/:id_estudiante', recomendacionCtrl.mostrarDetalleEstudiante);
router.post('/recomendaciones/:id_estudiante', recomendacionCtrl.crearRecomendacion);
router.put('/recomendaciones/api/:id_recomendacion', recomendacionCtrl.editarRecomendacion);
router.delete('/recomendaciones/api/:id_recomendacion', recomendacionCtrl.eliminarRecomendacion);

// ── Incidencias ───────────────────────────────────────────────────────────────
const incidenciaCtrl = require('../controllers/incidenciaController');
router.get('/incidencias', incidenciaCtrl.listarIncidencias);
router.get('/incidencias/:id_incidencia', incidenciaCtrl.verDetalle);
router.post('/incidencias/:id_incidencia/estado', incidenciaCtrl.cambiarEstado);

// ── Aforo ──────────────────────────────────────────────────────────────────────
const aforoCtrl = require('../controllers/aforoController');
router.get('/aforo', aforoCtrl.mostrarAforoDocente);
router.get('/api/aforo', aforoCtrl.apiObtenerAforo);
// ── Progreso de Alumnos ─────────────────────────────────────────────────────────
const progresoDocenteCtrl = require('../controllers/progresoDocenteController');
router.get('/progreso', progresoDocenteCtrl.listarEstudiantes);
router.get('/progreso/:id_estudiante', progresoDocenteCtrl.verDetalleProgreso);
router.get('/progreso/api/evolucion/:id_estudiante/:id_ejercicio', progresoDocenteCtrl.apiEvolucionPeso);

module.exports = router;
