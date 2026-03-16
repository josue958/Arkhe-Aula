<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useLicenseStore } from '@/stores/license'
import LicenseBanner from '@/components/LicenseBanner.vue'
import pkg from '../../package.json'

import draggable from 'vuedraggable'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToastStore()

const defaultNavItems = [
  { path: '/', name: 'dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/groups', name: 'groups', label: 'Grupos', icon: '🏫' },
  { path: '/attendance', name: 'attendance', label: 'Asistencia', icon: '✅' },
  { path: '/planning', name: 'planning', label: 'Seguimiento PDA', icon: '📋' },
  { path: '/evaluation', name: 'evaluation', label: 'Evaluación', icon: '📝' },
  { path: '/behavior', name: 'behavior', label: 'Conducta', icon: '🎭' },
  { path: '/teams', name: 'teams', label: 'Equipos', icon: '🧑‍🤝‍🧑' },
  { path: '/intergroup-activities', name: 'intergroup-activities', label: 'Actividades Intergrupales', icon: '🌐' },
  { path: '/incidents', name: 'incidents', label: 'Incidentes', icon: '⚠️' },
  { path: '/reports', name: 'reports', label: 'Reportes', icon: '📈' },
  { path: '/settings', name: 'settings', label: 'Configuración', icon: '⚙️' },
]

const navItems = ref<{path: string; name: string; label: string; icon: string}[]>([])

onMounted(() => {
  const savedNav = localStorage.getItem('arkhe-nav-order')
  if (savedNav) {
    try {
      const parsed = JSON.parse(savedNav)
      // Asegurarnos que las rutas actuales siguen existiendo en default
      const validParsed = parsed.filter((p: any) => defaultNavItems.some(d => d.path === p.path))
      const missing = defaultNavItems.filter(d => !parsed.some((p: any) => p.path === d.path))
      navItems.value = [...validParsed, ...missing]
    } catch {
      navItems.value = [...defaultNavItems]
    }
  } else {
    navItems.value = [...defaultNavItems]
  }
})

let backupInterval: any

onMounted(() => {
  backupInterval = setInterval(async () => {
    try {
      const autoDb = localStorage.getItem('arkhe-auto-backup-db') === 'true'
      const autoDbPath = localStorage.getItem('arkhe-auto-backup-db-path')
      if (autoDb && autoDbPath) {
        const filePath = `${autoDbPath}/arkhe_db_backup_auto.db`
        // We do a silent export.
        await window.electronAPI.exportDatabase(filePath)
        localStorage.setItem('arkhe-last-backup-db', new Date().toLocaleString())
      }

      const autoProfile = localStorage.getItem('arkhe-auto-backup-profile') === 'true'
      const autoProfilePath = localStorage.getItem('arkhe-auto-backup-profile-path')
      if (autoProfile && autoProfilePath) {
        const filePath = `${autoProfilePath}/arkhe_profile_backup_auto.json`
        await window.electronAPI.exportUserProfile(filePath)
        localStorage.setItem('arkhe-last-backup-profile', new Date().toLocaleString())
      }
    } catch(err) {
      console.error('Auto backup error', err)
    }
  }, 10 * 60 * 1000) // 10 minutes
})

onUnmounted(() => {
  if (backupInterval) clearInterval(backupInterval)
})

function onNavReorder() {
  localStorage.setItem('arkhe-nav-order', JSON.stringify(navItems.value))
}

const adminItems = [
  { path: '/admin', name: 'admin', label: 'Administración', icon: '👥' },
]

