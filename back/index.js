// back/index.js
//-------------------------------------------------------------------------------------------
// Punto de entrada principal del servidor backend
// Acá configuro Express, conecto a PostgreSQL y registro todas las rutas
//-------------------------------------------------------------------------------------------

// Importaciones de dependencias
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import 'dotenv/config';
import { startScheduler } from './tasks/alertScheduler.js';
import inventarioRoutes from './routes/inventario.routes.js';
import authRoutes from './routes/auth.routes.js';

// Cargo las variables de entorno desde el archivo .env
dotenv.config();

// Inicializo la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Configuro el pool de conexiones a PostgreSQL
// Uso la variable DATABASE_URL del .env para conectarme
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Habilito CORS para permitir peticiones desde el frontend
app.use(cors());

// Inicio el scheduler de tareas programadas (envío de emails a las 8 AM)
startScheduler();

// Registro las rutas de la API
app.use('/api/inventario', inventarioRoutes);
app.use('/api/auth', authRoutes);

// Levanto el servidor en el puerto configurado
app.listen(port, () => {
  console.log(`servidor corriendo en puerto ${port}`);
});