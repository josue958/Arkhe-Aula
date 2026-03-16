<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const stats = ref({
  groups: 0,
  students: 0,
  totalAttendances: 0,
})
const school = ref<any>(null)

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)

async function handleSearch() {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  try {
    searchResults.value = await window.electronAPI.dashboardStudentSearch(searchQuery.value)
  } catch (err) {
    console.error(err)
  }
  searchLoading.value = false
}

onMounted(async () => {
  try {
    school.value = await window.electronAPI.getSchool()
    const groups = await window.electronAPI.getGroups()
    stats.value.groups = groups.length

    let totalStudents = 0
    groups.forEach((g: any) => { totalStudents += g.students_count || 0 })
    stats.value.students = totalStudents
  } catch (e) {
    console.error('Error loading dashboard:', e)
  }
  loading.value = false
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">
          Bienvenido, {{ authStore.user?.name }} •
          <span v-if="school">{{ school.name }}</span>
        </p>
      </div>
    </div>

    <!-- Skeleton / loading -->
    <div v-if="loading" class="stats-grid mb-4">
      <div v-for="i in 3" :key="i" class="stat-card" style="animation: pulse 1.5s infinite;">
        <div style="height: 32px; width: 60%; background: var(--border); border-radius: 6px;"></div>
        <div style="height: 16px; width: 40%; background: var(--border); border-radius: 4px; margin-top: 8px;"></div>
      </div>
    </div>

    <!-- Stats -->
    <div v-else class="stats-grid" style="margin-bottom: 28px;">
      <div class="stat-card card--glow" @click="navigateTo('/groups')" style="cursor: pointer;">
        <div style="font-size: 28px; margin-bottom: 4px;">🏫</div>
        <div class="stat-card-value">{{ stats.groups }}</div>
        <div class="stat-card-label">Grupos Activos</div>
      </div>
      <div class="stat-card card--glow" @click="navigateTo('/groups')" style="cursor: pointer;">
        <div style="font-size: 28px; margin-bottom: 4px;">👨‍🎓</div>
        <div class="stat-card-value">{{ stats.students }}</div>
        <div class="stat-card-label">Alumnos Totales</div>
      </div>
      <div class="stat-card card--glow" @click="navigateTo('/attendance?filter=today_pending')" style="cursor: pointer;">
        <div style="font-size: 28px; margin-bottom: 4px;">✅</div>
        <div class="stat-card-value">Hoy</div>
        <div class="stat-card-label">Tomar Asistencia</div>
      </div>
    </div>

    <!-- Buscador Avanzado Estudiantil -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 16px; font-size: 1rem; color: var(--text-secondary);">Búsqueda de Alumnos</h3>
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <input 
          v-model="searchQuery" 
          @keyup.enter="handleSearch"
          type="text" 
          placeholder="Buscar por nombre completo, grado o grupo..." 
          class="form-input" 
          style="flex: 1;"
        />
        <button class="btn btn-primary" @click="handleSearch" :disabled="searchLoading">
          <span v-if="searchLoading" class="spinner"></span>
          <span v-else>🔍 Buscar</span>
        </button>
      </div>

      <div v-if="searchResults.length > 0" style="overflow-x: auto;">
        <table class="data-table" style="width: 100%; font-size: 13px;">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Grado</th>
              <th>Grupo</th>
              <th style="text-align: center;">Cal. T1</th>
              <th style="text-align: center;">Cal. T2</th>
              <th style="text-align: center;">Cal. T3</th>
              <th style="text-align: center;">General</th>
              <th style="text-align: center;">Conducta</th>
              <th style="text-align: center;">Asistencia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stu in searchResults" :key="stu.id">
              <td>
                <span
                  style="font-weight: 600; color: var(--color-primary); cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                  @click="router.push(`/students/${stu.id}/grades`)"
                  :title="`Ver expediente de ${stu.name}`"
                >
                  {{ stu.name }}
                </span>
              </td>
              <td>{{ stu.grade }}°</td>
              <td>{{ stu.group }}</td>
              <td style="text-align: center;">{{ stu.t1 }}</td>
              <td style="text-align: center;">{{ stu.t2 }}</td>
              <td style="text-align: center;">{{ stu.t3 }}</td>
              <td style="text-align: center; font-weight: 600;">{{ stu.general }}</td>
              <td style="text-align: center;">{{ stu.behavior_avg }}</td>
              <td style="text-align: center;">{{ stu.attendance_avg }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="searchQuery && !searchLoading && searchResults.length === 0" class="text-muted" style="text-align: center; padding: 20px;">
        No se encontraron alumnos con ese criterio.
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="!loading && stats.groups === 0" class="empty-state">
      <div class="empty-state-icon">🏫</div>
      <h3>¡Bienvenido a Arke Software!</h3>
      <p>Comienza creando tu primer grupo de alumnos para empezar a registrar evaluaciones y asistencia.</p>
      <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
        <button class="btn btn-primary" @click="navigateTo('/settings')">⚙️ Configurar Escuela</button>
        <button class="btn btn-secondary" @click="navigateTo('/evaluation')">🏫 Crear Grupo</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  border: none;
  text-align: left;
  width: 100%;
  background: var(--bg-card);
}

.quick-btn:hover { transform: translateY(-2px); }

.quick-btn-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-btn-text strong { font-size: 14px; color: var(--text-primary); }
.quick-btn-text small { font-size: 12px; color: var(--text-muted); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
