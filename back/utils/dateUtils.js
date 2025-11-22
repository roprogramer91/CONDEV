
// utils/dateUtils.js

/**
 * Calcula la diferencia en días entre la fecha de vencimiento y la fecha actual.
 * @param {Date | string} fechaVencimiento - La fecha de vencimiento.
 * @returns {number} Número de días restantes. Positivo si faltan días, negativo si ya venció.
 */
export const calcularDiferenciaDias = (fechaVencimiento) => {
    
    // 1. Convertir la entrada a objetos Date
    // La fecha de vencimiento puede venir como string de la DB (YYYY-MM-DD)
    const fechaVenc = new Date(fechaVencimiento);
    
    // 2. Obtener la fecha actual y resetear la hora a 00:00:00 
    // Esto asegura que la diferencia solo dependa de los días completos,
    // y no de la hora exacta de la consulta, lo cual es fundamental para alertas.
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    
    // 3. Calcular la diferencia en milisegundos
    // Restamos la fecha de vencimiento menos la fecha actual
    const diferenciaMs = fechaVenc.getTime() - hoy.getTime();
    
    // 4. Convertir milisegundos a días
    // 1 día = 1000 ms * 60 segundos * 60 minutos * 24 horas
    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    
    // Redondeamos hacia arriba para incluir el día actual si hay una fracción
    const diasRestantes = Math.ceil(diferenciaMs / MS_POR_DIA);
    
    return diasRestantes;
};