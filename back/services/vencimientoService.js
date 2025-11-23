// services/vencimientoService.js
// Acá manejo toda la lógica de negocio para las alertas de vencimiento
// Este servicio se usa tanto para la API como para el cron job diario

import { obtenerLotesAVencer } from '../models/lote.model.js';
import { calcularDiferenciaDias } from '../utils/dateUtils.js';
import { enviarEmailNotificacion } from '../utils/emailSender.js';
import { crearNotificacion } from '../models/notificacion.model.js';
import { obtenerTodasLasFarmacias } from '../models/farmacia.model.js';
import { obtenerCorreosAdminPorFarmacia } from '../models/usuario.model.js';

// Umbrales de días para clasificar alertas
const DIAS_URGENTE = 30;
const DIAS_AVISO = 90;

// Proceso un lote y le agrego información calculada (días restantes y categoría)
const procesarLote = (lote) => {
    const diasRestantes = calcularDiferenciaDias(lote.fecha_vencimiento);
    let categoria = 'AVISO';

    if (diasRestantes <= DIAS_URGENTE) {
        categoria = 'URGENTE';
    }

    return {
        ...lote,
        dias_restantes: diasRestantes,
        categoria_alerta: categoria
    };
};

/**
 * Función para la API - Devuelve alertas procesadas para mostrar en el frontend
 * @param {number} farmaciaId - ID de la farmacia
 * @returns {Array} Lista de lotes con días restantes y categoría
 */
export const obtenerAlertasProcesadas = async (farmaciaId) => {
    // Obtengo los lotes que vencen en los próximos 90 días
    const lotesCrudos = await obtenerLotesAVencer(DIAS_AVISO, farmaciaId);

    // Proceso cada lote para agregar info calculada
    return lotesCrudos.map(procesarLote);
};

/**
 * Función para el Cron Job - Verifica vencimientos y envía notificaciones
 * Se ejecuta automáticamente todos los días a las 8 AM
 * Procesa todas las farmacias del sistema
 */
export const verificarYEnviarAlertas = async () => {
    console.log("Iniciando verificación de alertas en background...");

    try {
        // Obtengo todas las farmacias del sistema
        const farmacias = await obtenerTodasLasFarmacias();

        // Proceso cada farmacia
        for (const farmacia of farmacias) {
            const farmaciaId = farmacia.id;
            console.log(`Procesando farmacia ID: ${farmaciaId}`);

            // Obtengo los lotes que vencen pronto
            const lotesCrudos = await obtenerLotesAVencer(DIAS_AVISO, farmaciaId);

            // Obtengo los correos de los administradores de esta farmacia
            const correosAdmins = await obtenerCorreosAdminPorFarmacia(farmaciaId);

            // Proceso cada lote
            for (const lote of lotesCrudos) {
                const procesado = procesarLote(lote);

                // Guardo la notificación en la base de datos
                await crearNotificacion({
                    farmacia_id: farmaciaId,
                    lote_id: lote.lote_id,
                    tipo: procesado.categoria_alerta,
                    mensaje: `Lote ${lote.nro_lote} de ${lote.nombre_producto} vence en ${procesado.dias_restantes} días`
                });

                // Solo envío email si es urgente (menos de 30 días)
                if (procesado.categoria_alerta === 'URGENTE') {
                    const asunto = `⚠️ Alerta Urgente: Medicamento próximo a vencer`;
                    const cuerpo = `
                        <h2>Alerta de Vencimiento Urgente</h2>
                        <p>El siguiente lote está próximo a vencer:</p>
                        <ul>
                            <li><strong>Producto:</strong> ${lote.nombre_producto}</li>
                            <li><strong>Laboratorio:</strong> ${lote.laboratorio}</li>
                            <li><strong>Lote:</strong> ${lote.nro_lote}</li>
                            <li><strong>Vencimiento:</strong> ${lote.fecha_vencimiento}</li>
                            <li><strong>Días restantes:</strong> ${procesado.dias_restantes}</li>
                            <li><strong>Cantidad actual:</strong> ${lote.cantidad_actual}</li>
                        </ul>
                        <p>Por favor, gestione la devolución o venta de este producto.</p>
                    `;

                    // Envío el email a todos los administradores de la farmacia
                    for (const correo of correosAdmins) {
                        await enviarEmailNotificacion(correo, asunto, cuerpo);
                        console.log(`Notificacion enviada a ${correo}`);
                    }
                }
            }
        }

        console.log("Verificación de alertas completada.");
    } catch (error) {
        console.error("Error general en verificarYEnviarAlertas:", error);
    }
};
