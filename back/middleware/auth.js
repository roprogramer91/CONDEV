// middleware/auth.js

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET; 

/**
 * Middleware para verificar la validez del token JWT y adjuntar los datos del usuario (farmacia_id, rol) al objeto 'req'.
 */
export const verificarToken = (req, res, next) => {
    
    // 1. Obtener el token de la cabecera (Header)
    // El token viene así: Authorization: Bearer <token_aqui>
    const authHeader = req.headers['authorization'];
    // Si no hay cabecera se deniega acceso.
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }
    
    // Separamos el "Bearer" del token real
    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido.' });
    }

    // 2. Verificamos token
    try {
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. Adjuntar datos del usuario (Payload) al objeto request
        
        req.usuario = decoded; 
        
        // 4. Continuar al Controlador
        next(); 

    } catch (error) {
        // Si la verificación falla (ej: token expirado, clave incorrecta)
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};