<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'
import pkg from '../../../package.json'

const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const isBridgeReady = ref(false)
const manualIp = ref('')
const machineIdFromMain = ref('Generando...')
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

onMounted(() => {
  // Intentar cargar la IP guardada previamente en este dispositivo
  const savedIp = localStorage.getItem('arke_main_computer_ip')
  if (savedIp) manualIp.value = savedIp

  // Verificar si el bridge está listo
  const check = setInterval(async () => {
    if ((window as any).electronAPI) {
      isBridgeReady.value = true
      // @ts-ignore
      machineIdFromMain.value = await window.electronAPI.getMachineId()
      clearInterval(check)
    }
  }, 500)
})

function connectManual() {
  if (!manualIp.value) return;
  localStorage.setItem('arke_main_computer_ip', manualIp.value)
  // Reiniciar el bridge con la nueva IP (hostname)
  window.location.href = `http://${manualIp.value}:5173`
}

const showRegisterModal = ref(false)
const showResetModal = ref(false)
const saving = ref(false)
const newUser = ref({ name: '', email: '', password: '', role: 'teacher' })
const resetForm = ref({ email: '', newPassword: '', confirmPassword: '' })

async function handleLogin() {
  if (!form.email || !form.password) {
    error.value = 'Por favor ingresa tu correo y contraseña.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await authStore.login(form.email, form.password)
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.message || 'Credenciales incorrectas.'
    }
  } catch (e) {
    if (!isBridgeReady.value && isMobile.value) {
      error.value = 'El iPad no ha logrado enlace con la PC Local. Asegúrate de introducir la IP correcta de la PC principal, la cual sincorniza con la Nube.'
    } else {
      error.value = 'Error al conectar internamente con la base de datos.'
    }
  }
  loading.value = false
}

async function handleRegister() {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    toastStore.warning('Todos los campos son requeridos.')
    return
  }
  saving.value = true
  try {
    // @ts-ignore
    const result = await window.electronAPI.createUser({ ...newUser.value })
    if (result.success) {
      toastStore.success('Usuario registrado correctamente. Ya puede iniciar sesión.')
      showRegisterModal.value = false
      newUser.value = { name: '', email: '', password: '', role: 'teacher' }
    } else {
      toastStore.error(result.message || 'Error al registrar el usuario.')
    }
  } catch (e: any) {
    toastStore.error('Error interno al registrar el usuario: ' + String(e))
  } finally {
    saving.value = false
  }
}

function recuperarClave() {
  showResetModal.value = true
}

async function handleResetPassword() {
  if (!resetForm.value.email || !resetForm.value.newPassword || !resetForm.value.confirmPassword) {
    toastStore.warning('Todos los campos son requeridos.')
    return
  }
  if (resetForm.value.newPassword !== resetForm.value.confirmPassword) {
    toastStore.warning('Las contraseñas no coinciden.')
    return
  }
  saving.value = true
  // @ts-ignore
  const result = await window.electronAPI.resetPassword({ email: resetForm.value.email, newPassword: resetForm.value.newPassword })
  if (result.success) {
    toastStore.success('Contraseña actualizada correctamente. Revisa que puedas iniciar sesión.')
    showResetModal.value = false
    resetForm.value = { email: '', newPassword: '', confirmPassword: '' }
  } else {
    toastStore.error(result.message || 'Error al restablecer la contraseña.')
  }
  saving.value = false
}

async function openReadme() {
  // @ts-ignore
  if (window.electronAPI?.openAdminReadme) {
    // @ts-ignore
    await window.electronAPI.openAdminReadme()
  }
}

const showActivationModal = ref(false)
const activationData = reactive({ email: '', clave: '' })
const isActivating = ref(false)

