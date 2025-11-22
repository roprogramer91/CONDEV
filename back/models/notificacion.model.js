import { query } from '../db/db.js';

// 1. Crear una nueva notificación
export const crearNotificacion = async (loteId, farmaciaId, tipo, mensaje) => {
    const sql = `
        INSERT INTO Notificacion (lote_id, farmacia_id, tipo, mensaje)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    const values = [loteId, farmaciaId, tipo, mensaje];

    try {
        const res = await query(sql, values);
        return res.rows[0].id;
    } catch (error) {
        console.error("Error al crear notificación:", error.message);
        throw new Error(`Fallo al crear notificación: ${error.message}`);
    }
};

// 2. Obtener notificaciones no leídas de una farmacia
export const obtenerNotificacionesNoLeidas = async (farmaciaId) => {
    const sql = `
        SELECT * FROM Notificacion
        WHERE farmacia_id = $1 AND leida = FALSE
        ORDER BY fecha_creacion DESC;
    `;
    const values = [farmaciaId];
    const res = await query(sql, values);
    return res.rows;
};

// 3. Marcar notificación como leída
export const marcarNotificacionComoLeida = async (notificacionId) => {
    const sql = `
        UPDATE Notificacion
        SET leida = TRUE
        WHERE id = $1;
    `;
    const values = [notificacionId];
    await query(sql, values);
    return true;
};