const isActive = (item: any) => {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

const sidebarCollapsed = ref(false)


</script>

<template>
  <!-- Barra de arrastre de ventana (macOS): 12px en la parte superior, no bloquea inputs -->
  <div
    style="position: fixed; top: 0; left: 0; right: 0; height: 12px; -webkit-app-region: drag; z-index: 9999; pointer-events: none;"
    aria-hidden="true"
  ></div>

  <!-- Banner de licencia -->
  <LicenseBanner />

  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar-logo" style="padding-top: 48px; -webkit-app-region: no-drag;">
        <img src="@/assets/logo.png" alt="Arkhe Aula" class="sidebar-logo-img" style="width: 32px; height: 32px; filter: drop-shadow(0 0 10px rgba(99,102,241,0.6));" v-if="!sidebarCollapsed" />
        <img src="@/assets/logo.png" alt="Arkhe Aula" class="sidebar-logo-img" style="width: 28px; height: 28px; filter: drop-shadow(0 0 10px rgba(99,102,241,0.6)); margin: 0 auto;" v-else />
        <div class="sidebar-logo-text" v-if="!sidebarCollapsed">
          <h1>Arkhe</h1>
          <span>Sistema Educativo</span>
          <span style="font-size: 10px; font-weight: bold; color: var(--color-terciario); margin-top: 4px; display: block;">v{{ pkg.version }}</span>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-label" v-if="!sidebarCollapsed">Principal</div>
          <draggable 
            v-model="navItems" 
            item-key="name" 
            @end="onNavReorder"
            handle=".nav-item"
            :animation="200"
          >
            <template #item="{ element }">
              <RouterLink
                :to="element.path"
                class="nav-item"
                :class="{ active: isActive(element) }"
              >
                <span class="nav-item-icon">{{ element.icon }}</span>
                <span v-if="!sidebarCollapsed">{{ element.label }}</span>
                <div v-if="!sidebarCollapsed" class="drag-handle" style="margin-left: auto; opacity: 0.3; cursor: grab; font-size: 10px;">☰</div>
              </RouterLink>
            </template>
          </draggable>
        </div>

        <div class="nav-section" v-if="authStore.isAdmin">
          <div class="nav-section-label" v-if="!sidebarCollapsed">Admin</div>
          <RouterLink
            v-for="item in adminItems"
            :key="item.name"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item) }"
          >
            <span class="nav-item-icon">{{ item.icon }}</span>
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Usuario -->
      <div class="sidebar-user" style="padding: 12px; border-top: 1px solid var(--border);">
        <!-- Nombre de usuario -->
        <RouterLink to="/profile" class="nav-item" style="margin-top: 6px; margin-bottom: 4px;">
          <span class="nav-item-icon">👤</span>
          <div v-if="!sidebarCollapsed" style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ authStore.user?.name }}</div>
            <div style="font-size: 11px; color: var(--text-muted);">{{ authStore.user?.role }}</div>
          </div>
        </RouterLink>
        <button class="nav-item btn-ghost w-full" @click="handleLogout" style="width: 100%;">
          <span class="nav-item-icon">🚪</span>
          <span v-if="!sidebarCollapsed">Salir</span>
        </button>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="main-content" style="-webkit-app-region: no-drag;">
      <!-- Topbar -->
      <header class="topbar">
        <button
          class="btn-icon btn btn-ghost"
          @click="sidebarCollapsed = !sidebarCollapsed"
          style="-webkit-app-region: no-drag; margin-right: 16px;"
        >
          ☰
        </button>

        <div style="flex: 1;" />

        <!-- Breadcrumb / título de la página actual -->
        <div style="display: flex; align-items: center; gap: 8px; -webkit-app-region: no-drag;">
          <RouterLink to="/profile" class="btn btn-ghost btn-sm">
            👤 {{ authStore.user?.name }}
          </RouterLink>
        </div>
      </header>

      <!-- Página -->
      <main class="page-content" style="-webkit-app-region: no-drag;">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar.collapsed {
  width: 64px;
}
.sidebar.collapsed .sidebar-logo-text,
.sidebar.collapsed .nav-item span:not(.nav-item-icon),
.sidebar.collapsed .nav-section-label {
  display: none;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

/* Botón sincronizar */
.sync-btn {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius, 8px);
  transition: all 0.2s;
}
.sync-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.4);
}
.sync-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fecha de última sync */
.sync-date-label {
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 12px 6px 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
