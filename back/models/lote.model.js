// models/lote.js

//----------IMPORTS----------//
import { query } from '../db/db.js';


// 1 - Funcion que guarda una instancia de Lote
export const guardarLote = async (lote) => {
    const sql = `
        INSERT INTO Lote (producto_id, farmacia_id, nro_lote, fecha_vencimiento, cantidad_actual)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
    `;
    
    const values = [
        lote.producto_id,
        lote.farmacia_id,
        lote.nro_lote,
        lote.fecha_vencimiento,
        lote.cantidad_actual
    ];

    try {
        await query(sql, values);
        return true; 
    } catch (error) {
        console.error("Error al ejecutar INSERT en Lote:", error.message);
        throw new Error(`Fallo al guardar lote: ${error.message}`);
    }
};



// 2. Función de Consulta vencimientos
export const obtenerLotesAVencer = async (diasMaximos, farmaciaId) => {
    const sql = `
            SELECT 
                L.nro_lote, L.fecha_vencimiento, L.cantidad_actual, L.id as lote_id,
                P.nombre as nombre_producto, P.laboratorio
            FROM Lote L
            JOIN Producto P ON L.producto_id = P.id
            WHERE 
                L.farmacia_id = $2
                -- SOLUCIÓN: Usamos la sintaxis de INTERVALO directa con el parámetro entero
                AND L.fecha_vencimiento <= (CURRENT_DATE + INTERVAL '1 day' * $1)
                AND L.cantidad_actual > 0;
        `;
        // Nota: $1 es diasMaximos, $2 es farmaciaId
        const values = [diasMaximos, farmaciaId];
    
    const res = await query(sql, values);
    return res.rows;
};


// 3. Función que descuenta el stock por devolución o cambio
export const actualizarStockLote = async (loteId, cantidadADevolver) => {
    const sql = `
        UPDATE Lote 
        SET cantidad_actual = cantidad_actual - $2
        WHERE id = $1;
    `;
    
    const values = [loteId, cantidadADevolver];

    try {
        await query(sql, values);
        return true; 
    } catch (error) {
        console.error("Error al descontar stock:", error.message);
        throw new Error(`Fallo al actualizar stock: ${error.message}`);
    }
};

// 4. Función para obtener un Lote por su número y producto
export const obtenerLotePorNro = async (productoId, nroLote, farmaciaId) => {
    const sql = `
        SELECT id FROM Lote 
        WHERE producto_id = $1 AND nro_lote = $2 AND farmacia_id = $3;
    `;
    const values = [productoId, nroLote, farmaciaId];
    
    const res = await query(sql, values);
    return res.rows[0] || null; // Devuelve el Lote si existe
};


// 5. Función para sumar stock a un Lote existente
export const sumarStockLote = async (loteId, cantidadAIngresar) => {
    const sql = `
        UPDATE Lote 
        SET cantidad_actual = cantidad_actual + $2
        WHERE id = $1;
    `;
    const values = [loteId, cantidadAIngresar];
    await query(sql, values);
    return true;
};



// 6. Función para actualizar los datos de un Lote
export const actualizarLote = async (loteId, nuevosDatos) => {
    const sql = `
        UPDATE Lote 
        SET 
            fecha_vencimiento = $2, 
            cantidad_actual = $3,
            nro_lote = $4
        WHERE id = $1
        RETURNING id;
    `;
    const values = [
        loteId, 
        nuevosDatos.fecha_vencimiento, 
        nuevosDatos.cantidad_actual,
        nuevosDatos.nro_lote
    ];

    await query(sql, values);
    return true;
};

// 7. Función para eliminar un Lote por su ID
export const eliminarLote = async (loteId) => {
    const sql = `
        DELETE FROM Lote 
        WHERE id = $1;
    `;
    const values = [loteId];

    try {
        await query(sql, values);
        return true; // Éxito en la eliminación
    } catch (error) {
        console.error("Error al eliminar lote:", error.message);
        throw new Error(`Fallo al eliminar lote: ${error.message}`);
    }
};