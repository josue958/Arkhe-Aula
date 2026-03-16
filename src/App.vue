<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'
import ToastContainer from '@/components/ToastContainer.vue'

const router = useRouter()
const toast = useToastStore()
const unsavedStore = useUnsavedStore()

onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.onAppClosing(async () => {
      if (unsavedStore.isDirty) {
        const confirmSave = window.confirm('Tienes cambios sin guardar. ¿Deseas guardarlos antes de salir?\nAceptar = Guardar y Salir\nCancelar = Omitir y Salir')
        if (confirmSave) {
          try {
            await unsavedStore.save()
            unsavedStore.setDirty(false)
          } catch(e) {}
        }
      }
      window.electronAPI.forceQuit()
    })
  }

  // Manejo de conexión para auto-sincronización
  window.addEventListener('online', async () => {
    if (window.electronAPI) {
      const config = await window.electronAPI.getCloudSyncConfig()
      if (config && config.enabled && config.autoSync) {
        console.log('[AutoSync] Conexión detectada, iniciando sincronización...')
        await window.electronAPI.syncDatabase()
      }
    }
  })

  // Escuchar eventos del menú de Electron
  if (window.electronAPI) {
    window.electronAPI.onMenuEvent((event: string) => {
      switch (event) {
        case 'menu-new-group':
          router.push('/groups')
          break
        case 'menu-attendance':
          router.push('/attendance')
          break
        case 'menu-grades':
          router.push('/evaluation')
          break
        case 'tablet-connected':
          toast.success('Equipos en sincronización: Tableta conectada correctamente.')
          break
      }
    })
  }
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
