
// utils/dateUtils.js

/**
 * Calcula la diferencia en días entre la fecha de vencimiento y la fecha actual.
 * @param {Date | string} fechaVencimiento - La fecha de vencimiento.
 * @returns {number} Número de días restantes. Positivo si faltan días, negativo si ya venció.
 */
export const calcularDiferenciaDias = (fechaVencimiento) => {
    
    // 1. Convertir la entrada a un formato seguro (Año, Mes, Día)
    // Esto evita que JavaScript aplique la corrección de la Zona Horaria.
    const fechaString = new Date(fechaVencimiento).toISOString().slice(0, 10);
    const [year, month, day] = fechaString.split('-');

    // Crear la fecha de vencimiento usando UTC para evitar el desfase
    const fechaVenc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); 
    
    // 2. Obtener la fecha actual (también en UTC, al inicio del día)
    const hoy = new Date();
    // Creamos la fecha de hoy normalizada a UTC 00:00:00
    const hoyNormalizado = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0));
    
    // 3. Calcular la diferencia en milisegundos
    const diferenciaMs = fechaVenc.getTime() - hoyNormalizado.getTime(); 
    
    // 4. Convertir milisegundos a días (y redondear para evitar decimales)
    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    
    // Math.round es suficiente aquí ya que ya normalizamos las horas
    const diasRestantes = Math.round(diferenciaMs / MS_POR_DIA);
    
    return diasRestantes;
};