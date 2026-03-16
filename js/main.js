// Arkhe Aula Web - Main Interactions

// Detección de Sistema Operativo
function detectarSO() {
    const userAgent = navigator.userAgent || navigator.platform;

    if (/Win/.test(userAgent)) {
        return 'windows';
    } else if (/Mac/.test(userAgent)) {
        return 'mac';
    }
    return 'desconocido';
}

// Actualizar botones de descarga según el SO del usuario
function actualizarDescargas() {
    const so = detectarSO();
    const botonesDescarga = document.querySelectorAll('.btn-dl');

    botonesDescarga.forEach(boton => {
        const texto = boton.textContent.toLowerCase();

        if (so === 'windows' && texto.includes('mac')) {
            boton.style.display = 'none';
            boton.parentElement.style.opacity = '0.5';
        } else if (so === 'mac' && texto.includes('win')) {
            boton.style.display = 'none';
            boton.parentElement.style.opacity = '0.5';
        }
    });

    // Mostrar indicador del SO detectado
    const notaVersion = document.querySelector('.v-note');
    if (notaVersion && so !== 'desconocido') {
        const soIcono = so === 'windows' ? '' : '';
        const soNombre = so === 'windows' ? 'Windows' : 'macOS';
        notaVersion.innerHTML = `${soIcono} SO detectado: ${soNombre} | Versión actual: 1.12.8 | Incluye soporte para Intel y Apple Silicon.`;
    }
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    actualizarDescargas();
});

// Scroll suave para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fixed Header on Scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.padding = '0.5rem 0';
        header.style.background = 'rgba(3, 7, 18, 0.95)';
    } else {
        header.style.padding = '1rem 0';
        header.style.background = 'rgba(3, 7, 18, 0.8)';
    }
});
