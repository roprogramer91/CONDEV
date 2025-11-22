import { registrarItem, obtenerAlertas, registrarDevolucion, login as loginApi, setAuthToken, buscarItems, editarItem, eliminarItem } from './api.js';
import { mostrarSeccion, marcarTabActiva, actualizarMensaje, renderizarTabla, renderizarResumen } from './ui.js';

const estado = {
  cargandoAlertas: false,
  alertaSeleccionada: null,
  itemEditando: null,
  modoCantidad: false,
  token: null,
};

const refs = {
  tabs: document.querySelectorAll('.tab-btn'),
  form: document.getElementById('form-carga'),
  mensajeCarga: document.getElementById('mensaje-carga'),
  mensajeAlertas: document.getElementById('mensaje-alertas'),
  contenedorAlertas: document.getElementById('contenedor-alertas'),
  btnRefrescar: document.getElementById('btn-refrescar'),
  mensajeResumen: document.getElementById('mensaje-resumen'),
  contenedorResumen: document.getElementById('resumen-lista'),
  btnResumen: document.getElementById('btn-resumen'),
  modalOverlay: document.getElementById('modal-devolucion'),
  modalContexto: document.getElementById('modal-contexto'),
  modalDetalle: document.getElementById('modal-detalle'),
  modalForm: document.getElementById('form-modal'),
  modalInput: document.getElementById('input-cantidad'),
  modalError: document.getElementById('modal-error'),
  modalClose: document.querySelector('[data-modal-close]'),
  modalCancel: document.querySelector('[data-modal-cancel]'),
  btnTheme: document.getElementById('btn-theme'),
  iconTheme: document.getElementById('icon-theme'),
  btnHabilitar: document.getElementById('btn-habilitar-devolucion'),
  formLogin: document.getElementById('form-login'),
  mensajeLogin: document.getElementById('mensaje-login'),
  btnLogout: document.getElementById('btn-logout'),
  tabsWrapper: document.querySelector('.tabs'),
  // Referencias Gestión
  inputBusqueda: document.getElementById('input-busqueda'),
  btnBuscar: document.getElementById('btn-buscar'),
  tablaGestionBody: document.getElementById('tabla-gestion-body'),
  mensajeGestion: document.getElementById('mensaje-gestion'),
  gestionCards: document.getElementById('gestion-cards'),
  // Modal Edición
  modalEdicion: document.getElementById('modal-edicion'),
  formEdicion: document.getElementById('form-edicion'),
  btnCerrarEdicion: document.querySelector('[data-modal-close-edit]'),
  btnCancelarEdicion: document.querySelector('[data-modal-cancel-edit]'),
  // Modal Detalle Item
  modalDetalleItem: document.getElementById('modal-detalle-item'),
  detalleItemContent: document.getElementById('detalle-item-content'),
  btnEditarDetalle: document.getElementById('btn-editar-detalle'),
  btnEliminarDetalle: document.getElementById('btn-eliminar-detalle'),
  btnCerrarDetalle: document.querySelector('[data-modal-close-detalle]'),
};

const THEME_KEY = 'cv-theme';
const TOKEN_KEY = 'cv-token';

