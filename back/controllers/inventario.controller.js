// controllers/inventario.controller.js

// importamos las dependencias necesarias
import Lote from '../classes/Lote.js';
import { obtenerProductoPorNombre, guardarProducto, actualizarProducto } from '../models/producto.model.js';
import { guardarLote, obtenerLotesAVencer, actualizarStockLote, obtenerLotePorNro, sumarStockLote, actualizarLote,eliminarLote } from '../models/lote.model.js';
import { calcularDiferenciaDias } from '../utils/dateUtils.js';

// Simulación de ID de la Farmacia (temporal para el MVP)
const FARMACIA_ID = 1; 

export const registrarItemConLote = async (req, res) => {
    
    const { 
        nombre, 
        laboratorio, 
        compuesto, 
        nro_lote, 
        fecha_vencimiento, 
        cantidad_actual 
    } = req.body;
    
    let productoId; 
    let loteGuardado = false; // Flag para controlar si insertamos o actualizamos

    try {
        // --- PASO 1: BUSCAR/CREAR PRODUCTO MAESTRO ---
        const productoExistente = await obtenerProductoPorNombre(nombre, FARMACIA_ID);

        if (productoExistente) {
            productoId = productoExistente.id;
        } else {
            // Caso B: Producto nuevo. Lo guardamos y obtenemos el ID
            const nuevoProductoData = new Producto(nombre, laboratorio, compuesto, FARMACIA_ID, 0);
            productoId = await guardarProducto(nuevoProductoData);
        }

        // --- PASO 2: BUSCAR SI EL LOTE YA EXISTE ---
        const loteExistente = await obtenerLotePorNro(productoId, nro_lote, FARMACIA_ID);

        if (loteExistente) {
            // Caso 2A: EL LOTE YA EXISTE (Probablemente con stock 0). Lo reutilizamos.
            await sumarStockLote(loteExistente.id, cantidad_actual);
            loteGuardado = true;
            
        } else {
            // Caso 2B: El Lote es totalmente nuevo para este producto. Lo insertamos.
            const nuevoLote = new Lote(productoId, nro_lote, fecha_vencimiento, cantidad_actual, FARMACIA_ID);
            await guardarLote(nuevoLote);
            loteGuardado = true;
        }

        if (loteGuardado) {
            // --- PASO 3: RESPUESTA AL CLIENTE ---
            return res.status(201).json({ 
                mensaje: 'Item y Lote registrados/actualizados con éxito!',
                productoId: productoId
            });
        }
        
    } catch (error) {
        console.error("🚨 Error en el controlador de registro:", error.message);
        // Devolvemos un error 500 para el cliente
        return res.status(500).json({ error: 'Fallo al procesar la carga: ' + error.message });
    }
};

// 2. Controlador para revisar vencimientos

// Definimos los umbrales en días
const DIAS_URGENTE = 30;
const DIAS_MEDIO = 60;
const DIAS_AVISO = 90;

export const revisarVencimientos = async (req, res) => {
    
    // Simulación del ID de la Farmacia logueada
    const FARMACIA_ID = 1; 

    try {
        // 1. Obtener datos crudos (Máximo 90 días adelante)
        const lotesCrudos = await obtenerLotesAVencer(DIAS_AVISO, FARMACIA_ID);

        // 2. Procesar y clasificar los lotes
        const alertasClasificadas = lotesCrudos.map(lote => {
            
            // Calculamos cuántos días faltan para el vencimiento 
            const diasRestantes = calcularDiferenciaDias(lote.fecha_vencimiento); 

            let categoria = 'NINGUNA'; // Valor por defecto

            if (diasRestantes <= DIAS_URGENTE) {
                categoria = 'URGENTE';
            } else if (diasRestantes <= DIAS_MEDIO) {
                categoria = 'MEDIO';
            } else {
                categoria = 'AVISO';
            }
                
            return { 
                ...lote, 
                dias_restantes: diasRestantes, 
                categoria_alerta: categoria 
            };
        });

        // 3. Generar Respuesta
        return res.status(200).json(alertasClasificadas);

    } catch (error) {
        console.error("🚨 Error al revisar vencimientos:", error);
        return res.status(500).json({ error: 'Fallo al procesar las alertas.' });
    }
};


