const estudianteModel = require('../models/estudianteModel');

/**
 * GET /estudiante/perfil
 * Muestra el formulario para completar o editar el perfil físico.
 * Precarga los datos si el estudiante ya tiene un perfil guardado.
 */
const mostrarFormularioPerfil = async (req, res) => {
  try {
    const id_usuario = req.session.usuario.id_usuario;
    const perfilActual = await estudianteModel.buscarPorIdUsuario(id_usuario);
    
    // Si perfilActual tiene dias_disponibles, los separamos por coma para pasarlos como array a la vista
    let diasSeleccionados = [];
    if (perfilActual && perfilActual.dias_disponibles) {
      diasSeleccionados = perfilActual.dias_disponibles.split(',').map(d => d.trim());
    }

    res.render('estudiante/perfil', {
      perfil: perfilActual,
      diasSeleccionados,
      error: null
    });

  } catch (err) {
    console.error('[estudianteController] mostrarFormularioPerfil:', err.message);
    res.redirect('/dashboard/estudiante');
  }
};

/**
 * POST /estudiante/perfil
 * Procesa la creación o actualización del perfil físico del estudiante.
 */
const guardarPerfil = async (req, res) => {
  const { peso, altura, objetivo_principal, dias } = req.body;
  const id_usuario = req.session.usuario.id_usuario;

  try {
    // 1. Validaciones básicas
    if (!peso || !altura || !objetivo_principal) {
      return res.render('estudiante/perfil', {
        perfil: req.body, 
        diasSeleccionados: dias || [],
        error: 'El peso, altura y objetivo principal son obligatorios.'
      });
    }

    // El checkbox 'dias' puede venir como array si hay múltiples seleccionados,
    // o como string si hay uno solo, o undefined si no hay ninguno.
    let diasArray = [];
    if (Array.isArray(dias)) {
      diasArray = dias;
    } else if (typeof dias === 'string') {
      diasArray = [dias];
    }
    
    const dias_disponibles = diasArray.join(', ');

    // 2. Guardar en base de datos (Upsert)
    await estudianteModel.upsertPerfil({
      id_usuario,
      peso: parseFloat(peso),
      altura: parseFloat(altura),
      objetivo_principal,
      dias_disponibles
    });

    // 3. Redirigir al dashboard con éxito
    res.redirect('/dashboard/estudiante');

  } catch (err) {
    console.error('[estudianteController] guardarPerfil:', err.message);
    res.render('estudiante/perfil', {
      perfil: req.body,
      diasSeleccionados: Array.isArray(dias) ? dias : (dias ? [dias] : []),
      error: 'Hubo un error al guardar tu perfil. Intenta nuevamente.'
    });
  }
};

module.exports = {
  mostrarFormularioPerfil,
  guardarPerfil
};
