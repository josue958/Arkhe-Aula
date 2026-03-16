// Arkhe Aula Web - Main Interactions

// Configuración de GitHub Releases
const GITHUB_REPO = 'josue958/Arkhe-Aula';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Cache para la información de la última versión
let latestReleaseInfo = null;

// Obtener información de la última versión desde GitHub API
async function obtenerUltimaVersion() {
    if (latestReleaseInfo) {
        return latestReleaseInfo;
    }

    try {
        const response = await fetch(GITHUB_API);
        if (!response.ok) {
            throw new Error('Error al obtener la versión');
        }
        const data = await response.json();

        latestReleaseInfo = {
            version: data.tag_name || 'v1.12.8',
            assets: data.assets || []
        };

        // Actualizar el texto del botón con la versión real
        actualizarVersionBotones(latestReleaseInfo.version);

        return latestReleaseInfo;
    } catch (error) {
        console.error('Error al obtener la versión:', error);
        return { version: 'v1.12.8', assets: [] };
    }
}

// Actualizar el texto de los botones con la versión detectada
function actualizarVersionBotones(version) {
    const btnHero = document.getElementById('btn-descarga-hero');
    const notaVersion = document.querySelector('.v-note');

    if (btnHero) {
        btnHero.textContent = `Descargar ${version}`;
    }
    if (notaVersion) {
        notaVersion.innerHTML = `Versión actual: ${version.replace('v', '')} | Incluye soporte para Intel y Apple Silicon.`;
    }
}

// Encontrar el asset correcto según el SO
function encontrarAsset(assets, so) {
    if (!assets || assets.length === 0) {
        return null;
    }

    // Buscar archivos por extensión según el SO
    for (const asset of assets) {
        const name = asset.name.toLowerCase();
        const browserUrl = asset.browser_download_url;

        // Solo archivos gratuitos (excluir versiones premium/paid)
        if (name.includes('premium') || name.includes('paid')) {
            continue;
        }

        if (so === 'windows' && (name.endsWith('.exe') || name.includes('windows') || name.includes('win'))) {
            return browserUrl;
        }
        if (so === 'macos' && (name.endsWith('.dmg') || name.includes('macos') || name.includes('mac') || name.includes('darwin'))) {
            return browserUrl;
        }
    }

    // Fallback: buscar cualquier .exe para Windows o .dmg para macOS
    if (so === 'windows') {
        const exeAsset = assets.find(a => a.name.toLowerCase().endsWith('.exe'));
        if (exeAsset) return exeAsset.browser_download_url;
    }
    if (so === 'macos') {
        const dmgAsset = assets.find(a => a.name.toLowerCase().endsWith('.dmg'));
        if (dmgAsset) return dmgAsset.browser_download_url;
    }

    return null;
}

// Iniciar descarga directa
async function iniciarDescarga(event, soEspecifico) {
    if (event) {
        event.preventDefault();
    }

    const so = soEspecifico || detectarSO();

    // Mostrar estado de carga
    const btnHero = document.getElementById('btn-descarga-hero');
    if (btnHero) {
        btnHero.textContent = 'Preparando descarga...';
        btnHero.style.pointerEvents = 'none';
    }

    try {
        // Obtener información de la última versión
        const releaseInfo = await obtenerUltimaVersion();

        // Encontrar el asset correcto
        const downloadUrl = encontrarAsset(releaseInfo.assets, so);

        if (downloadUrl) {
            // Redirigir directamente a la descarga
            window.location.href = downloadUrl;

            // Restaurar botón después de 2 segundos
            setTimeout(() => {
                if (btnHero) {
                    btnHero.textContent = `Descargar ${releaseInfo.version}`;
                    btnHero.style.pointerEvents = 'auto';
                }
            }, 2000);
        } else {
            // Si no se encuentra el asset, mostrar mensaje y redirigir al releases
            alert('No se encontró una descarga compatible con tu sistema. Te redirigiremos a la página de releases.');
            window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');

            if (btnHero) {
                btnHero.textContent = `Descargar ${releaseInfo.version}`;
                btnHero.style.pointerEvents = 'auto';
            }
        }
    } catch (error) {
        console.error('Error al iniciar descarga:', error);
        alert('Error al obtener la información de descarga. Intenta nuevamente.');

        if (btnHero) {
            btnHero.textContent = 'Descargar';
            btnHero.style.pointerEvents = 'auto';
        }
    }
}

// Detección de Sistema Operativo
function detectarSO() {
    const userAgent = navigator.userAgent || navigator.platform;
    const platform = navigator.platform;

    // Detección más precisa
    if (/Win/.test(userAgent) || platform.includes('Win')) {
        return 'windows';
    } else if (/Mac/.test(userAgent) || platform.includes('Mac')) {
        return 'mac';
    } else if (/Linux/.test(userAgent)) {
        return 'linux';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        return 'ios';
    } else if (/Android/.test(userAgent)) {
        return 'android';
    }
    return 'desconocido';
}

// Actualizar botones de descarga según el SO del usuario
function actualizarDescargas() {
    const so = detectarSO();
    const osDetectedEl = document.getElementById('os-detected');
    const botonesDescarga = document.querySelectorAll('.btn-dl');

    // Actualizar indicador de SO detectado
    if (osDetectedEl) {
        let soIcono = 'iconos/desktop.svg';
        let soNombre = 'Sistema no detectado';
        let soClass = 'detected';

        if (so === 'windows') {
            soIcono = 'iconos/windows.svg';
            soNombre = 'Windows detectado';
        } else if (so === 'mac') {
            soIcono = 'iconos/macos.svg';
            soNombre = 'macOS detectado';
        } else if (so === 'linux') {
            soIcono = 'iconos/linux.svg';
            soNombre = 'Linux detectado';
        } else if (so === 'ios' || so === 'android') {
            soIcono = 'iconos/movil.svg';
            soNombre = 'Dispositivo móvil (no compatible)';
            soClass = '';
        }

        osDetectedEl.className = 'os-detected ' + soClass;
        osDetectedEl.innerHTML = `<img src="${soIcono}" alt="${soNombre}" class="os-icon"> ${soNombre}`;
    }

    // Ocultar/mostrar botones según SO
    botonesDescarga.forEach(boton => {
        const texto = boton.textContent.toLowerCase();
        const parent = boton.parentElement;

        if (so === 'windows') {
            if (texto.includes('mac') || texto.includes('.dmg')) {
                parent.style.opacity = '0.3';
                boton.style.pointerEvents = 'none';
            } else {
                parent.style.opacity = '1';
            }
        } else if (so === 'mac') {
            if (texto.includes('win') || texto.includes('.exe')) {
                parent.style.opacity = '0.3';
                boton.style.pointerEvents = 'none';
            } else {
                parent.style.opacity = '1';
            }
        } else if (so === 'linux') {
            // Linux puede usar Wine o versiones genéricas
            parent.style.opacity = '0.7';
        } else if (so === 'ios' || so === 'android') {
            // Deshabilitar todas las descargas para móviles
            parent.style.opacity = '0.3';
            boton.style.pointerEvents = 'none';
        }
    });
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    actualizarDescargas();
    obtenerUltimaVersion(); // Precargar información de versión
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
