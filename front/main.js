// front/main.js
// Punto de entrada principal del frontend
// Acá coordino todos los módulos e inicializo la aplicación

import { mostrarSeccion, marcarTabActiva, actualizarMensaje } from './ui.js';
import { initTheme, toggleTheme } from './theme.js';
import { initAuth, estaLogueado, manejarLogin, manejarLogout } from './auth.js';
import { cargarAlertas, cargarResumen, manejarSubmitCarga, cerrarModal, toggleCamposCantidad, manejarSubmitModal } from './alertas.js';
import { manejarBusqueda, cerrarModalEdicion, cerrarModalDetalle, manejarSubmitEdicion, manejarEliminarDesdeDetalle, abrirEdicionDesdeDetalle } from './gestion.js';

// Cambio de sección con lógica de carga automática
const cambiarSeccion = (nombre) => {
  // Si no está logueado, lo mando al login
  if (!estaLogueado() && nombre !== 'login') {
    nombre = 'login';
  }

  const tabs = document.querySelectorAll('.tab-btn');
  mostrarSeccion(nombre);
  marcarTabActiva(tabs, nombre);

  // Cargo datos automáticamente según la sección
  if (nombre === 'resumen') {
    cargarResumen();
  }
  if (nombre === 'alertas') {
    cargarAlertas();
  }
};

// Inicializo la aplicación cuando el DOM está listo
const iniciar = () => {
  // Inicializo tema y autenticación
  initTheme();
  initAuth();

  // Referencias a elementos del DOM
  const tabs = document.querySelectorAll('.tab-btn');
  const form = document.getElementById('form-carga');
  const btnRefrescar = document.getElementById('btn-refrescar');
  const btnResumen = document.getElementById('btn-resumen');
  const btnBuscar = document.getElementById('btn-buscar');
  const inputBusqueda = document.getElementById('input-busqueda');
  const formEdicion = document.getElementById('form-edicion');
  const btnCerrarEdicion = document.querySelector('[data-modal-close-edit]');
  const btnCancelarEdicion = document.querySelector('[data-modal-cancel-edit]');
  const btnCerrarDetalle = document.querySelector('[data-modal-close-detalle]');
  const btnEditarDetalle = document.getElementById('btn-editar-detalle');
  const btnEliminarDetalle = document.getElementById('btn-eliminar-detalle');
  const btnTestEmail = document.getElementById('btn-test-email');
  const btnTheme = document.getElementById('btn-theme');
  const formLogin = document.getElementById('form-login');
  const btnLogout = document.getElementById('btn-logout');
  const modalForm = document.getElementById('form-modal');
  const btnHabilitar = document.getElementById('btn-habilitar-devolucion');
  const modalClose = document.querySelector('[data-modal-close]');
  const modalCancel = document.querySelector('[data-modal-cancel]');
  const modalOverlay = document.getElementById('modal-devolucion');

  // Event listeners para navegación entre secciones
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => cambiarSeccion(tab.dataset.seccion));
  });

  // Event listeners para carga de items
  if (form) {
    form.addEventListener('submit', manejarSubmitCarga);
  }

  // Event listeners para alertas
  if (btnRefrescar) {
    btnRefrescar.addEventListener('click', () => cargarAlertas());
  }
  if (btnResumen) {
    btnResumen.addEventListener('click', () => cargarResumen());
  }

  // Event listeners para gestión de inventario
  if (btnBuscar) {
    btnBuscar.addEventListener('click', manejarBusqueda);
  }
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') manejarBusqueda();
    });
  }
  if (formEdicion) {
    formEdicion.addEventListener('submit', manejarSubmitEdicion);
  }
  if (btnCerrarEdicion) {
    btnCerrarEdicion.addEventListener('click', cerrarModalEdicion);
  }
  if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener('click', cerrarModalEdicion);
  }

  // Event listeners para modal de detalle
  if (btnCerrarDetalle) {
    btnCerrarDetalle.addEventListener('click', cerrarModalDetalle);
  }
  if (btnEditarDetalle) {
    btnEditarDetalle.addEventListener('click', abrirEdicionDesdeDetalle);
  }
  if (btnEliminarDetalle) {
    btnEliminarDetalle.addEventListener('click', manejarEliminarDesdeDetalle);
  }

  // Event listener para test de email
  if (btnTestEmail) {
    btnTestEmail.addEventListener('click', async () => {
      if (!estaLogueado()) {
        const mensajeAlertas = document.getElementById('mensaje-alertas');
        actualizarMensaje(mensajeAlertas, 'Inicia sesión para probar emails.', 'error');
        return;
      }

      const mensajeAlertas = document.getElementById('mensaje-alertas');
      actualizarMensaje(mensajeAlertas, 'Disparando test de email...', 'info');

      try {
        const { triggerTestEmail } = await import('./api.js');
        const res = await triggerTestEmail();
        actualizarMensaje(mensajeAlertas, res.mensaje || 'Test finalizado.', 'exito');
      } catch (error) {
        actualizarMensaje(mensajeAlertas, error.message, 'error');
      }
    });
  }

  // Event listener para cambio de tema
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);
  }

  // Event listeners para autenticación
  if (formLogin) {
    formLogin.addEventListener('submit', manejarLogin);
  }
  if (btnLogout) {
    btnLogout.addEventListener('click', manejarLogout);
  }

  // Event listeners para modal de devolución
  if (modalForm) {
    modalForm.addEventListener('submit', manejarSubmitModal);
  }
  if (btnHabilitar) {
    btnHabilitar.addEventListener('click', () => toggleCamposCantidad(true));
  }
  if (modalClose) {
    modalClose.addEventListener('click', cerrarModal);
  }
  if (modalCancel) {
    modalCancel.addEventListener('click', cerrarModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) cerrarModal();
    });
    modalOverlay.setAttribute('hidden', '');
  }

  // Muestro la sección inicial (resumen si está logueado, login si no)
  cambiarSeccion(estaLogueado() ? 'resumen' : 'login');
};

// Inicio la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', iniciar);
