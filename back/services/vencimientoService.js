// services/vencimientoService.js

import { obtenerLotesAVencer } from '../models/lote.model.js';
import { calcularDiferenciaDias } from '../utils/dateUtils.js';
import { enviarEmailNotificacion } from '../utils/emailSender.js';
import { crearNotificacion } from '../models/notificacion.model.js';
import { obtenerTodasLasFarmacias } from '../models/farmacia.model.js';

const DIAS_URGENTE = 30;
const DIAS_AVISO = 90;

// Helper para procesar un lote y devolver su estado enriquecido
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
 * 1. Función para el Controlador (API)
 * Devuelve la lista de lotes próximos a vencer, procesada con días restantes y categoría.
 */
export const obtenerAlertasProcesadas = async (farmaciaId) => {
    // Obtenemos los lotes que vencen en el rango de AVISO (ej. 90 días)
    const lotesCrudos = await obtenerLotesAVencer(DIAS_AVISO, farmaciaId);

    // Procesamos cada uno para agregar info calculada
    return lotesCrudos.map(procesarLote);
};

/**
 * 2. Función para el Cron (Background Task)
 * Verifica vencimientos, guarda notificaciones en BD y envía emails.
 */
export const verificarYEnviarAlertas = async () => {

    console.log("Iniciando verificación de alertas en background...");

    try {
        const farmacias = await obtenerTodasLasFarmacias();

        for (const farmacia of farmacias) {
            const farmaciaId = farmacia.id;
            console.log(`Procesando farmacia ID: ${farmaciaId}`);

            const lotesCrudos = await obtenerLotesAVencer(DIAS_AVISO, farmaciaId);

            for (const lote of lotesCrudos) {
                const procesado = procesarLote(lote);

                // A. Guardar Notificación en Base de Datos
                try {
                    // Mensaje personalizado
                    const mensaje = `El lote ${lote.nro_lote} de ${lote.nombre_producto} vence en ${procesado.dias_restantes} días.`;

                    await crearNotificacion(
                        lote.lote_id,
                        farmaciaId,
                        procesado.categoria_alerta,
                        mensaje
                    );
                } catch (error) {
                    console.error(`Error al guardar notificación para lote ${lote.lote_id}:`, error.message);
                }

                // B. Enviar Email solo si es URGENTE (para no spammear)
                // TODO: Obtener correo del admin de la farmacia específica
                if (procesado.categoria_alerta === 'URGENTE') {
                    const asunto = `ALERTA ${procesado.categoria_alerta}: ${lote.nombre_producto} vence pronto`;
                    const correoAdmin = "admin.farmacia01@ejemplo.com"; // Placeholder

                    const html = `
                        <h3>Atención Farmacéutico</h3>
                        <p>El producto <strong>${lote.nombre_producto}</strong> (Lote: ${lote.nro_lote}) vence en <strong>${procesado.dias_restantes} días</strong>.</p>
                        <p>Stock actual: ${lote.cantidad_actual}</p>
                        <p>Por favor, tomar medidas.</p>
                    `;

                    await enviarEmailNotificacion(correoAdmin, asunto, html);
                }
            }
        }
    } catch (error) {
        console.error("Error general en verificarYEnviarAlertas:", error);
    }

    console.log("Verificación de alertas finalizada.");
};
