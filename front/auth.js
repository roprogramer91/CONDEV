// front/auth.js
// Acá manejo toda la lógica de autenticación y sesión del usuario

import { login as loginApi, setAuthToken } from './api.js';
import { mostrarSeccion, marcarTabActiva, actualizarMensaje } from './ui.js';

const TOKEN_KEY = 'cv-token';

// Estado de autenticación
export const authState = {
    token: null,
};

// Verifico si el usuario está logueado
export const estaLogueado = () => !!authState.token;

// Guardo el token y actualizo la UI
export const setToken = (token) => {
    authState.token = token || null;
    setAuthToken(token || null);

    // Guardo en localStorage
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch (e) {
        // Ignoro errores de storage
    }

    actualizarUIAuth();
};

// Actualizo la interfaz según el estado de autenticación
export const actualizarUIAuth = () => {
    const logged = estaLogueado();
    const btnLogout = document.getElementById('btn-logout');
    const tabsWrapper = document.querySelector('.header-actions');
    const tabs = document.querySelectorAll('.tab-btn');

    if (btnLogout) btnLogout.classList.toggle('hidden', !logged);
    if (tabsWrapper) tabsWrapper.classList.toggle('hidden', !logged);

    tabs.forEach((tab) => {
        tab.disabled = !logged;
    });

    if (!logged) {
        mostrarSeccion('login');
        marcarTabActiva(tabs, '');
    }
};

// Manejo el submit del formulario de login
export const manejarLogin = async (event) => {
    event.preventDefault();

    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');
    const datos = Object.fromEntries(new FormData(formLogin).entries());

    actualizarMensaje(mensajeLogin, 'Verificando credenciales...', 'info');

    try {
        const resp = await loginApi(datos.correo, datos.contrasena);
        setToken(resp.token);
        actualizarMensaje(mensajeLogin, 'Acceso exitoso.', 'exito');
        formLogin.reset();
        mostrarSeccion('resumen');
    } catch (error) {
        actualizarMensaje(mensajeLogin, error.message, 'error');
    }
};

// Cierro sesión
export const manejarLogout = () => {
    const mensajeLogin = document.getElementById('mensaje-login');
    setToken(null);
    actualizarMensaje(mensajeLogin, 'Sesión cerrada.', 'info');
    mostrarSeccion('login');
};

// Cargo el token guardado al iniciar
export const initAuth = () => {
    const tokenGuardado = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

    if (tokenGuardado) {
        setToken(tokenGuardado);
    } else {
        actualizarUIAuth();
    }
};
