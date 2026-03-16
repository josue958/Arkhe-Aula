<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ groupId: string }>()
const router = useRouter()

const subjects = ref<any[]>([])
const group = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  const [subjectsData, groupData] = await Promise.all([
    window.electronAPI.getGroupSubjects(Number(props.groupId)),
    window.electronAPI.getGroup(Number(props.groupId)),
  ])
  subjects.value = subjectsData
  group.value = groupData
  loading.value = false
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Materias del Grupo</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;" v-if="group">
          {{ group.grade }}° {{ group.name }} • {{ group.cycle }}
        </p>
      </div>
      <button class="btn btn-secondary" @click="router.push('/evaluation')">← Volver</button>
    </div>

    <div v-if="loading" class="grid-3">
      <div v-for="i in 3" :key="i" class="card" style="height: 120px; animation: pulse 1.5s infinite;"></div>
    </div>

    <div v-else-if="subjects.length > 0" class="grid-3">
      <div
        v-for="subject in subjects"
        :key="subject.id"
        class="card card--glow"
        style="cursor: pointer; border-left: 4px solid;"
        :style="{ borderLeftColor: subject.color || '#6366f1' }"
        @click="router.push(`/evaluation/${groupId}/subjects/${subject.id}`)"
      >
        <div style="font-size: 28px; margin-bottom: 12px;">📚</div>
        <h3 style="margin-bottom: 4px;">{{ subject.name }}</h3>
        <div class="flex justify-end" style="margin-top: 12px;">
          <button class="btn btn-primary btn-sm" :style="{ background: subject.color || '' }">
            Ver Calificaciones →
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">📚</div>
      <h3>No hay materias asignadas</h3>
      <p>Asigna materias a este grupo desde Configuración → Materias.</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
