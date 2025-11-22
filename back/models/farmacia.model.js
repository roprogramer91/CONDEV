// models/farmacia.model.js
import { query } from '../db/db.js';

export const guardarFarmacia = async (nombre, direccion) => {
    const sql = `
        INSERT INTO Farmacia (nombre, direccion)
        VALUES ($1, $2) 
        RETURNING id;
    `;
    const values = [nombre, direccion];

    const res = await query(sql, values);
    return res.rows[0].id; // Retorna el ID generado
};

export const obtenerTodasLasFarmacias = async () => {
    const sql = 'SELECT id, nombre FROM Farmacia';
    const res = await query(sql);
    return res.rows;
};