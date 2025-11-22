//back/db.js

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Cargar variables de entorno desde el archivo .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


// Manejo de errores de conexión
pool.on('error', (err) => {
    console.error('Error en la conexión a la base de datos:', err);
    process.exit(-1);
});

// Verificar la conexión al iniciar la aplicación
console.log('conexion pool exitosa a la base de datos.');

// Exportar una función para ejecutar consultas
export const query = (text, params) => pool.query(text, params);