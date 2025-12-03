import './bootstrap';

// Tema claro/oscuro: cambia la clase root y guarda preferencia.
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const toggle = document.querySelector('[data-theme-toggle]');
    const saved = localStorage.getItem('theme') || 'dark';

    if (saved === 'light') {
        root.classList.add('theme-light');
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isLight = root.classList.toggle('theme-light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
});
