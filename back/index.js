// back/index.js
//-------------------------------------------------------------------------------------------
// Servidor basico con Express y conexion a PostgreSQL a traves de variables de entorno
//-------------------------------------------------------------------------------------------
//--------IMPORTACIONES DE DEPENDENCIAS--------//
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import 'dotenv/config';
import { startScheduler } from './tasks/alertScheduler.js';
import { verificarYEnviarAlertas } from './services/vencimientoService.js';
// Importar las rutas
import inventarioRoutes from './routes/inventario.routes.js';
import authRoutes from './routes/auth.routes.js';

//-------------------------------------------//


//--------CONFIGURACIONES BASICAS--------//
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// Configurar la conexion a PostgreSQL usando variables de entorno
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
//--------------------------------------//


// Middleware para analizar el cuerpo de las peticiones JSON
app.use(express.json());
app.use(cors());

startScheduler();


//--------RUTAS--------//
app.use('/api/inventario', inventarioRoutes);
app.use('/api/auth', authRoutes);
//---------------------//

verificarYEnviarAlertas();// Llamada inicial para probar la funcionalidad inmediatamente


// Iniciar el servidor
app.listen(port, () => {
  console.log(`servidor corriendo en puerto ${port}`);
});