async function handleActivation() {
  if (!activationData.email || !activationData.clave) {
    toastStore.warning('Por favor ingresa tu correo y clave de activación.')
    return
  }
  isActivating.value = true
  try {
    // @ts-ignore
    const result = await window.electronAPI.activateLicenseServer(activationData.email, activationData.clave)
    if (result.success) {
      toastStore.success(result.message)
      showActivationModal.value = false
    } else {
      toastStore.error(result.message)
    }
  } catch (e: any) {
    toastStore.error('Error al conectar con el servidor de licencias.')
  } finally {
    isActivating.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Fondo decorativo -->
    <div class="login-bg">
      <div class="login-blob blob-1"></div>
      <div class="login-blob blob-2"></div>
    </div>

    <div class="login-container">
      <!-- Logo -->
      <div class="login-logo">
        <img src="@/assets/logo.png" alt="Arkhe Aula" class="login-logo-img" style="width: 80px; height: 80px; filter: drop-shadow(0 0 20px rgba(99,102,241,0.6));" />
        <h1>Arkhe Aula</h1>
        <p>Sistema de Evaluación Docente</p>
      </div>

      <div class="login-auth-options" style="width: 100%; display: flex; flex-direction: column; gap: 12px; margin-bottom: 8px;">
        <button class="btn btn-social btn-google" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: #fff; color: #000; border: 1px solid #ddd;">
          <img src="https://authjs.dev/img/providers/google.svg" width="20" height="20" /> Continuar con Google
        </button>
        <button class="btn btn-social btn-microsoft" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: #2f2f2f; color: #fff;">
          <img src="https://authjs.dev/img/providers/microsoft.svg" width="20" height="20" /> Continuar con Microsoft
        </button>
        <button class="btn btn-social btn-apple" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: #000; color: #fff;">
          <img src="https://authjs.dev/img/providers/apple.svg" width="20" height="20" /> Continuar con Apple
        </button>
      </div>

      <div style="width: 100%; display: flex; align-items: center; gap: 10px; margin: 10px 0;">
        <div style="flex: 1; height: 1px; background: var(--border);"></div>
        <span style="font-size: 12px; color: var(--text-muted);">O con tu correo</span>
        <div style="flex: 1; height: 1px; background: var(--border);"></div>
      </div>

      <!-- Tarjeta de login -->
      <div class="login-card">
        <h2>Iniciar Sesión</h2>
        <p class="login-subtitle">Accede a tu cuenta para continuar</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="admin@arkhe.local"
              autocomplete="email"
              autofocus
            />
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
          </div>

          <div v-if="!loading">
            <div style="margin-top: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span :style="{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isBridgeReady ? 'var(--color-success)' : 'var(--color-warning)',
                  boxShadow: isBridgeReady ? '0 0 8px var(--color-success)' : 'none'
                }"></span>
                <span :style="{ color: isBridgeReady ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '10px', fontWeight: 'bold' }">
                  {{ isBridgeReady ? 'Conectado a Computadora' : 'Estableciendo enlace con Computadora...' }}
                </span>
              </div>

              <!-- Si es iPad y no conecta, permitir meter la IP manual -->
              <div v-if="!isBridgeReady && isMobile" style="margin-top: 12px; width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed var(--border);">
                <p style="font-size: 10px; margin-bottom: 8px; color: var(--text-muted); line-height: 1.3;">
                  ¿Sin enlace? El dispositivo requiere vincularse con la PC principal que hostea la Nube. Ingresa la IP de tu PC anfitriona:
                </p>
                <div style="display: flex; gap: 4px;">
                  <input v-model="manualIp" type="text" placeholder="Ej: 192.168.100.135" class="form-input" style="font-size: 11px; padding: 4px; height: 30px;" />
                  <button @click="connectManual" class="btn btn-primary btn-xs" style="height: 30px;">Forzar Enlace con PC</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="error" class="login-error">
            <span>⚠ {{ error }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            style="justify-content: center; padding: 14px;"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Ingresar</span>
          </button>
        </form>

        <div class="login-actions" style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px; text-align: center;">
          <a href="#" @click.prevent="recuperarClave" class="text-muted" style="font-size: 13px; text-decoration: underline;">¿Olvidaste tu contraseña?</a>
          <button type="button" class="btn btn-ghost" style="width: 100%; justify-content: center; font-size: 14px;" @click="showRegisterModal = true">Registrar nuevo usuario</button>
          <div style="height: 1px; background: var(--border); margin: 8px 0;"></div>
          <button type="button" class="btn btn-outline" style="width: 100%; justify-content: center; font-size: 14px; border: 1px solid var(--color-primary); color: var(--color-primary);" @click="showActivationModal = true">🔑 Activar Licencia de Software</button>
        </div>
      </div>

      <!-- Version & Links -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <button class="btn btn-secondary btn-sm" @click="openReadme()">📄 Léame para Administrador</button>
        <p class="login-version">Arkhe Aula v{{ pkg.version }} — Uso local con sincronización</p>
      </div>

      <!-- Modal: Crear Usuario / Registro -->
      <div v-if="showRegisterModal" class="modal-overlay" @click.self="showRegisterModal = false">
        <div class="modal">
          <div class="modal-header"><h2>Registro de Nuevo Docente/Admin</h2><button class="btn btn-ghost btn-icon" @click="showRegisterModal = false">✕</button></div>
          <div class="flex flex-col gap-4">
            <div class="form-group"><label class="form-label">Nombre Completo</label><input v-model="newUser.name" type="text" class="form-input" placeholder="Nombre del usuario" /></div>
            <div class="form-group"><label class="form-label">Correo Electrónico</label><input v-model="newUser.email" type="email" class="form-input" placeholder="correo@escuela.edu" /></div>
            <div class="form-group"><label class="form-label">Contraseña</label><input v-model="newUser.password" type="password" class="form-input" placeholder="Mínimo 8 caracteres" /></div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select v-model="newUser.role" class="form-select">
                <option value="teacher">👤 Docente</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showRegisterModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="handleRegister" :disabled="saving"><span v-if="saving" class="spinner"></span><span v-else>Registrarse</span></button>
          </div>
        </div>
      </div>

      <!-- Modal: Restablecer Contraseña -->
      <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
        <div class="modal">
          <div class="modal-header"><h2>Restablecer Contraseña</h2><button class="btn btn-ghost btn-icon" @click="showResetModal = false">✕</button></div>
          <div class="flex flex-col gap-4">
            <p class="text-muted text-sm" style="line-height: 1.4;">Ingresa tu correo para asociar la nueva contraseña a tu cuenta de usuario.</p>
            <div class="form-group"><label class="form-label">Correo Electrónico</label><input v-model="resetForm.email" type="email" class="form-input" placeholder="Tu correo de acceso" /></div>
            <div class="form-group"><label class="form-label">Nueva Contraseña</label><input v-model="resetForm.newPassword" type="password" class="form-input" placeholder="Nueva contraseña" /></div>
            <div class="form-group"><label class="form-label">Confirmar Contraseña</label><input v-model="resetForm.confirmPassword" type="password" class="form-input" placeholder="Repite la contraseña" /></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showResetModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="handleResetPassword" :disabled="saving"><span v-if="saving" class="spinner"></span><span v-else>Cambiar Contraseña</span></button>
          </div>
        </div>

      <!-- Modal: Activar Licencia -->
      <div v-if="showActivationModal" class="modal-overlay" @click.self="showActivationModal = false">
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header">
            <h2>Activar Arkhe Aula</h2>
            <button class="btn btn-ghost btn-icon" @click="showActivationModal = false">✕</button>
          </div>
          <div class="flex flex-col gap-4" style="padding: 20px;">
            <p class="text-muted text-sm" style="line-height: 1.4;">Ingresa tu clave de activación recibida por correo para ligar este equipo a tu licencia.</p>
            <div class="form-group">
              <label class="form-label">Correo Asociado</label>
              <input v-model="activationData.email" type="email" class="form-input" placeholder="correo@ejemplo.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Clave de Activación</label>
              <input v-model="activationData.clave" type="text" class="form-input" placeholder="ARKHE-XXXX-XXXX-XXXX" style="letter-spacing: 1px; font-family: monospace;" />
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; font-size: 11px; color: var(--text-muted);">
              ID de Equipo: <code style="color: var(--color-primary);">{{ machineIdFromMain }}</code>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showActivationModal = false">Cerrar</button>
            <button class="btn btn-primary" @click="handleActivation" :disabled="isActivating">
              <span v-if="isActivating" class="spinner"></span>
              <span v-else>Validar y Activar</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: var(--color-primary);
  top: -150px;
  right: -100px;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: var(--color-accent);
  bottom: -100px;
  left: -80px;
}

.login-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.login-logo {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.login-logo-icon {
  font-size: 52px;
  filter: drop-shadow(0 0 20px rgba(99,102,241,0.6));
  margin-bottom: 4px;
}

.login-logo h1 {
  font-size: 2rem;
  font-family: var(--font-display);
  background: linear-gradient(135deg, #818cf8, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.login-logo p {
  color: var(--text-muted);
  font-size: 14px;
}

.login-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.login-card h2 {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.login-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 28px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-error {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: var(--radius);
  padding: 10px 14px;
  color: var(--color-danger);
  font-size: 13px;
}

.login-hint {
  margin-top: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.login-hint code {
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.login-version {
  color: var(--text-muted);
  font-size: 11px;
  text-align: center;
}
</style>
