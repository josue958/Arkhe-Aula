<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const groups = ref<any[]>([])
const loading = ref(true)
const cycles = ref<any[]>([])
const activeCycle = ref('')

onMounted(async () => {
  const [groupsData, cyclesData] = await Promise.all([
    window.electronAPI.getGroups(),
    window.electronAPI.getCycles(),
  ])
  groups.value = groupsData
  cycles.value = cyclesData
  const active = cyclesData.find((c: any) => c.is_active)
  if (active) activeCycle.value = active.name
  loading.value = false
})

function goToSubjects(groupId: number) {
  router.push(`/evaluation/${groupId}/subjects`)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Evaluación</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">
          Ciclo: {{ activeCycle || 'Sin ciclo activo' }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="grid-3">
      <div v-for="i in 3" :key="i" class="card" style="height: 160px; animation: pulse 1.5s infinite;"></div>
    </div>

    <div v-else-if="groups.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
      <div
        v-for="group in groups"
        :key="group.id"
        class="card card--glow"
        style="cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 180px;"
        @click="goToSubjects(group.id)"
      >
        <div class="flex justify-between items-center" style="margin-bottom: 12px;">
          <span class="badge badge-primary">{{ group.cycle }}</span>
        </div>
        <h3 style="margin-bottom: 4px;">{{ group.grade }}° {{ group.name }}</h3>
        <p class="text-muted" style="font-size: 13px;">
          {{ group.students_count || 0 }} alumnos
          <span v-if="group.subjects_list"> • {{ group.subjects_list }}</span>
        </p>
        <div class="flex justify-end" style="margin-top: 16px;">
          <button class="btn btn-primary btn-sm">📝 Evaluar →</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">📝</div>
      <h3>No hay grupos para evaluar</h3>
      <p>Crea grupos en la sección de Configuración para comenzar a evaluar.</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
