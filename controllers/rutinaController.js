const estudianteModel = require('../models/estudianteModel');

/**
 * GET /docente/rutinas
 * Muestra la lista de estudiantes registrados (con perfil físico completo)
 * para que el docente pueda asignarles una rutina.
 */
const listarEstudiantes = async (req, res) => {
  try {
    const estudiantes = await estudianteModel.obtenerEstudiantesConPerfil();
    
    res.render('docente/listar_estudiantes', {
      usuario: req.session.usuario,
      estudiantes
    });
  } catch (err) {
    console.error('[rutinaController] listarEstudiantes:', err.message);
    res.redirect('/dashboard/docente');
  }
};

const ejercicioModel = require('../models/ejercicioModel');
const rutinaModel = require('../models/rutinaModel');
const docenteModel = require('../models/docenteModel');

/**
 * GET /docente/rutinas/crear/:id_estudiante
 * Muestra el formulario dinámico para crear una rutina.
 */
const mostrarFormularioCrear = async (req, res) => {
  const { id_estudiante } = req.params;

  try {
    const estudiante = await estudianteModel.buscarEstudianteCompleto(id_estudiante);
    if (!estudiante) return res.redirect('/docente/rutinas');

    const ejercicios = await ejercicioModel.obtenerTodos();

    res.render('docente/crear_rutina', {
      usuario: req.session.usuario,
      estudiante,
      ejercicios
    });
  } catch (err) {
    console.error('[rutinaController] mostrarFormularioCrear:', err.message);
    res.redirect('/docente/rutinas');
  }
};

/**
 * POST /docente/rutinas/crear/:id_estudiante
 * Procesa el formulario, crea la rutina y desactiva la anterior.
 */
const crearRutina = async (req, res) => {
  const { id_estudiante } = req.params;
  const { nombre_rutina, ejercicios } = req.body;
  
  try {
    const id_docente = await docenteModel.obtenerIdDocente(req.session.usuario.id_usuario);
    if (!id_docente) {
      throw new Error('El usuario no está registrado como docente en la BD.');
    }

    // Parsear ejercicios que vienen del cliente (si existen)
    let ejerciciosParseados = [];
    if (ejercicios) {
      // Si solo viene un ejercicio, express lo manda como string, si son varios, como array
      const ejerciciosArray = Array.isArray(ejercicios) ? ejercicios : [ejercicios];
      
      ejerciciosParseados = ejerciciosArray.map(ej => {
        const parsed = JSON.parse(ej);
        return {
          dia_semana: parsed.dia_semana,
          id_ejercicio: parseInt(parsed.id_ejercicio),
          series: parseInt(parsed.series),
          repeticiones: parseInt(parsed.repeticiones)
        };
      });
    }

    const id_rutina = await rutinaModel.crearRutinaConEjercicios(
      id_estudiante,
      id_docente,
      nombre_rutina,
      ejerciciosParseados
    );

    // Redirigir a una vista de éxito o de vuelta al dashboard
    // Por ahora volvemos a la lista de estudiantes
    res.redirect('/docente/rutinas');
  } catch (err) {
    console.error('[rutinaController] crearRutina:', err.message);
    res.redirect(`/docente/rutinas/crear/${id_estudiante}?error=true`);
  }
};

module.exports = {
  listarEstudiantes,
  mostrarFormularioCrear,
  crearRutina
};
