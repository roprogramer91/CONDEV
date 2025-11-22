import { registrarItem, obtenerAlertas, registrarDevolucion } from './api.js';
import { mostrarSeccion, marcarTabActiva, actualizarMensaje, renderizarTabla, renderizarResumen } from './ui.js';

const estado = {
  cargandoAlertas: false,
  alertaSeleccionada: null,
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
  modalForm: document.getElementById('form-modal'),
  modalInput: document.getElementById('input-cantidad'),
  modalError: document.getElementById('modal-error'),
  modalClose: document.querySelector('[data-modal-close]'),
  modalCancel: document.querySelector('[data-modal-cancel]'),
  btnTheme: document.getElementById('btn-theme'),
};

const THEME_KEY = 'cv-theme';

const setTheme = (theme) => {
  const elegido = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = elegido;
  try {
    localStorage.setItem(THEME_KEY, elegido);
  } catch (e) {
    // ignore storage errors
  }
  if (refs.btnTheme) {
    refs.btnTheme.innerText = elegido === 'dark' ? '☀️' : '🌙';
    refs.btnTheme.setAttribute('aria-label', elegido === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
  }
};

const toggleTheme = () => {
  const actual = document.documentElement.dataset.theme || 'dark';
  setTheme(actual === 'dark' ? 'light' : 'dark');
};

const cambiarSeccion = (nombre) => {
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
  if (refs.modalOverlay) refs.modalOverlay.hidden = false;
  limpiarModal();
  if (refs.modalInput) refs.modalInput.focus();
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

const iniciar = () => {
  const preferencia =
    (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  setTheme(preferencia || 'dark');

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

  if (refs.btnTheme) {
    refs.btnTheme.addEventListener('click', toggleTheme);
  }

  if (refs.modalForm) {
    refs.modalForm.addEventListener('submit', manejarSubmitModal);
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

  cambiarSeccion('resumen');
};

document.addEventListener('DOMContentLoaded', iniciar);
