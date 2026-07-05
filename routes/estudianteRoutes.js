const express = require('express');
const router = express.Router();
const estudianteCtrl = require('../controllers/estudianteController');
const rutinaCtrl = require('../controllers/rutinaController');
const { verificarSesion, verificarRol } = require('../middlewares/authMiddleware');

const entrenamientoCtrl = require('../controllers/entrenamientoController');

// Todas las rutas aquí requieren sesión y rol de ESTUDIANTE
router.use(verificarSesion);
router.use(verificarRol(['ESTUDIANTE']));

// ── Perfil Físico ─────────────────────────────────────────────────────────────
router.get('/perfil', estudianteCtrl.mostrarFormularioPerfil);
router.post('/perfil', estudianteCtrl.guardarPerfil);

// ── Mi Rutina ─────────────────────────────────────────────────────────────────
router.get('/rutina', rutinaCtrl.verMiRutina);

// ── Entrenamiento ─────────────────────────────────────────────────────────────
router.post('/entrenamiento/iniciar', entrenamientoCtrl.iniciarEntrenamiento);
router.get('/entrenamiento', entrenamientoCtrl.mostrarEntrenamiento);
router.post('/entrenamiento/registrar', entrenamientoCtrl.registrarSerie);
router.post('/entrenamiento/finalizar', entrenamientoCtrl.finalizarEntrenamiento);

// ── Historial ─────────────────────────────────────────────────────────────────
router.get('/historial', entrenamientoCtrl.verHistorial);
router.get('/historial/:id_sesion', entrenamientoCtrl.verDetalleSesion);

// ── Actualización de Entrenamientos ───────────────────────────────────────────
router.put('/entrenamiento/registro/:id_registro', entrenamientoCtrl.actualizarRegistro);
router.delete('/entrenamiento/registro/:id_registro', entrenamientoCtrl.eliminarRegistro);

module.exports = router;
