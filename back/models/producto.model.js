// models/producto.model.js 

import { query } from '../db/db.js';

// 1. Obtiene el producto maestro (función de consulta)
export const obtenerProductoPorNombre = async (nombre, farmaciaId) => {
    const sql = 'SELECT id, nombre, laboratorio FROM Producto WHERE nombre = $1 AND farmacia_id = $2';
    const values = [nombre, farmaciaId];
    
    const res = await query(sql, values); 
    
    // Si no encuentra resultados, devuelve null
    return res.rows[0] || null; 
};

// 2. Guarda un Producto Maestro (función de inserción)
export const guardarProducto = async (producto) => {
    const sql = `
        INSERT INTO Producto (farmacia_id, nombre, laboratorio, compuesto, precio_venta)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id; 
    `;
    const values = [
        producto.farmacia_id,
        producto.nombre,
        producto.laboratorio,
        producto.compuesto,
        producto.precio_venta 
    ];

    try {
        const res = await query(sql, values);
        return res.rows[0].id; // Retorna el ID generado por PostgreSQL
    } catch (error) {
        console.error("Error al ejecutar INSERT en Producto:", error.message);
        throw new Error(`Fallo al guardar producto: ${error.message}`);
    }
};

// 3. Actualiza un Producto Maestro (función de actualización)
export const actualizarProducto = async (productoId, nuevosDatos) => {
    const sql = `
        UPDATE Producto 
        SET 
            nombre = $2, 
            laboratorio = $3, 
            compuesto = $4
        WHERE id = $1
    `;
    const values = [
        productoId, 
        nuevosDatos.nombre, 
        nuevosDatos.laboratorio, 
        nuevosDatos.compuesto
    ];

    await query(sql, values);
    return true;
};