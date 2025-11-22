// controllers/producto.controller.js
import { obtenerProductoPorNombre, guardarProducto } from '../models/producto.model.js';
import Lote from '../models/lote.model.js'; // Necesitamos la clase Lote para crear la instancia


// Simulación de ID de la Farmacia logueada (temporal)
const FARMACIA_ID = 1; 

const registrarItemConLote = async (req, res) => {
    
    // 1. Desestructuración de datos (asumimos que vienen del formulario)
    const { nombre, laboratorio, compuesto, nro_lote, fecha_vencimiento, cantidad_actual } = req.body;
    let productoId; // Inicializamos la variable para guardar el ID.

    try {
        // 2. Búsqueda: Llamamos al Modelo para ver si ya existe.
        const productoExistente = await ProductoModel.obtenerProductoPorNombre(nombre, FARMACIA_ID);

        // 3. Decisión (El IF/ELSE)
        if (productoExistente) {
            // Caso A: Ya existe. Usamos su ID.
            productoId = productoExistente.id;
            
        } else {
            // Caso B: Producto nuevo (Primera carga). Lo guardamos.
            
            // Creamos una instancia Producto (si tuviéramos la clase Producto)
            // const nuevoProducto = new Producto({nombre, laboratorio, compuesto, FARMACIA_ID}); 
            
            // Llama al Modelo para guardar y obtener el ID
            productoId = await ProductoModel.guardarProducto({nombre, laboratorio, compuesto, farmacia_id: FARMACIA_ID});
        }

        // 4. Guardado Final: Creamos y guardamos el Lote usando el productoId que obtuvimos.
        const nuevoLote = new Lote(productoId, nro_lote, fecha_vencimiento, cantidad_actual, FARMACIA_ID);

        await ProductoModel.guardarLote(nuevoLote);
        
        // Enviamos la respuesta al cliente
        return res.status(201).json({ mensaje: 'Producto y Lote registrados con éxito!' });

    } catch (error) {
        console.error("Error al registrar item:", error);
        return res.status(500).json({ error: 'Fallo interno del servidor al guardar.' });
    }
};

export default {
    registrarItemConLote
};