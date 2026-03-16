<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const saving = ref(false)
const version = ref('')
const platform = ref('')
const autoUpdateEnabled = ref(false)
const checkingUpdate = ref(false)
const updateAvailable = ref(false)
const updateInfo = ref<any>(null)
const lastUpdateCheck = ref<string>('')
const updateStatus = ref<'success' | 'error' | 'available' | ''>('')

onMounted(async () => {
  if (window.electronAPI) {
    version.value = await window.electronAPI.getAppVersion()
    platform.value = await window.electronAPI.getPlatform()
    
    // Cargar configuración de actualizaciones automáticas
    const config = await window.electronAPI.getAutoUpdateConfig()
    autoUpdateEnabled.value = config.enabled || false
    
    // Verificar actualizaciones al inicio si está activado
    if (autoUpdateEnabled.value) {
      await checkForUpdates(true)
    }
  }
})

async function toggleAutoUpdate() {
  autoUpdateEnabled.value = !autoUpdateEnabled.value
  const result = await window.electronAPI.saveAutoUpdateConfig(autoUpdateEnabled.value)
  
  if (result.success) {
    toast.success(
      autoUpdateEnabled.value 
        ? 'Actualizaciones automáticas activadas' 
        : 'Actualizaciones automáticas desactivadas'
    )
    
    // Si se acaba de activar, verificar inmediatamente
    if (autoUpdateEnabled.value) {
      await checkForUpdates(true)
    }
  } else {
    toast.error('Error al guardar la configuración')
    autoUpdateEnabled.value = !autoUpdateEnabled.value // Revertir
  }
}

async function checkForUpdates(silent = false) {
  checkingUpdate.value = true
  lastUpdateCheck.value = ''
  updateStatus.value = ''

  try {
    const result = await window.electronAPI.checkForUpdates()
    console.log('[Profile] Resultado de checkForUpdates:', result)

    if (result.success) {
      if (!result.updateFound) {
        lastUpdateCheck.value = `✅ No hay actualizaciones disponibles. Versión actual: v${version.value}`
        updateStatus.value = 'success'
        if (!silent) {
          toast.info('No hay actualizaciones disponibles')
        }
      } else {
        lastUpdateCheck.value = `🎉 Nueva versión disponible: v${result.version || 'disponible'}`
        updateStatus.value = 'available'
        if (!silent) {
          toast.success(`Nueva versión disponible: ${result.version || 'disponible'}`)
        }
        // Si hay actualizaciones, la ventana nativa de descargas de Electron se encargará de mostrarla mediante sus eventos.
      }
    } else {
      console.error('[Profile] Error en checkForUpdates:', result)
      lastUpdateCheck.value = `❌ Error: ${result.message || result.error || 'No se pudo conectar al servidor'}`
      updateStatus.value = 'error'
      if (!silent) {
        toast.error('Error al verificar: ' + (result.message || result.error || 'Desconocido'))
      }
    }
  } catch (error) {
    console.error('[Profile] Excepción en checkForUpdates:', error)
    lastUpdateCheck.value = `❌ Error: ${error.message || String(error)}`
    updateStatus.value = 'error'
    if (!silent) {
      toast.error('Error al buscar actualizaciones: ' + (error.message || String(error)))
    }
  } finally {
    checkingUpdate.value = false
  }
}