// 3. Controlador para registrar devoluciones y actualizar stock
export const registrarDevolucion = async (req, res) => {
    
    // 1. Obtener datos de la petición (Postman)
    // El usuario debe indicarnos el ID del lote (que sacó de la alerta) 
    // y la cantidad a descontar.
    const { lote_id, cantidad_devuelta } = req.body; 

    // Validación rápida:
    if (!lote_id || !cantidad_devuelta || cantidad_devuelta <= 0) {
        return res.status(400).json({ error: 'Faltan lote_id o cantidad_devuelta válida.' });
    }

    try {
        // 2. Llamar al Modelo para hacer el UPDATE en la base de datos
        await actualizarStockLote(lote_id, cantidad_devuelta);
        
        // 3. Respuesta exitosa
        return res.status(200).json({ 
            mensaje: `Devolución de ${cantidad_devuelta} unidades registrada con éxito para el Lote ID: ${lote_id}. Stock descontado.`
        });

    } catch (error) {
        console.error("🚨 Error al registrar devolución:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar la devolución.' });
    }
};



// 4. Controlador para editar un ítem del inventario (Producto + Lote)
export const editarItemInventario = async (req, res) => {
    
    // 1. Obtener datos cruciales y opcionales del body
    const { 
        producto_id, // Necesario para saber QUÉ producto actualizar
        lote_id,     // Necesario para saber QUÉ lote actualizar
        // Datos del Producto Maestro que PUEDEN cambiar
        nombre, 
        laboratorio, 
        compuesto,
        // Datos del Lote que PUEDEN cambiar
        nro_lote,
        fecha_vencimiento, 
        cantidad_actual 
    } = req.body;

    if (!producto_id || !lote_id) {
        return res.status(400).json({ error: 'Faltan los IDs de Producto o Lote para editar.' });
    }

    try {
        // --- 2. Lógica de Actualización Condicional ---
        
        // A. Actualizar Producto Maestro (si hay cambios en sus campos)
        if (nombre || laboratorio || compuesto) {
            const nuevosDatosProducto = { nombre, laboratorio, compuesto };
            await actualizarProducto(producto_id, nuevosDatosProducto);
        }

        // B. Actualizar Lote (si hay cambios en sus campos)
        if (nro_lote || fecha_vencimiento || cantidad_actual !== undefined) {
            const nuevosDatosLote = { nro_lote, fecha_vencimiento, cantidad_actual };
            await actualizarLote(lote_id, nuevosDatosLote);
        }

        // --- 3. Respuesta Final ---
        return res.status(200).json({ 
            mensaje: `El Producto ${producto_id} y el Lote ${lote_id} fueron actualizados con éxito.` 
        });

    } catch (error) {
        console.error("🚨 Error al editar item:", error.message);
        // Devolvemos un error si la BD falla (ej: si el nuevo nro_lote ya existe)
        return res.status(500).json({ error: 'Fallo al procesar la edición: ' + error.message });
    }
};


// 5. Controlador para eliminar un ítem del inventario (Lote)
export const eliminarItemInventario = async (req, res) => {
    
    // En las peticiones DELETE, el ID se suele pasar en la URL (como un parámetro)
    const { id } = req.params; // Lo obtenemos de req.params

    if (!id) {
        return res.status(400).json({ error: 'Falta el ID del lote a eliminar.' });
    }

    try {
        await eliminarLote(id);
        
        return res.status(200).json({ 
            mensaje: `El Lote con ID ${id} fue eliminado correctamente.` 
        });

    } catch (error) {
        console.error("🚨 Error al eliminar lote:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar la eliminación.' });
    }
};