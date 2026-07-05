const pool = require('./config/db');
async function main() {
  const r1 = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'sesiones_entrenamiento' ORDER BY ordinal_position");
  console.log('=== SESIONES_ENTRENAMIENTO ===');
  console.table(r1.rows);
  const r2 = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'registros_ejercicio' ORDER BY ordinal_position");
  console.log('=== REGISTROS_EJERCICIO ===');
  console.table(r2.rows);
  const r3 = await pool.query("SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS fk_table, ccu.column_name AS fk_col FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('sesiones_entrenamiento','registros_ejercicio')");
  console.log('=== FOREIGN KEYS ===');
  console.table(r3.rows);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