const setTheme = (theme) => {
  const elegido = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = elegido;
  try {
    localStorage.setItem(THEME_KEY, elegido);
  } catch (e) {
    // ignore storage errors
  }
  if (refs.btnTheme) {
    refs.btnTheme.setAttribute('aria-label', elegido === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
  }
  if (refs.iconTheme) {
    refs.iconTheme.classList.remove('icon-sun', 'icon-moon');
    refs.iconTheme.classList.add(elegido === 'dark' ? 'icon-sun' : 'icon-moon');
  }
};

const toggleCamposCantidad = (activar) => {
  estado.modoCantidad = activar;
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

const toggleTheme = () => {
  const actual = document.documentElement.dataset.theme || 'dark';
  setTheme(actual === 'dark' ? 'light' : 'dark');
};

const estaLogueado = () => !!estado.token;

const actualizarUIAuth = () => {
  const logged = estaLogueado();
  if (refs.btnLogout) refs.btnLogout.classList.toggle('hidden', !logged);
  if (refs.tabsWrapper) refs.tabsWrapper.classList.toggle('hidden', !logged);
  refs.tabs.forEach((tab) => {
    tab.disabled = !logged;
  });
  if (!logged) {
    mostrarSeccion('login');
    marcarTabActiva(refs.tabs, '');
  }
};

const setToken = (token) => {
  estado.token = token || null;
  setAuthToken(token || null);
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // ignore storage errors
  }
  actualizarUIAuth();
};

const cambiarSeccion = (nombre) => {
  if (!estaLogueado() && nombre !== 'login') {
    nombre = 'login';
  }
  mostrarSeccion(nombre);
  marcarTabActiva(refs.tabs, nombre);
  if (nombre === 'resumen') {
    cargarResumen();
  }
  if (nombre === 'alertas') {
    cargarAlertas();
  }
};

const manejarSubmitCarga = async (event) => {
  event.preventDefault();
  if (!estaLogueado()) {
    actualizarMensaje(refs.mensajeCarga, 'Inicia sesion para cargar items.', 'error');
    return;
  }
  const datos = Object.fromEntries(new FormData(refs.form).entries());
  const payload = {
    ...datos,
    cantidad_actual: Number(datos.cantidad_actual),
  };

  actualizarMensaje(refs.mensajeCarga, 'Enviando datos...', 'info');
  try {
    await registrarItem(payload);
    actualizarMensaje(refs.mensajeCarga, 'Item registrado con exito.', 'exito');
    refs.form.reset();
  } catch (error) {
    actualizarMensaje(refs.mensajeCarga, error.message, 'error');
  }
};

const cargarAlertas = async () => {
  if (!estaLogueado()) {
    actualizarMensaje(refs.mensajeAlertas, 'Inicia sesion para ver alertas.', 'info');
    return;
  }
  if (estado.cargandoAlertas) return;
  estado.cargandoAlertas = true;
  actualizarMensaje(refs.mensajeAlertas, 'Cargando alertas...', 'info');
  try {
    const alertas = await obtenerAlertas();
    renderizarTabla(alertas, refs.contenedorAlertas, abrirModalDevolucion);
    actualizarMensaje(refs.mensajeAlertas, `Alertas actualizadas (${alertas.length})`, 'exito');
  } catch (error) {
    actualizarMensaje(refs.mensajeAlertas, error.message, 'error');
  } finally {
    estado.cargandoAlertas = false;
  }
};

const cargarResumen = async () => {
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

async function manejarDevolucion(loteId, cantidad) {
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
}

const limpiarModal = () => {
  if (refs.modalInput) refs.modalInput.value = '';
  if (refs.modalError) refs.modalError.textContent = '';
  estado.modoCantidad = false;
  toggleCamposCantidad(false);
};

const cerrarModal = () => {
  estado.alertaSeleccionada = null;
  if (refs.modalOverlay) refs.modalOverlay.hidden = true;
  limpiarModal();
};

const abrirModalDevolucion = (alerta) => {
  estado.alertaSeleccionada = alerta;
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

const manejarSubmitModal = async (event) => {
  event.preventDefault();
  if (!estado.alertaSeleccionada) return;
  const cantidad = Number(refs.modalInput?.value);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    if (refs.modalError) refs.modalError.textContent = 'Ingresa un numero mayor a cero.';
    return;
  }
  if (refs.modalError) refs.modalError.textContent = '';
  const ok = await manejarDevolucion(estado.alertaSeleccionada.lote_id, cantidad);
  if (ok) {
    cerrarModal();
  } else if (refs.modalError) {
    refs.modalError.textContent = 'No se pudo registrar la devolucion.';
  }
};

// --- LÓGICA DE GESTIÓN ---

const manejarBusqueda = async () => {
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
      actualizarMensaje(refs.mensajeGestion, '', ''); // Limpiar mensaje
    }
  } catch (error) {
    actualizarMensaje(refs.mensajeGestion, error.message, 'error');
  }
};

const renderTablaGestion = (items) => {
  // Renderizar Tabla (Desktop)
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

    // Event Listeners para botones
    const btnEditar = tr.querySelector('.editar');
    btnEditar.addEventListener('click', (e) => { e.stopPropagation(); abrirModalEdicion(item); });

    const btnEliminar = tr.querySelector('.eliminar');
    btnEliminar.addEventListener('click', (e) => { e.stopPropagation(); manejarEliminarItem(item); });

    const btnDetalle = tr.querySelector('.link-cell');
    btnDetalle.addEventListener('click', () => abrirModalDetalle(item));

    refs.tablaGestionBody.appendChild(tr);
  });

  // Renderizar Cards (Mobile)
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

const abrirModalDetalle = (item) => {
  estado.itemEditando = item;

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

const cerrarModalDetalle = () => {
  refs.modalDetalleItem.hidden = true;
};

const abrirModalEdicion = (item) => {
  estado.itemEditando = item;
  const form = refs.formEdicion;

  // Rellenar formulario
  form.producto_id.value = item.producto_id;
  form.lote_id.value = item.lote_id;
  form.nombre.value = item.nombre_producto;
  form.laboratorio.value = item.laboratorio || '';
  form.nro_lote.value = item.nro_lote;
  // Formatear fecha para input date (YYYY-MM-DD)
  const fecha = new Date(item.fecha_vencimiento);
  form.fecha_vencimiento.value = fecha.toISOString().split('T')[0];
  form.cantidad_actual.value = item.cantidad_actual;

  refs.modalEdicion.hidden = false;
  cerrarModalDetalle(); // Cerrar detalle si estaba abierto
};

const cerrarModalEdicion = () => {
  estado.itemEditando = null;
  refs.modalEdicion.hidden = true;
  refs.formEdicion.reset();
};

const manejarSubmitEdicion = async (e) => {
  e.preventDefault();
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
    manejarBusqueda(); // Recargar tabla
  } catch (error) {
    alert('Error al actualizar: ' + error.message);
  }
};

