// routes/auth.routes.js

import express from 'express';
import { registrarNuevaFarmaciaYUsuario,loginUsuario } from '../controllers/auth.controller.js';

const router = express.Router();

// Ruta de registro inicial

// Endpoint: /api/auth/register
router.post('/register', registrarNuevaFarmaciaYUsuario);

//Endpoint: /api/auth/login
router.post('/login', loginUsuario);

export default router;