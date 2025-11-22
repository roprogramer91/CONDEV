// tasks/alertScheduler.js

import cron from 'node-cron';
// Importamos la función que realmente ejecuta la lógica de vencimientos
import { verificarYEnviarAlertas } from '../services/vencimientoService.js'; 

// La hora que se ejecutará la tarea: Todos los días a las 8:00 AM
const CRON_SCHEDULE = '0 8 * * *'; 

/**
 * Inicializa y programa la tarea de revisión diaria de vencimientos.
 */
export const startScheduler = () => {
    
    console.log(`Programando revisión diaria de alertas para las 8:00 AM.`);
    
    // cron.schedule recibe la expresión CRON y la función a ejecutar
    cron.schedule(CRON_SCHEDULE, async () => {
        try {
            console.log(`[CRON] Ejecutando tarea de revisión de vencimientos... ${new Date().toISOString()}`);
            
            // Llama a la lógica central del sistema
            await verificarYEnviarAlertas(); 
            
            console.log('[CRON] Revisión finalizada.');

        } catch (error) {
            console.error('🚨 [CRON ERROR] Falló la tarea programada:', error);
        }
    });
};