async function changePassword() {
  if (!form.value.currentPassword || !form.value.newPassword) {
    toast.warning('Completa todos los campos.')
    return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.error('Las contraseñas nuevas no coinciden.')
    return
  }
  if (form.value.newPassword.length < 6) {
    toast.warning('La nueva contraseña debe tener al menos 6 caracteres.')
    return
  }
  saving.value = true
  const result = await window.electronAPI.changePassword({
    currentPassword: form.value.currentPassword,
    newPassword: form.value.newPassword,
  })
  if (result.success) {
    toast.success('Contraseña actualizada correctamente.')
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } else {
    toast.error(result.message || 'Error al cambiar la contraseña.')
  }
  saving.value = false
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Mi Perfil</h2>
    </div>

    <div class="grid-2" style="gap: 24px;">
      <!-- Info de usuario -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); display: flex; align-items: center; justify-content: center; font-size: 28px;">
            {{ authStore.user?.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <h3 style="margin-bottom: 4px;">{{ authStore.user?.name }}</h3>
            <p class="text-muted" style="font-size: 13px;">{{ authStore.user?.email }}</p>
            <span class="badge badge-primary" style="margin-top: 6px;">
              {{ authStore.user?.role === 'admin' ? '👑 Administrador' : '👤 Docente' }}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Versión de la app</span>
            <span style="font-weight: 600;">v{{ version }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Sistema operativo</span>
            <span>{{ platform === 'darwin' ? '🍎 macOS' : platform === 'win32' ? '🪟 Windows' : platform }}</span>
          </div>
          
          <!-- Actualizaciones automáticas -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div>
              <span style="display: block; font-weight: 500;">Actualizaciones automáticas</span>
              <span class="text-muted" style="font-size: 11px;">Buscar al iniciar la app</span>
            </div>
            <!-- Toggle Switch estilo iPhone -->
            <button
              class="toggle-switch"
              :class="{ 'toggle-on': autoUpdateEnabled }"
              @click="toggleAutoUpdate"
              :disabled="checkingUpdate"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>

          <!-- Estado de actualizaciones -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div>
              <span style="display: block; font-weight: 500;">Actualizaciones desde GitHub</span>
              <span class="text-muted" style="font-size: 11px;">github.com/josue958/Arkhe-Aula</span>
            </div>
            <button
              class="btn btn-sm btn-ghost"
              @click="checkForUpdates(false)"
              :disabled="checkingUpdate"
              style="gap: 6px;"
              title="Verificar actualizaciones"
            >
              <span v-if="checkingUpdate" class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
              <span v-else>🔄</span>
              <span v-if="checkingUpdate">Verificando...</span>
              <span v-else>Verificar</span>
            </button>
          </div>

          <!-- Mensaje de estado de actualizaciones -->
          <div v-if="lastUpdateCheck" style="font-size: 12px; padding: 8px 12px; background: var(--bg-elevated); border-radius: var(--radius); margin-top: 8px;">
            <span :class="updateStatus === 'error' ? 'text-danger' : updateStatus === 'available' ? 'text-success' : 'text-muted'">
              {{ lastUpdateCheck }}
            </span>
          </div>
        </div>

        <button class="btn btn-danger" style="width: 100%; justify-content: center; margin-top: 24px;" @click="logout">
          🚪 Cerrar Sesión
        </button>
      </div>

      <!-- Cambiar contraseña -->
      <div class="card">
        <h3 style="margin-bottom: 20px;">Cambiar Contraseña</h3>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Contraseña Actual</label>
            <input v-model="form.currentPassword" type="password" class="form-input" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label">Nueva Contraseña</label>
            <input v-model="form.newPassword" type="password" class="form-input" placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar Nueva Contraseña</label>
            <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="Repite la nueva contraseña" />
          </div>
        </div>
        <div style="margin-top: 20px;">
          <button class="btn btn-primary" @click="changePassword" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>🔐 Actualizar Contraseña</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toggle Switch estilo iPhone */
.toggle-switch {
  position: relative;
  width: 51px;
  height: 31px;
  background-color: #e5e7eb;
  border: none;
  border-radius: 31px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 0;
  display: inline-flex;
  align-items: center;
}

.toggle-switch:hover {
  background-color: #d1d5db;
}

.toggle-switch.toggle-on {
  background-color: var(--color-secondary, #1B9AAA);
}

.toggle-switch.toggle-on:hover {
  background-color: #168a9a;
}

.toggle-switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 25px;
  height: 25px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toggle-switch.toggle-on .toggle-knob {
  transform: translateX(20px);
}
</style>
