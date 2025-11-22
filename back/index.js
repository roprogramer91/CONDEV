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
// Importar las rutas
import inventarioRoutes from './routes/inventario.routes.js';
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


//--------RUTAS--------//
app.use('/api/inventario', inventarioRoutes);

//---------------------//




// Iniciar el servidor
app.listen(port, () => {
  console.log(`servidor corriendo en puerto ${port}`);
});