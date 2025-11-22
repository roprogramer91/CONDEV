// controllers/auth.controller.js

import bcrypt from 'bcrypt';
// Importamos el Modelo de Usuario
import { registrarUsuario, obtenerUsuarioPorCorreo } from '../models/usuario.model.js';
// Importamos el nuevo Modelo de Farmacia
import { guardarFarmacia } from '../models/farmacia.model.js'; 
// Importamos el cliente de la BD para la transacción
import { pool } from '../db/db.js'; 
// Importamos JWT para la generación de tokens
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Registra una nueva Farmacia y su primer usuario (ADMIN) en una sola transacción.
 */
export const registrarNuevaFarmaciaYUsuario = async (req, res) => {
    
    // 1. Obtener Datos
    const { 
        nombre_farmacia, 
        direccion_farmacia, 
        correo_usuario, 
        contrasena_usuario 
    } = req.body;

    if (!nombre_farmacia || !correo_usuario || !contrasena_usuario) {
        return res.status(400).json({ error: 'Faltan datos de registro esenciales.' });
    }

    // Usamos el rol "ADMIN" por defecto para el primer usuario
    const ROL_ADMIN = 'ADMIN'; 
    // Los "saltos" son la complejidad del hash (10 es suficiente)
    const saltRounds = 10; 
    let client; // Variable para el cliente de la transacción

    try {
        // --- INICIO DE LA TRANSACCIÓN ---
        client = await pool.connect(); // Obtener un cliente del pool
        await client.query('BEGIN'); // Iniciar la transacción SQL

        // 2. Seguridad: Hashear la Contraseña
        const hashContrasena = await bcrypt.hash(contrasena_usuario, saltRounds);

        // 3. Crear Farmacia (dentro de la transacción)
        const sqlFarmacia = 'INSERT INTO Farmacia (nombre, direccion) VALUES ($1, $2) RETURNING id;';
        const resFarmacia = await client.query(sqlFarmacia, [nombre_farmacia, direccion_farmacia]);
        const farmaciaId = resFarmacia.rows[0].id; // Obtenemos el ID de la nueva farmacia

        // 4. Crear Usuario (dentro de la transacción)
        const sqlUsuario = `
            INSERT INTO Usuario (farmacia_id, correo, contrasena, rol, activo)
            VALUES ($1, $2, $3, $4, TRUE) 
            RETURNING id;
        `;
        const valuesUsuario = [farmaciaId, correo_usuario, hashContrasena, ROL_ADMIN];
        await client.query(sqlUsuario, valuesUsuario);
        
        // --- FIN EXITOSO DE LA TRANSACCIÓN ---
        await client.query('COMMIT'); 

        // 5. Respuesta
        return res.status(201).json({ 
            mensaje: 'Registro de Farmacia y Usuario Admin exitoso.',
            farmacia_id: farmaciaId
        });

    } catch (error) {
        // --- MANEJO DE ERRORES Y ROLLBACK ---
        if (client) {
            await client.query('ROLLBACK'); // Deshacer si algo falló
        }
        console.error("🚨 Error al registrar nueva farmacia:", error.message);
        
        // Si el error es una violación UNIQUE (ej: correo ya existe)
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
        }
        
        return res.status(500).json({ error: 'Fallo interno al procesar el registro.' });
    } finally {
        if (client) {
            client.release(); // Liberar el cliente de la BD
        }
    }
};



/**
 * Procesa el login de un usuario verificando la contraseña y emitiendo un token.
 */
export const loginUsuario = async (req, res) => {
    
    // 1. Obtener credenciales de la petición
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Faltan credenciales (correo o contraseña).' });
    }

    try {
        // 2. Obtener Usuario de la BD (con el hash)
        const usuario = await obtenerUsuarioPorCorreo(correo);

        // 3. Verificar existencia y estado
        if (!usuario || !usuario.activo) {
            // Mensaje genérico por seguridad (no dar pistas)
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
        }

        // 4. Comparar Contraseñas (bcrypt)
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 5. Crear el Token (JWT)
        const token = jwt.sign(
            // Payload: Incluimos datos esenciales para el filtrado multi-tenant
            { id: usuario.id, farmacia_id: usuario.farmacia_id, rol: usuario.rol },
            JWT_SECRET, // Usa la clave secreta de tu .env
            { expiresIn: '1d' } // El token expira en 1 día
        );

        // 6. Respuesta exitosa
        return res.status(200).json({ 
            mensaje: 'Login exitoso.',
            token: token,
            rol: usuario.rol,
            farmacia_id: usuario.farmacia_id
        });

    } catch (error) {
        console.error("🚨 Error durante el login:", error.message);
        return res.status(500).json({ error: 'Fallo interno al procesar el login.' });
    }
};