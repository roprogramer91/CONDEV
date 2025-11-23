// front/gestion.js
// Acá manejo toda la lógica de gestión de inventario (búsqueda, edición, eliminación)

import { buscarItems, editarItem, eliminarItem } from './api.js';
import { actualizarMensaje } from './ui.js';

// Estado para el item que estoy editando
export const gestionState = {
    itemEditando: null,
};

// Referencias a elementos del DOM
const getRefs = () => ({
    inputBusqueda: document.getElementById('input-busqueda'),
    tablaGestionBody: document.getElementById('tabla-gestion-body'),
    mensajeGestion: document.getElementById('mensaje-gestion'),
    gestionCards: document.getElementById('gestion-cards'),
    modalEdicion: document.getElementById('modal-edicion'),
    formEdicion: document.getElementById('form-edicion'),
    modalDetalleItem: document.getElementById('modal-detalle-item'),
    detalleItemContent: document.getElementById('detalle-item-content'),
});

// Busco items en el inventario
export const manejarBusqueda = async () => {
    const refs = getRefs();
    const query = refs.inputBusqueda.value.trim();

    if (!query) {
        actualizarMensaje(refs.mensajeGestion, 'Ingresa un término de búsqueda.', 'info');
        return;
    }

    actualizarMensaje(refs.mensajeGestion, 'Buscando...', 'info');

    try {
        const resultados = await buscarItems(query);
        renderTablaGestion(resultados);

        if (resultados.length === 0) {
            actualizarMensaje(refs.mensajeGestion, 'No se encontraron resultados.', 'info');
        } else {
            actualizarMensaje(refs.mensajeGestion, '', '');
        }
    } catch (error) {
        actualizarMensaje(refs.mensajeGestion, error.message, 'error');
    }
};

// Renderizo la tabla de resultados (desktop) y las cards (mobile)
const renderTablaGestion = (items) => {
    const refs = getRefs();

    // Renderizo tabla para desktop
    refs.tablaGestionBody.innerHTML = '';
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><button class="link-cell">${item.nombre_producto}</button></td>
      <td>${item.laboratorio || '-'}</td>
      <td>${item.nro_lote}</td>
      <td>${new Date(item.fecha_vencimiento).toLocaleDateString()}</td>
      <td>${item.cantidad_actual}</td>
      <td>
        <button class="btn-icon editar" title="Editar">✏️</button>
        <button class="btn-icon eliminar" title="Eliminar">🗑️</button>
      </td>
    `;

        // Event listeners para los botones
        const btnEditar = tr.querySelector('.editar');
        btnEditar.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalEdicion(item);
        });

        const btnEliminar = tr.querySelector('.eliminar');
        btnEliminar.addEventListener('click', (e) => {
            e.stopPropagation();
            manejarEliminarItem(item);
        });

        const btnDetalle = tr.querySelector('.link-cell');
        btnDetalle.addEventListener('click', () => abrirModalDetalle(item));

        refs.tablaGestionBody.appendChild(tr);
    });

    // Renderizo cards para mobile
    refs.gestionCards.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'alert-card';
        card.innerHTML = `
      <div class="alert-card-head">
        <h4>${item.nombre_producto}</h4>
      </div>
      <div class="alert-card-body">
        <div class="kv-row"><span class="kv-key">Lote:</span> <span class="kv-value">${item.nro_lote}</span></div>
        <div class="kv-row"><span class="kv-key">Vence:</span> <span class="kv-value">${new Date(item.fecha_vencimiento).toLocaleDateString()}</span></div>
      </div>
    `;
        card.addEventListener('click', () => abrirModalDetalle(item));
        refs.gestionCards.appendChild(card);
    });
};

// Abro el modal con los detalles completos del item
const abrirModalDetalle = (item) => {
    const refs = getRefs();
    gestionState.itemEditando = item;

    const detalles = [
        { label: 'Producto', valor: item.nombre_producto },
        { label: 'Laboratorio', valor: item.laboratorio },
        { label: 'Nro. Lote', valor: item.nro_lote },
        { label: 'Vencimiento', valor: new Date(item.fecha_vencimiento).toLocaleDateString() },
        { label: 'Cantidad Actual', valor: item.cantidad_actual },
    ];

    refs.detalleItemContent.innerHTML = detalles
        .map(d => `<p><span class="modal-label">${d.label}:</span> ${d.valor ?? '-'}</p>`)
        .join('');

    refs.modalDetalleItem.hidden = false;
};

// Cierro el modal de detalle
export const cerrarModalDetalle = () => {
    const refs = getRefs();
    refs.modalDetalleItem.hidden = true;
};

// Abro el modal de edición con los datos del item
const abrirModalEdicion = (item) => {
    const refs = getRefs();
    gestionState.itemEditando = item;
    const form = refs.formEdicion;

    // Relleno el formulario con los datos actuales
    form.producto_id.value = item.producto_id;
    form.lote_id.value = item.lote_id;
    form.nombre.value = item.nombre_producto;
    form.laboratorio.value = item.laboratorio || '';
    form.nro_lote.value = item.nro_lote;

    // Formateo la fecha para el input date (YYYY-MM-DD)
    const fecha = new Date(item.fecha_vencimiento);
    form.fecha_vencimiento.value = fecha.toISOString().split('T')[0];
    form.cantidad_actual.value = item.cantidad_actual;

    refs.modalEdicion.hidden = false;
    cerrarModalDetalle();
};

// Cierro el modal de edición
export const cerrarModalEdicion = () => {
    const refs = getRefs();
    gestionState.itemEditando = null;
    refs.modalEdicion.hidden = true;
    refs.formEdicion.reset();
};

// Manejo el submit del formulario de edición
export const manejarSubmitEdicion = async (e) => {
    e.preventDefault();
    const refs = getRefs();
    const formData = new FormData(refs.formEdicion);

    const payload = {
        producto_id: Number(formData.get('producto_id')),
        lote_id: Number(formData.get('lote_id')),
        nombre: formData.get('nombre'),
        laboratorio: formData.get('laboratorio'),
        nro_lote: formData.get('nro_lote'),
        fecha_vencimiento: formData.get('fecha_vencimiento'),
        cantidad_actual: Number(formData.get('cantidad_actual')),
    };

    try {
        await editarItem(payload);
        alert('Item actualizado correctamente');
        cerrarModalEdicion();
        manejarBusqueda(); // Recargo los resultados
    } catch (error) {
        alert('Error al actualizar: ' + error.message);
    }
};

// Manejo la eliminación de un item
const manejarEliminarItem = async (item) => {
    if (!confirm(`¿Estás seguro de eliminar el lote ${item.nro_lote} de ${item.nombre_producto}?`)) {
        return;
    }

    try {
        await eliminarItem(item.lote_id);
        alert('Item eliminado correctamente');
        cerrarModalDetalle();
        manejarBusqueda(); // Recargo los resultados
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
};

// Manejo la eliminación desde el modal de detalle
export const manejarEliminarDesdeDetalle = () => {
    if (gestionState.itemEditando) {
        manejarEliminarItem(gestionState.itemEditando);
    }
};

// Abro el modal de edición desde el modal de detalle
export const abrirEdicionDesdeDetalle = () => {
    if (gestionState.itemEditando) {
        abrirModalEdicion(gestionState.itemEditando);
    }
};
