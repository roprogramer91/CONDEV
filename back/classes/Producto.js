// classes/Producto.js

import crypto from 'crypto'; 

class Producto {

    // El constructor recibe los datos necesarios para crear un Producto
    constructor(nombre, laboratorio, compuesto, farmaciaId, precio_venta = 0) {
        
        // 1. ID Único
        this.id = crypto.randomUUID(); 
        
        // 2. Relaciones
        this.farmacia_id = farmaciaId;
        
        // 3. Propiedades del Producto
        this.nombre = nombre;
        this.laboratorio = laboratorio;
        this.compuesto = compuesto;
        
        // 4. Precio (lo inicializamos en 0 si no se provee)
        this.precio_venta = precio_venta;
    }
}

export default Producto;