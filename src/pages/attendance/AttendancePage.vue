<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const groups = ref<any[]>([])
const loading = ref(true)
const today = new Date().toISOString().slice(0, 10)

const reportDialog = ref({ open: false, groupId: 0, trimester: '1' })

onMounted(async () => {
  const data = await window.electronAPI.getAttendanceGroups()
  
  if (route.query.filter === 'today_pending') {
    // 1. Grupos que no se les ha tomado lista hoy
    const pendingData = data.filter((g: any) => !g.taken_today || g.taken_today === 0)
    
    // 2. Grupos de hoy, según el horario
    const savedEntries = localStorage.getItem('arkhe-schedule-entries')
    if (savedEntries) {
      try {
        const entries = JSON.parse(savedEntries)
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        const todayName = days[new Date().getDay()]
        
        // Encontrar los groupIds que tocan hoy en el horario
        const todayGroupIds = new Set(
          entries.filter((e: any) => e.day === todayName).map((e: any) => e.groupId)
        )
        
        // Dejar solo los que tocan hoy y no se ha tomado lista
        groups.value = pendingData.filter((g: any) => todayGroupIds.has(g.id))
      } catch (e) {
        groups.value = pendingData
      }
    } else {
      groups.value = pendingData
    }
  } else {
    groups.value = data
  }
  
  loading.value = false
})

function goToTake(groupId: number) {
  router.push(`/attendance/${groupId}/take`)
}

function goToReport() {
  router.push('/attendance/report')
}

function openGroupReportDialog(groupId: number) {
  reportDialog.value.groupId = groupId
  reportDialog.value.open = true
}

async function exportGroupReport() {
  const groupId = reportDialog.value.groupId
  const trim = reportDialog.value.trimester
  reportDialog.value.open = false
  // Lógica para ir a la vista de reporte con los parámetros
  router.push({ path: '/attendance/report', query: { group: groupId, trimester: trim, auto: '1' } })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Asistencia</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">{{ today }}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" @click="goToReport">📊 Ver Reporte</button>
      </div>
    </div>

    <div v-if="loading" class="grid-3">
      <div v-for="i in 3" :key="i" class="card" style="height: 140px; animation: pulse 1.5s infinite;"></div>
    </div>

    <div v-else-if="groups.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
      <div
        v-for="group in groups"
        :key="group.id"
        class="card card--glow"
        style="cursor: pointer; aspect-ratio: 1 / 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;"
        @click="goToTake(group.id)"
      >
        <div style="margin-bottom: 12px; display: flex; gap: 8px; justify-content: center;">
          <span class="badge badge-primary">{{ group.cycle || 'Ciclo' }}</span>
          <span class="badge badge-neutral">{{ group.students_count || 0 }} alumnos</span>
        </div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">{{ group.grade }}° {{ group.name }}</h3>
        <p class="text-muted" style="font-size: 14px; margin-bottom: 16px;">
          {{ group.shift === 'matutino' ? '🌅 Matutino' : '🌆 Vespertino' }}
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-primary btn-sm w-full" @click.stop="goToTake(group.id)">✅ Tomar Asistencia</button>
          <button class="btn btn-ghost btn-sm w-full" @click.stop="openGroupReportDialog(group.id)">📊 Reporte</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">✅</div>
      <h3>No hay grupos disponibles</h3>
      <p>Crea grupos en la sección de Grupos para poder tomar asistencia.</p>
    </div>

    <div v-if="reportDialog.open" class="modal-overlay" style="z-index: 1000;">
      <div class="modal-content" style="max-width: 400px; text-align: left;">
        <h3>Exportar Reporte</h3>
        <p class="text-muted" style="margin-bottom: 16px;">Selecciona el trimestre del reporte.</p>
        
        <div class="form-group" style="margin-bottom: 24px;">
          <label class="form-label">Trimestre</label>
          <select v-model="reportDialog.trimester" class="form-select">
            <option value="1">Trimestre I</option>
            <option value="2">Trimestre II</option>
            <option value="3">Trimestre III</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn btn-ghost" @click="reportDialog.open = false">Cancelar</button>
          <button class="btn btn-primary" @click="exportGroupReport">Exportar / Ver</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
