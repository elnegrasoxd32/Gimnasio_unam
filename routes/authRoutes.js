const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const dashboardCtrl = require('../controllers/dashboardController');
const { verificarSesion, verificarRol } = require('../middlewares/authMiddleware');

// Ruta raíz — redirige al login
router.get('/', (req, res) => res.redirect('/login'));

// ── Autenticación ─────────────────────────────────────────────────────────────
router.get('/login', authCtrl.mostrarLogin);
router.post('/login', authCtrl.procesarLogin);

router.get('/registro', authCtrl.mostrarRegistro);
router.post('/registro', authCtrl.procesarRegistro);

router.get('/logout', authCtrl.cerrarSesion);

// ── Dashboards protegidos ─────────────────────────────────────────────────────
//
//  Cadena de middleware por ruta:
//    1. verificarSesion  → ¿hay sesión?    Si no → /login
//    2. verificarRol     → ¿rol correcto?  Si no → redirect al dashboard propio
//    3. dashboardCtrl    → renderiza la vista
//
router.get(
  '/dashboard/estudiante',
  verificarSesion,
  verificarRol(['ESTUDIANTE']),
  dashboardCtrl.mostrarEstudiante
);

router.get(
  '/dashboard/docente',
  verificarSesion,
  verificarRol(['DOCENTE']),
  dashboardCtrl.mostrarDocente
);

module.exports = router;
