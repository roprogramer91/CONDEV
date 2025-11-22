import { registrarItem, obtenerAlertas, registrarDevolucion, login as loginApi, setAuthToken } from './api.js';
import { mostrarSeccion, marcarTabActiva, actualizarMensaje, renderizarTabla, renderizarResumen } from './ui.js';

const estado = {
  cargandoAlertas: false,
  alertaSeleccionada: null,
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
    // Mostrar el icono del modo al que se cambiará
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
