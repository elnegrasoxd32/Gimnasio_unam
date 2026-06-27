const pool = require('../config/db');

const ejercicios = [
  // Pecho
  { nombre: 'Press de Banca Plano', grupo: 'Pecho', desc: 'Ejercicio compuesto para desarrollo del pectoral mayor utilizando barra.' },
  { nombre: 'Press Inclinado con Mancuernas', grupo: 'Pecho', desc: 'Enfocado en la porción clavicular (superior) del pecho.' },
  { nombre: 'Aperturas en Máquina (Peck Deck)', grupo: 'Pecho', desc: 'Ejercicio de aislamiento para el pecho.' },
  { nombre: 'Fondos en Paralelas (Pecho)', grupo: 'Pecho', desc: 'Con inclinación hacia adelante para mayor enfoque en pecho.' },

  // Espalda
  { nombre: 'Dominadas / Jalón al Pecho', grupo: 'Espalda', desc: 'Trabajo principal de dorsales y amplitud de espalda.' },
  { nombre: 'Remo con Barra (Pendlay)', grupo: 'Espalda', desc: 'Desarrollo del grosor de la espalda media y alta.' },
  { nombre: 'Remo en Polea Baja', grupo: 'Espalda', desc: 'Trabajo constante en dorsales y trapecios.' },
  { nombre: 'Peso Muerto', grupo: 'Espalda', desc: 'Ejercicio compuesto fundamental para cadena posterior completa.' },

  // Piernas
  { nombre: 'Sentadilla Libre con Barra', grupo: 'Piernas', desc: 'El rey de los ejercicios para tren inferior (cuádriceps y glúteos).' },
  { znombre: 'Prensa Inclinada a 45°', grupo: 'Piernas', desc: 'Desarrollo de piernas con menor carga lumbar.' },
  { nombre: 'Zancadas (Lunges) con Mancuernas', grupo: 'Piernas', desc: 'Trabajo unilateral para cuádriceps y glúteos.' },
  { nombre: 'Peso Muerto Rumano', grupo: 'Piernas', desc: 'Enfoque intenso en isquiotibiales y glúteos.' },
  { nombre: 'Extensión de Cuádriceps en Máquina', grupo: 'Piernas', desc: 'Aislamiento puro para cuádriceps.' },
  { nombre: 'Curl Femoral Tumbado/Sentado', grupo: 'Piernas', desc: 'Aislamiento para isquiotibiales.' },
  { nombre: 'Elevación de Talones (Gemelos)', grupo: 'Piernas', desc: 'Trabajo de pantorrillas de pie o sentado.' },

  // Hombros
  { nombre: 'Press Militar (Barra o Mancuernas)', grupo: 'Hombros', desc: 'Desarrollo masivo de la porción anterior y media del deltoides.' },
  { nombre: 'Elevaciones Laterales con Mancuernas', grupo: 'Hombros', desc: 'Aislamiento esencial para la anchura de los hombros (deltoides medio).' },
  { nombre: 'Face Pull en Polea', grupo: 'Hombros', desc: 'Salud articular y desarrollo del deltoides posterior.' },

  // Bíceps
  { nombre: 'Curl de Bíceps con Barra recta/Z', grupo: 'Bíceps', desc: 'Desarrollo general de los flexores del brazo.' },
  { nombre: 'Curl Martillo con Mancuernas', grupo: 'Bíceps', desc: 'Enfoque en braquial y braquiorradial (antebrazo).' },
  { nombre: 'Curl en Banco Scott (Predicador)', grupo: 'Bíceps', desc: 'Aislamiento para maximizar el pico del bíceps.' },

  // Tríceps
  { nombre: 'Extensión de Tríceps en Polea Alta', grupo: 'Tríceps', desc: 'Ejercicio clásico para tríceps utilizando cuerda o barra recta.' },
  { nombre: 'Press Francés (Rompecráneos)', grupo: 'Tríceps', desc: 'Enfoque en la cabeza larga del tríceps.' },
  { nombre: 'Fondos entre Bancos o Asistidos', grupo: 'Tríceps', desc: 'Ejercicio compuesto para desarrollo de tríceps.' },

  // Abdomen
  { nombre: 'Plancha Abdominal (Plank)', grupo: 'Abdomen', desc: 'Trabajo isométrico del core.' },
  { nombre: 'Elevación de Piernas Colgado', grupo: 'Abdomen', desc: 'Enfoque en la parte inferior del recto abdominal.' },
  { nombre: 'Crunch Abdominal en Polea Alta', grupo: 'Abdomen', desc: 'Trabajo con resistencia para hipertrofia abdominal.' },

  // Cardio
  { nombre: 'Caminadora (HIIT o LISS)', grupo: 'Cardio', desc: 'Trabajo cardiovascular en cinta de correr.' },
  { nombre: 'Bicicleta Estacionaria', grupo: 'Cardio', desc: 'Cardio de bajo impacto articular.' },
  { nombre: 'Elíptica', grupo: 'Cardio', desc: 'Trabajo cardiovascular de cuerpo completo sin impacto.' }
];

// Corregir un typo en la clave znombre
ejercicios.forEach(e => {
  if (e.znombre) {
    e.nombre = e.znombre;
    delete e.znombre;
  }
});

async function seedEjercicios() {
  console.log('🔄 Iniciando inserción de ejercicios semilla...');

  try {
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM ejercicios');
    if (parseInt(countRows[0].count) > 0) {
      console.log('⚠️ La tabla de ejercicios ya contiene datos. Saltando inserción.');
      process.exit(0);
    }

    // Insertar cada ejercicio
    let creados = 0;
    for (const ej of ejercicios) {
      await pool.query(
        'INSERT INTO ejercicios (nombre, grupo_muscular, descripcion) VALUES ($1, $2, $3)',
        [ej.nombre, ej.grupo, ej.desc]
      );
      creados++;
    }

    console.log(`✅ ¡Se han insertado ${creados} ejercicios exitosamente!`);

  } catch (error) {
    console.error('❌ Error insertando ejercicios:', error);
  } finally {
    pool.end();
  }
}

seedEjercicios();
