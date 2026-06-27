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

module.exports = router;
