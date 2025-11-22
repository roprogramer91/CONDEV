// routes/inventario.routes.js

import express from 'express';

// importamos el controlador
import { registrarItemConLote, revisarVencimientos, registrarDevolucion, editarItemInventario, eliminarItemInventario, triggerTestEmail, buscarItems } from '../controllers/inventario.controller.js';
import { verificarToken } from '../middleware/auth.js';

// creamos el router
const router = express.Router();

// 1. Endpoint para la carga de un nuevo Producto/Lote
router.post('/cargar', verificarToken, registrarItemConLote);

// 2. Endpoint para obtener alertas de vencimiento
router.get('/alertas', verificarToken, revisarVencimientos);

// 3. Endpoint para registrar una devolución y actualizar stock
router.patch('/devolver', verificarToken, registrarDevolucion);

// 4. Endpoint para editar un ítem del inventario
router.put('/editar', verificarToken, editarItemInventario);

// 5. Endpoint para eliminar un ítem del inventario
router.delete('/lote/:id', verificarToken, eliminarItemInventario);

// 6. Endpoint DE TESTEO para disparar alertas manualmente
router.post('/test-email', verificarToken, triggerTestEmail);

// 7. Endpoint para BUSCAR items (gestión)
// Método: GET
// URL: /api/inventario/buscar?q=...
router.get('/buscar', verificarToken, buscarItems);

// exportamos el router
export default router;