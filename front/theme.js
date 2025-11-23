// front/theme.js
// Acá manejo todo lo relacionado con el tema claro/oscuro de la aplicación

const THEME_KEY = 'cv-theme';

// Aplico el tema seleccionado (light o dark)
export const setTheme = (theme) => {
    const elegido = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = elegido;

    // Guardo la preferencia en localStorage
    try {
        localStorage.setItem(THEME_KEY, elegido);
    } catch (e) {
        // Ignoro errores de storage (modo incógnito, etc)
    }

    // Actualizo el botón de tema
    const btnTheme = document.getElementById('btn-theme');
    const iconTheme = document.getElementById('icon-theme');

    if (btnTheme) {
        btnTheme.setAttribute('aria-label', elegido === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    }

    if (iconTheme) {
        iconTheme.classList.remove('icon-sun', 'icon-moon');
        iconTheme.classList.add(elegido === 'dark' ? 'icon-sun' : 'icon-moon');
    }
};

// Cambio entre tema claro y oscuro
export const toggleTheme = () => {
    const actual = document.documentElement.dataset.theme || 'dark';
    setTheme(actual === 'dark' ? 'light' : 'dark');
};

// Cargo el tema guardado o uso la preferencia del sistema
export const initTheme = () => {
    const preferencia =
        (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY)) ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    setTheme(preferencia || 'dark');
};
