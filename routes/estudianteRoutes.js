const express = require('express');
const router = express.Router();
const estudianteCtrl = require('../controllers/estudianteController');
const { verificarSesion, verificarRol } = require('../middlewares/authMiddleware');

// Todas las rutas aquí requieren sesión y rol de ESTUDIANTE
router.use(verificarSesion);
router.use(verificarRol(['ESTUDIANTE']));

// ── Perfil Físico ─────────────────────────────────────────────────────────────
router.get('/perfil', estudianteCtrl.mostrarFormularioPerfil);
router.post('/perfil', estudianteCtrl.guardarPerfil);

module.exports = router;
