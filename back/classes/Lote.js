// classes/Lote.js

// Importamos crypto para generar IDs únicos
import crypto from 'crypto'; 

class Lote {
    
    // El constructor recibe los datos que vienen del formulario/controlador
    constructor(productoId, nro_lote, fecha_vencimiento, cantidad_actual, farmaciaId) {
        
        // 1. ID único del Lote
        this.id = crypto.randomUUID(); 
        
        // 2. Relaciones
        this.producto_id = productoId;
        this.farmacia_id = farmaciaId; 
        
        // 3. Propiedades del Lote
        this.nro_lote = nro_lote;
        this.fecha_vencimiento = fecha_vencimiento; // Clave para la alerta de vencimiento
        this.cantidad_actual = cantidad_actual;
    }
}

export default Lote;