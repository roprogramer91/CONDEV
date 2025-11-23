// controllers/inventario.controller.js
// Acá manejo todas las operaciones del inventario: registrar, consultar, editar, eliminar
// Este es uno de los controladores más importantes del sistema

import { obtenerProductoPorNombre, guardarProducto, actualizarProducto } from '../models/producto.model.js';
import { guardarLote, obtenerLotesAVencer, actualizarStockLote, obtenerLotePorNro, sumarStockLote, actualizarLote, eliminarLote, buscarLotesPorNombreProducto } from '../models/lote.model.js';
import { calcularDiferenciaDias } from '../utils/dateUtils.js';
import { obtenerAlertasProcesadas, verificarYEnviarAlertas } from '../services/vencimientoService.js';

// Importo las clases de dominio
import Producto from '../classes/Producto.js';
import Lote from '../classes/Lote.js';

/**
 * Registro un nuevo item en el inventario (producto + lote)
 * Si el producto ya existe, solo agrego el lote
 * Si el lote ya existe, sumo el stock
 */
export const registrarItemConLote = async (req, res) => {
    // Obtengo el ID de la farmacia desde el token JWT
    const FARMACIA_ID = req.usuario.farmacia_id;

    const {
        nombre,
        laboratorio,
        compuesto,
        nro_lote,
        fecha_vencimiento,
        cantidad_actual
    } = req.body;

    let productoId;
    let loteGuardado = false;

    try {
        // PASO 1: Busco si el producto ya existe en la farmacia
        const productoExistente = await obtenerProductoPorNombre(nombre, FARMACIA_ID);

        if (productoExistente) {
            // El producto ya existe, uso su ID
            productoId = productoExistente.id;
        } else {
            // Es un producto nuevo, lo creo
            const nuevoProductoData = new Producto(nombre, laboratorio, compuesto, FARMACIA_ID, 0);
            productoId = await guardarProducto(nuevoProductoData);
        }

        // PASO 2: Busco si el lote ya existe para este producto
        const loteExistente = await obtenerLotePorNro(productoId, nro_lote, FARMACIA_ID);

        if (loteExistente) {
            // El lote ya existe (probablemente con stock 0), sumo el stock
            await sumarStockLote(loteExistente.id, cantidad_actual);
            loteGuardado = true;
        } else {
            // Es un lote nuevo, lo creo
            const nuevoLote = new Lote(productoId, nro_lote, fecha_vencimiento, cantidad_actual, FARMACIA_ID);
            await guardarLote(nuevoLote);
            loteGuardado = true;
        }

        if (loteGuardado) {
            return res.status(201).json({
                mensaje: 'Item y Lote registrados/actualizados con éxito!',
                productoId: productoId
            });
        }

    } catch (error) {
        console.error("🚨 Error en el controlador de registro:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar la carga: ' + error.message });
    }
};

// Umbrales de días para clasificar alertas
const DIAS_URGENTE = 30;
const DIAS_MEDIO = 60;
const DIAS_AVISO = 90;

/**
 * Obtengo las alertas de vencimiento para la farmacia del usuario
 * Devuelvo los lotes procesados con días restantes y categoría
 */
export const revisarVencimientos = async (req, res) => {
    // El ID de la farmacia viene del middleware de autenticación
    const farmaciaId = req.usuario.farmacia_id;

    try {
        // Llamo al servicio que procesa y clasifica las alertas
        const alertasClasificadas = await obtenerAlertasProcesadas(farmaciaId);
        return res.status(200).json(alertasClasificadas);

    } catch (error) {
        console.error("🚨 Error al obtener alertas:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar las alertas. Intentar más tarde.' });
    }
};

/**
 * Registro una devolución de mercadería y descuento el stock
 */
export const registrarDevolucion = async (req, res) => {
    const { lote_id, cantidad_devuelta } = req.body;

    // Validación básica
    if (!lote_id || !cantidad_devuelta || cantidad_devuelta <= 0) {
        return res.status(400).json({ error: 'Faltan lote_id o cantidad_devuelta válida.' });
    }

    try {
        // Actualizo el stock del lote
        await actualizarStockLote(lote_id, cantidad_devuelta);

        return res.status(200).json({
            mensaje: `Devolución de ${cantidad_devuelta} unidades registrada con éxito para el Lote ID: ${lote_id}. Stock descontado.`
        });

    } catch (error) {
        console.error("🚨 Error al registrar devolución:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar la devolución.' });
    }
};

/**
 * Edito un item del inventario (producto y/o lote)
 * Actualizo solo los campos que vienen en el request
 */
export const editarItemInventario = async (req, res) => {
    const {
        producto_id,
        lote_id,
        nombre,
        laboratorio,
        compuesto,
        nro_lote,
        fecha_vencimiento,
        cantidad_actual
    } = req.body;

    if (!producto_id || !lote_id) {
        return res.status(400).json({ error: 'Faltan los IDs de Producto o Lote para editar.' });
    }

    try {
        // Actualizo el producto si hay cambios
        if (nombre || laboratorio || compuesto) {
            const nuevosDatosProducto = { nombre, laboratorio, compuesto };
            await actualizarProducto(producto_id, nuevosDatosProducto);
        }

        // Actualizo el lote si hay cambios
        if (nro_lote || fecha_vencimiento || cantidad_actual !== undefined) {
            const nuevosDatosLote = { nro_lote, fecha_vencimiento, cantidad_actual };
            await actualizarLote(lote_id, nuevosDatosLote);
        }

        return res.status(200).json({
            mensaje: `El Producto ${producto_id} y el Lote ${lote_id} fueron actualizados con éxito.`
        });

    } catch (error) {
        console.error("🚨 Error al editar item:", error.message);
        return res.status(500).json({ error: 'Fallo al procesar la edición: ' + error.message });
    }
};

/**
 * Elimino un lote del inventario
 */
export const eliminarItemInventario = async (req, res) => {
    const { id } = req.params;

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

/**
 * Disparo manualmente el proceso de verificación de alertas (para testing)
 */
export const triggerTestEmail = async (req, res) => {
    console.log("🧪 [TEST] Disparando verificación de alertas manualmente...");

    try {
        await verificarYEnviarAlertas();
        return res.status(200).json({ mensaje: 'Proceso de alertas disparado. Revisa la consola del servidor y tu correo.' });
    } catch (error) {
        console.error("🚨 Error en test de email:", error);
        return res.status(500).json({ error: 'Fallo al disparar el test.' });
    }
};

/**
 * Busco items del inventario por nombre de producto
 * Usado en la sección de gestión del frontend
 */
export const buscarItems = async (req, res) => {
    const farmaciaId = req.usuario.farmacia_id;
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Falta el término de búsqueda (q).' });
    }

    try {
        const resultados = await buscarLotesPorNombreProducto(farmaciaId, q);
        return res.status(200).json(resultados);

    } catch (error) {
        console.error("🚨 Error al buscar items:", error.message);
        return res.status(500).json({ error: 'Fallo al buscar items.' });
    }
};