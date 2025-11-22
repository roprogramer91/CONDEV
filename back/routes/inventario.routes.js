// routes/inventario.routes.js

import express from 'express';

// importamos el controlador
import { registrarItemConLote, revisarVencimientos, registrarDevolucion,editarItemInventario, eliminarItemInventario} from '../controllers/inventario.controller.js';

// creamos el router
const router = express.Router();

// 1. Endpoint para la carga de un nuevo Producto/Lote
// Método: POST
// URL: /api/inventario/cargar
router.post('/cargar', registrarItemConLote);


// 2. Endpoint para obtener alertas de vencimiento (pendiente de implementación)
// Método: GET
// URL: /api/inventario/alertas
router.get('/alertas', revisarVencimientos); 

// 3. Endpoint para registrar una devolución y actualizar stock
// Método: POST
// URL: /api/inventario/devolucion
router.patch('/devolver', registrarDevolucion); 

// 4. Endpoint para editar un ítem del inventario (producto y lote)
// Método: PUT
// URL: /api/inventario/editar
router.put('/editar', editarItemInventario);

// 5. Endpoint para eliminar un ítem del inventario (lote)
// Método: DELETE
// URL: /api/inventario/lote/:id    
router.delete('/lote/:id', eliminarItemInventario);


// exportamos el router
export default router;