const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Gimnasio_unam',
    password: '123456',
    port: 5432
});
module.exports = pool;


//const { Pool } = require('pg');

//const pool = new Pool({
//    connectionString: process.env.DATABASE_URL,
//    ssl: {
//        rejectUnauthorized: false
//    }
//});

//module.exports = pool;