const manejarEliminarItem = async (item) => {
  if (!confirm(`¿Estás seguro de eliminar el lote ${item.nro_lote} de ${item.nombre_producto}?`)) {
    return;
  }

  try {
    await eliminarItem(item.lote_id);
    alert('Item eliminado correctamente');
    cerrarModalDetalle();
    manejarBusqueda(); // Recargar tabla
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
};

const iniciar = () => {
  const preferencia =
    (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  setTheme(preferencia || 'dark');

  const tokenGuardado = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (tokenGuardado) {
    setToken(tokenGuardado);
  } else {
    actualizarUIAuth();
  }

  refs.tabs.forEach((tab) => {
    tab.addEventListener('click', () => cambiarSeccion(tab.dataset.seccion));
  });

  if (refs.form) {
    refs.form.addEventListener('submit', manejarSubmitCarga);
  }

  if (refs.btnRefrescar) {
    refs.btnRefrescar.addEventListener('click', () => cargarAlertas());
  }
  if (refs.btnResumen) {
    refs.btnResumen.addEventListener('click', () => cargarResumen());
  }

  // Listeners Gestión
  if (refs.btnBuscar) {
    refs.btnBuscar.addEventListener('click', manejarBusqueda);
  }
  if (refs.inputBusqueda) {
    refs.inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') manejarBusqueda();
    });
  }
  if (refs.formEdicion) {
    refs.formEdicion.addEventListener('submit', manejarSubmitEdicion);
  }
  if (refs.btnCerrarEdicion) {
    refs.btnCerrarEdicion.addEventListener('click', cerrarModalEdicion);
  }
  if (refs.btnCancelarEdicion) {
    refs.btnCancelarEdicion.addEventListener('click', cerrarModalEdicion);
  }
  // Listeners Modal Detalle
  if (refs.btnCerrarDetalle) {
    refs.btnCerrarDetalle.addEventListener('click', cerrarModalDetalle);
  }
  if (refs.btnEditarDetalle) {
    refs.btnEditarDetalle.addEventListener('click', () => {
      if (estado.itemEditando) abrirModalEdicion(estado.itemEditando);
    });
  }
  if (refs.btnEliminarDetalle) {
    refs.btnEliminarDetalle.addEventListener('click', () => {
      if (estado.itemEditando) manejarEliminarItem(estado.itemEditando);
    });
  }

  const btnTestEmail = document.getElementById('btn-test-email');
  if (btnTestEmail) {
    btnTestEmail.addEventListener('click', async () => {
      if (!estaLogueado()) {
        actualizarMensaje(refs.mensajeAlertas, 'Inicia sesión para probar emails.', 'error');
        return;
      }
      actualizarMensaje(refs.mensajeAlertas, 'Disparando test de email...', 'info');
      try {
        const { triggerTestEmail } = await import('./api.js');
        const res = await triggerTestEmail();
        actualizarMensaje(refs.mensajeAlertas, res.mensaje || 'Test finalizado.', 'exito');
      } catch (error) {
        actualizarMensaje(refs.mensajeAlertas, error.message, 'error');
      }
    });
  }

  if (refs.btnTheme) {
    refs.btnTheme.addEventListener('click', toggleTheme);
  }

  if (refs.formLogin) {
    refs.formLogin.addEventListener('submit', async (event) => {
      event.preventDefault();
      const datos = Object.fromEntries(new FormData(refs.formLogin).entries());
      actualizarMensaje(refs.mensajeLogin, 'Verificando credenciales...', 'info');
      try {
        const resp = await loginApi(datos.correo, datos.contrasena);
        setToken(resp.token);
        actualizarMensaje(refs.mensajeLogin, 'Acceso exitoso.', 'exito');
        refs.formLogin.reset();
        cambiarSeccion('resumen');
      } catch (error) {
        actualizarMensaje(refs.mensajeLogin, error.message, 'error');
      }
    });
  }

  if (refs.btnLogout) {
    refs.btnLogout.addEventListener('click', () => {
      setToken(null);
      actualizarMensaje(refs.mensajeLogin, 'Sesión cerrada.', 'info');
      cambiarSeccion('login');
    });
  }

  if (refs.modalForm) {
    refs.modalForm.addEventListener('submit', manejarSubmitModal);
  }
  if (refs.btnHabilitar) {
    refs.btnHabilitar.addEventListener('click', () => toggleCamposCantidad(true));
  }
  if (refs.modalClose) {
    refs.modalClose.addEventListener('click', cerrarModal);
  }
  if (refs.modalCancel) {
    refs.modalCancel.addEventListener('click', cerrarModal);
  }
  if (refs.modalOverlay) {
    refs.modalOverlay.addEventListener('click', (event) => {
      if (event.target === refs.modalOverlay) cerrarModal();
    });
    refs.modalOverlay.setAttribute('hidden', '');
  }

  cambiarSeccion(estaLogueado() ? 'resumen' : 'login');
};

document.addEventListener('DOMContentLoaded', iniciar);
