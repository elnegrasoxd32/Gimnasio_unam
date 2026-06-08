const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Motor de plantillas ──────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: false }));   // Procesa formularios HTML
app.use(express.json());                            // Procesa JSON
app.use(express.static(path.join(__dirname, 'public'))); // Archivos estáticos

// ── Sesiones ─────────────────────────────────────────────────────────────────
app.use(session({
  secret: 'gimUNAM_s3cr3t_2026',   // Clave de firma de la cookie (cambiar en producción)
  resave: false,                    // No re-guarda sesión sin cambios
  saveUninitialized: false,         // No crea sesión vacía
  cookie: {
    httpOnly: true,                 // La cookie no es accesible desde JavaScript del cliente
    maxAge: 1000 * 60 * 60 * 2     // Expira en 2 horas
  }
}));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);

// ── Inicio del servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🏋️  Gimnasio UNAM — Servidor iniciado');
  console.log(`   → http://localhost:${PORT}\n`);
});
