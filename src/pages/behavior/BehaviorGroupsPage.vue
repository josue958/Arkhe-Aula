<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const groups = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  groups.value = await window.electronAPI.getAttendanceGroups() // Same groups as attendance
  loading.value = false
})

function goToTrack(groupId: number) {
  router.push(`/behavior/${groupId}/track`)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Conducta de grupo</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">Selecciona un grupo para seguimiento de conducta</p>
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
        @click="goToTrack(group.id)"
      >
        <div style="margin-bottom: 12px; display: flex; gap: 8px; justify-content: center;">
          <span class="badge badge-primary">{{ group.cycle || 'Ciclo' }}</span>
          <span class="badge badge-neutral">{{ group.students_count || 0 }} alumnos</span>
        </div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">{{ group.grade }}° {{ group.name }}</h3>
        <p class="text-muted" style="font-size: 14px; margin-bottom: 16px;">
          {{ group.shift === 'matutino' ? '🌅 Matutino' : '🌆 Vespertino' }}
        </p>
        <div>
          <button class="btn btn-primary btn-sm" @click.stop="goToTrack(group.id)">🎭 Conducta</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">🎭</div>
      <h3>No hay grupos disponibles</h3>
      <p>Crea grupos en la sección de Grupos para poder registrar la conducta.</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
