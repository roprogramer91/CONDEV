import { query } from "../db/db.js";

/**
 * Busca un usuario por su correo para el proceso de login.
 * @param {string} correo - El correo electrónico del usuario a buscar.
 * @returns {object|null} - Devuelve el usuario con todos los datos si se encuentra, de lo contrario null.
 */

export const obtenerUsuarioPorCorreo = async (correo) => {
    const sql = `
            SELECT id, farmacia_id, correo, contrasena, rol, activo
                    FROM Usuario 
                    WHERE correo = $1;
        `;
    const values = [correo];

    try {
        const res = await query(sql, values);
        //si no encuentra nada devuelve null
        return res.rows[0] || null;
    } catch (error) {
        console.error("Error al obtener usuario por correo:", error.message);
        throw new Error(`Fallo al obtener usuario: ${error.message}`);
    }
};


/**
 * Registra un nuevo usuario en la base de datos
 * Nota: El hashContrasena debe ser generado con bcrypt en el controlador antes de llamar a la funcion.
 * @param {number} farmaciaId - ID de la farmacia a la que pertenece el usuario.
 * @param {string} correo - Correo electrónico del usuario.
 * @param {string} hashContrasena - Contraseña hasheada del usuario.
 * @param {string} rol - Rol del usuario (e.g., 'admin', 'empleado'). 
 * @param {boolean} activo - Estado del usuario (activo/inactivo).
 * @returns {number} - El id del usuario recién creado.
 */


export const registrarUsuario = async (farmaciaId, correo, hashContrasena, rol, activo = true) => {
    const sql = `
            INSERT INTO Usuario (farmacia_id, correo, contrasena, rol, activo)
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id;
        `;
    const values = [farmaciaId, correo, hashContrasena, rol, activo];

    try {
        const res = await query(sql, values);
        return res.rows[0].id; //retorna el id del usuario creado
    } catch (error) {
        console.error("Error al registrar usuario:", error.message);
        throw new Error(`Fallo al registrar usuario: ${error.message}`);
    }
};

/**
 * Obtiene el correo de los usuarios con rol ADMIN de una farmacia específica.
 * @param {number} farmaciaId 
 * @returns {Promise<string[]>} Lista de correos
 */
export const obtenerCorreosAdminPorFarmacia = async (farmaciaId) => {
    const sql = `
        SELECT correo FROM Usuario 
        WHERE farmacia_id = $1 AND rol = 'ADMIN' AND activo = TRUE;
    `;
    const values = [farmaciaId];
    const res = await query(sql, values);
    return res.rows.map(u => u.correo);
};