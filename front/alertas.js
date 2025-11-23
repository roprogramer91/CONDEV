// front/alertas.js
// Acá manejo toda la lógica de alertas de vencimiento y devoluciones

import { obtenerAlertas, registrarDevolucion, registrarItem } from './api.js';
import { renderizarTabla, renderizarResumen, actualizarMensaje } from './ui.js';
import { estaLogueado } from './auth.js';

// Estado de alertas
export const alertasState = {
    cargandoAlertas: false,
    alertaSeleccionada: null,
    modoCantidad: false,
};

// Referencias a elementos del DOM
const getRefs = () => ({
    mensajeCarga: document.getElementById('mensaje-carga'),
    mensajeAlertas: document.getElementById('mensaje-alertas'),
    contenedorAlertas: document.getElementById('contenedor-alertas'),
    mensajeResumen: document.getElementById('mensaje-resumen'),
    contenedorResumen: document.getElementById('resumen-lista'),
    modalOverlay: document.getElementById('modal-devolucion'),
    modalContexto: document.getElementById('modal-contexto'),
    modalDetalle: document.getElementById('modal-detalle'),
    modalForm: document.getElementById('form-modal'),
    modalInput: document.getElementById('input-cantidad'),
    modalError: document.getElementById('modal-error'),
});

// Cargo las alertas de vencimiento
export const cargarAlertas = async () => {
    const refs = getRefs();

    if (!estaLogueado()) {
        actualizarMensaje(refs.mensajeAlertas, 'Inicia sesion para ver alertas.', 'info');
        return;
    }

    if (alertasState.cargandoAlertas) return;

    alertasState.cargandoAlertas = true;
    actualizarMensaje(refs.mensajeAlertas, 'Cargando alertas...', 'info');

    try {
        const alertas = await obtenerAlertas();
        renderizarTabla(alertas, refs.contenedorAlertas, abrirModalDevolucion);
        actualizarMensaje(refs.mensajeAlertas, `Alertas actualizadas (${alertas.length})`, 'exito');
    } catch (error) {
        actualizarMensaje(refs.mensajeAlertas, error.message, 'error');
    } finally {
        alertasState.cargandoAlertas = false;
    }
};

// Cargo el resumen de próximos vencimientos
export const cargarResumen = async () => {
    const refs = getRefs();

    if (!estaLogueado()) {
        actualizarMensaje(refs.mensajeResumen, 'Inicia sesion para ver el resumen.', 'info');
        return;
    }

    actualizarMensaje(refs.mensajeResumen, 'Cargando resumen...', 'info');

    try {
        const alertas = await obtenerAlertas();
        const lista = Array.isArray(alertas) ? alertas : [];
        renderizarResumen(lista, refs.contenedorResumen);
        actualizarMensaje(refs.mensajeResumen, `Mostrando proximos ${Math.min(lista.length, 6)} vencimientos`, 'exito');
    } catch (error) {
        actualizarMensaje(refs.mensajeResumen, error.message, 'error');
    }
};

// Manejo el submit del formulario de carga de items
export const manejarSubmitCarga = async (event) => {
    event.preventDefault();
    const refs = getRefs();
    const form = document.getElementById('form-carga');

    if (!estaLogueado()) {
        actualizarMensaje(refs.mensajeCarga, 'Inicia sesion para cargar items.', 'error');
        return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());
    const payload = {
        ...datos,
        cantidad_actual: Number(datos.cantidad_actual),
    };

    actualizarMensaje(refs.mensajeCarga, 'Enviando datos...', 'info');

    try {
        await registrarItem(payload);
        actualizarMensaje(refs.mensajeCarga, 'Item registrado con exito.', 'exito');
        form.reset();
    } catch (error) {
        actualizarMensaje(refs.mensajeCarga, error.message, 'error');
    }
};

// Registro una devolución de mercadería
const manejarDevolucion = async (loteId, cantidad) => {
    const refs = getRefs();
    actualizarMensaje(refs.mensajeAlertas, 'Registrando devolucion...', 'info');

    try {
        await registrarDevolucion(loteId, cantidad);
        actualizarMensaje(refs.mensajeAlertas, 'Devolucion registrada. Recargando alertas...', 'exito');
        await cargarAlertas();
        return true;
    } catch (error) {
        actualizarMensaje(refs.mensajeAlertas, error.message, 'error');
        return false;
    }
};

// Limpio el modal de devolución
const limpiarModal = () => {
    const refs = getRefs();
    if (refs.modalInput) refs.modalInput.value = '';
    if (refs.modalError) refs.modalError.textContent = '';
    alertasState.modoCantidad = false;
    toggleCamposCantidad(false);
};

// Cierro el modal de devolución
export const cerrarModal = () => {
    const refs = getRefs();
    alertasState.alertaSeleccionada = null;
    if (refs.modalOverlay) refs.modalOverlay.hidden = true;
    limpiarModal();
};

// Abro el modal de devolución con los datos de la alerta
const abrirModalDevolucion = (alerta) => {
    const refs = getRefs();
    alertasState.alertaSeleccionada = alerta;

    if (refs.modalContexto) {
        refs.modalContexto.textContent = `Lote ${alerta.nro_lote} - ${alerta.nombre_producto}`;
    }

    if (refs.modalDetalle) {
        const detalles = [
            { label: 'Producto', valor: alerta.nombre_producto },
            { label: 'Laboratorio', valor: alerta.laboratorio },
            { label: 'Lote', valor: alerta.nro_lote },
            { label: 'Fecha vencimiento', valor: alerta.fecha_vencimiento },
            { label: 'Dias restantes', valor: alerta.dias_restantes },
            { label: 'Cantidad actual', valor: alerta.cantidad_actual },
            { label: 'Categoria', valor: alerta.categoria_alerta },
        ];

        refs.modalDetalle.innerHTML = detalles
            .map((d) => `<p><span class="modal-label">${d.label}:</span> ${d.valor ?? '-'}</p>`)
            .join('');
    }

    if (refs.modalOverlay) refs.modalOverlay.hidden = false;
    limpiarModal();
};

// Habilito/deshabilito los campos de cantidad en el modal
export const toggleCamposCantidad = (activar) => {
    const refs = getRefs();
    alertasState.modoCantidad = activar;
    const contenedor = document.getElementById('cantidad-wrapper');

    if (!contenedor) return;

    contenedor.classList.toggle('activo', activar);

    if (refs.modalInput) {
        refs.modalInput.disabled = !activar;
        if (activar) refs.modalInput.focus();
    }

    if (refs.modalForm) {
        const submit = refs.modalForm.querySelector('button[type="submit"]');
        if (submit) submit.disabled = !activar;
    }
};

// Manejo el submit del modal de devolución
export const manejarSubmitModal = async (event) => {
    event.preventDefault();
    const refs = getRefs();

    if (!alertasState.alertaSeleccionada) return;

    const cantidad = Number(refs.modalInput?.value);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        if (refs.modalError) refs.modalError.textContent = 'Ingresa un numero mayor a cero.';
        return;
    }

    if (refs.modalError) refs.modalError.textContent = '';

    const ok = await manejarDevolucion(alertasState.alertaSeleccionada.lote_id, cantidad);

    if (ok) {
        cerrarModal();
    } else if (refs.modalError) {
        refs.modalError.textContent = 'No se pudo registrar la devolucion.';
    }
};
