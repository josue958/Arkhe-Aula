<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'
import { exportTeamsToDocx } from '@/utils/docxExport'
import ExpandableTextarea from '@/components/ExpandableTextarea.vue'

const toast = useToastStore()
const unsavedStore = useUnsavedStore()
const hasChanges = ref(false)

const selectedPeriod = ref<number | null>(null)
const groups = ref<any[]>([])
const selectedGroupId = ref<number | null>(null)

const rubrics = ref<any[]>([])
const selectedSubjectId = ref<number | null>(null)
const selectedRubricId = ref<number | null>(null)

const activities = ref<any[]>([])
const selectedActivityId = ref<number | null>(null)
const subjectsList = ref<any[]>([])

const students = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const gradingConfig = ref<any>(null)

const filters = ref({
  search: '',
  team: ''
})

const viewMode = ref<'list' | 'edit'>('list')
const configuredTeams = ref<any[]>([])
let isProgrammatic = false

// Al cambiar el trimestre, cargar los grupos
watch(selectedPeriod, async (newPeriod) => {
  if (!isProgrammatic) {
    selectedGroupId.value = null
    selectedSubjectId.value = null
    selectedRubricId.value = null
    selectedActivityId.value = null
    activities.value = []
    students.value = []
    subjectsList.value = []
    rubrics.value = []
  }
  if (!newPeriod) {
    groups.value = []
    return
  }
  
  try {
    groups.value = await window.electronAPI.getGroups({})
  } catch (e) {
    toast.error('Error al cargar grupos.')
  }
})

// Al cambiar el grupo, cargar las materias
watch(selectedGroupId, async (newId) => {
  if (!isProgrammatic) {
    selectedSubjectId.value = null
    selectedRubricId.value = null
    selectedActivityId.value = null
    activities.value = []
    students.value = []
  }
  if (!newId) {
    subjectsList.value = []
    rubrics.value = []
    return
  }
  
  try {
    subjectsList.value = await window.electronAPI.getGroupSubjects(newId)
  } catch (e) {
    toast.error('Error al cargar materias.')
  }
})

// Al cambiar la materia, cargar las rúbricas
watch(selectedSubjectId, async (newSubId) => {
  if (!isProgrammatic) {
    selectedRubricId.value = null
    selectedActivityId.value = null
    activities.value = []
    students.value = []
  }
  if (!newSubId) {
    rubrics.value = []
    return
  }
  
  try {
    const allRubrics = await window.electronAPI.getSettingsEvaluationElements()
    // Filtramos por grupo y por el ID de la materia actual
    // Nota: el ID en allRubrics es de la rubrica, necesitamos comparar el subject_id
    // getSettingsEvaluationElements no devuelve subject_id directamente en el registro? 
    // Vamos a verificar qué devuelve esa API.
    
    // Mejor usar una API que devuelva rubricas para un sujeto específico
    rubrics.value = await window.electronAPI.getSettingsRubricsForSubject({ 
      subjectId: newSubId, 
      periodId: selectedPeriod.value || 0 
    }) 
    
    // Eliminar duplicados por nombre si existen
    const seen = new Set()
    rubrics.value = rubrics.value.filter((r: any) => {
      if (seen.has(r.name)) return false
      seen.add(r.name)
      return true
    })
  } catch (e) {
    toast.error('Error al cargar elementos de evaluación.')
  }
})

// Al cambiar la rúbrica, cargar las actividades
watch(selectedRubricId, async (newId) => {
  if (!isProgrammatic) {
    selectedActivityId.value = null
    students.value = []
  }
  if (!newId) {
    activities.value = []
    return
  }
  
  try {
    const allActivities = await window.electronAPI.getSettingsActivities()
    // Filtramos actividades que pertenezcan a esta rúbrica (por nombre y grupo)
    const currentRubric = rubrics.value.find(r => r.id === newId)
    activities.value = allActivities.filter((a: any) => 
      a.rubric_name === currentRubric.name && a.group_id === selectedGroupId.value
    )
  } catch (e) {
    toast.error('Error al cargar actividades.')
  }
})

// Al cambiar la actividad, cargar los equipos
watch(selectedActivityId, async (newId) => {
  if (!newId || !selectedGroupId.value) {
    students.value = []
    return
  }
  loadTeams()
})

async function loadTeams() {
  loading.value = true
  try {
    if (!gradingConfig.value) {
      gradingConfig.value = await window.electronAPI.getGradingConfig()
    }
    const minPass = gradingConfig.value?.setting_min_pass || 6

    const data = await window.electronAPI.getTeamsByActivity({
      activityId: selectedActivityId.value!,
      groupId: selectedGroupId.value!
    })
    students.value = data.map(s => ({
      ...s,
      team_number: s.team_number || 0,
      topic: s.topic || '',
      comments: s.comments || '',
      status_name: s.status_name || 'Activo',
      status_color: s.status_color || '#6b7280',
      activity_score: (s.activity_score !== null && s.activity_score !== undefined) ? String(s.activity_score) : String(minPass),
      today_attendance: s.today_attendance || null
    }))
  } catch (e) {
    toast.error('Error al cargar equipos.')
  }
  loading.value = false
}

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const nameStr = `${s.paternal_surname} ${s.maternal_surname} ${s.first_name}`.toLowerCase()
    const commentStr = (s.comments || '').toLowerCase()
    const topicStr = (s.topic || '').toLowerCase()
    const query = filters.value.search.toLowerCase()
    const matchesSearch = nameStr.includes(query) || commentStr.includes(query) || topicStr.includes(query)
    const matchesTeam = !filters.value.team || s.team_number === parseInt(filters.value.team)
    return matchesSearch && matchesTeam
  })
})

const availableTeams = computed(() => {
  const teams = new Set<number>()
  students.value.forEach(s => {
    if (s.team_number && s.team_number > 0) {
      teams.add(s.team_number)
    }
  })
  return Array.from(teams).sort((a,b) => a - b)
})

function setTeam(student: any, num: number) {
  if (student.team_number === num) {
    student.team_number = 0 // Deseleccionar
  } else {
    student.team_number = num
  }
  hasChanges.value = true
}

function syncTopic(student: any) {
  hasChanges.value = true
  if (student.team_number > 0) {
    students.value.forEach(s => {
      if (s.team_number === student.team_number && s.student_id !== student.student_id) {
        s.topic = student.topic
      }
    })
  }
}

async function saveTeams() {
  if (!selectedActivityId.value) return
  saving.value = true
  try {
    const teamsData = students.value.map(s => ({
      student_id: s.student_id,
      team_number: s.team_number,
      topic: String(s.topic || '').trim(),
      comments: s.comments
    }))
    // Also save grades
    const grades = students.value
      .filter(s => s.activity_score !== '')
      .map(s => ({
        student_id: s.student_id,
        activity_id: selectedActivityId.value,
        score: parseFloat(s.activity_score)
      }))

    await Promise.all([
      window.electronAPI.saveTeams({
        activityId: selectedActivityId.value,
        teamsData
      }),
      window.electronAPI.saveGrades({ grades })
    ])
    hasChanges.value = false
    toast.success('Equipos y calificaciones guardados.')
  } catch (e) {
    toast.error('Error al guardar equipos.')
  }
  saving.value = false
}

async function deleteTeams() {
  if (!selectedActivityId.value) return
  if (!confirm('¿Estás seguro de que deseas eliminar la configuración de equipos para esta actividad?')) return
  
  try {
    await window.electronAPI.deleteTeamsByActivity({ activityId: selectedActivityId.value })
    toast.success('Configuración de equipos eliminada.')
    
    // Regresar al listado y recargar
    hasChanges.value = false
    viewMode.value = 'list'
    await loadConfiguredTeams()
  } catch (e) {
    toast.error('Error al eliminar equipos.')
  }
}

watch(hasChanges, (val) => {
  unsavedStore.setDirty(val, async () => {
    await saveTeams()
  })
})

async function handleVolver() {
  if (hasChanges.value) {
    const confirmSave = window.confirm('¿Deseas guardar los cambios?')
    if (confirmSave) {
      await saveTeams()
    }
    hasChanges.value = false
  }
  viewMode.value = 'list'
  loadConfiguredTeams()
}

async function handleExport() {
  const currentActivityName = activities.value.find(a => a.id === selectedActivityId.value)?.name || 'Actividad'
  await exportTeamsToDocx(students.value, currentActivityName)
}

async function loadConfiguredTeams() {
  loading.value = true
  try {
    configuredTeams.value = await window.electronAPI.getAllConfiguredTeams()
  } catch (e) {
    toast.error('Error al cargar historial de equipos.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadConfiguredTeams()
})

function startNewTeam() {
  viewMode.value = 'edit'
  selectedPeriod.value = null
  selectedGroupId.value = null
  selectedSubjectId.value = null
  selectedRubricId.value = null
  selectedActivityId.value = null
}

async function editConfiguredTeam(t: any) {
  viewMode.value = 'edit'
  isProgrammatic = true
  
  try {
    selectedPeriod.value = t.period_id
    groups.value = await window.electronAPI.getGroups({})
    selectedGroupId.value = t.group_id
    
    subjectsList.value = await window.electronAPI.getGroupSubjects(t.group_id)
    selectedSubjectId.value = t.subject_id
    
    let fetchedRubrics = await window.electronAPI.getSettingsRubricsForSubject({ 
      subjectId: t.subject_id, 
      periodId: t.period_id 
    }) 
    const seen = new Set()
    rubrics.value = fetchedRubrics.filter((r: any) => {
      if (seen.has(r.name)) return false
      seen.add(r.name)
      return true
    })
    selectedRubricId.value = t.rubric_id
    
    const allActivities = await window.electronAPI.getSettingsActivities()
    const currentRubric = rubrics.value.find(r => r.id === t.rubric_id)
    if (currentRubric) {
      activities.value = allActivities.filter((a: any) => 
        a.rubric_name === currentRubric.name && a.group_id === t.group_id
      )
    }
    
    selectedActivityId.value = t.activity_id
    
    // Al final, llamamos manualmente para cargar los estudiantes/equipos si no se activó
    if (t.activity_id) {
       await loadTeams()
    }
  } catch (e) {
    console.error('Error pre-filling team', e)
  } finally {
    isProgrammatic = false
  }
}
</script>

<template>
  <div class="teams-page">
    <div class="page-header">
      <div>
        <h2>Gestión de Equipos</h2>
        <p class="text-muted">Organiza a tus alumnos en equipos para actividades específicas.</p>
      </div>
      <div class="actions">
        <button v-if="viewMode === 'list'" class="btn btn-primary" @click="startNewTeam">➕ Nuevo Equipo</button>
        <button v-if="viewMode === 'edit'" class="btn btn-ghost" @click="handleVolver">← Volver al Listado</button>
        <button v-if="viewMode === 'edit' && selectedActivityId" class="btn btn-secondary" @click="handleExport">📄 Exportar a DOCX</button>
        <button v-if="viewMode === 'edit' && selectedActivityId" class="btn btn-danger btn-ghost" @click="deleteTeams">🗑️ Eliminar Equipos</button>
      </div>
    </div>

    <!-- LIST MODE -->
    <div v-if="viewMode === 'list'" class="fade-in">
       <div v-if="loading" class="empty-state">
         <div class="spinner"></div>
       </div>
       <div v-else-if="configuredTeams.length === 0" class="empty-state">
         <div class="empty-state-icon">🧑‍🤝‍🧑</div>
         <h3>No hay equipos configurados</h3>
         <p>Comienza seleccionando "Nuevo Equipo" para vincular actividades a tus alumnos.</p>
       </div>
       <div v-else class="grid-3" style="gap: 16px;">
          <div v-for="t in configuredTeams" :key="t.activity_id" class="card team-card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" @click="editConfiguredTeam(t)" title="Clic para ver/editar equipos">
            <div class="pda-header">
              <span class="subject-tag">{{ t.subject_name }}</span>
            </div>
            <h3 class="pda-title">{{ t.activity_name }}</h3>
            <div class="pda-info">
              <span>🏫 {{ t.group_grade }}° {{ t.group_name }}</span>
              <span>Trimestre {{ t.period_id }}</span>
            </div>
            <div class="pda-footer" @click.stop>
              <button class="btn btn-secondary btn-sm w-full" @click="editConfiguredTeam(t)">Ver Equipos</button>
            </div>
          </div>
       </div>
    </div>

    <!-- EDIT MODE -->
    <div v-if="viewMode === 'edit'" class="fade-in">
      <div class="card" style="margin-bottom: 24px;">
      <div class="grid-5" style="gap: 16px; align-items: flex-end;">
        <div class="form-group">
          <label class="form-label">Trimestre</label>
          <select v-model="selectedPeriod" class="form-select">
            <option :value="null">Selecciona trimestre</option>
            <option :value="1">Trimestre 1</option>
            <option :value="2">Trimestre 2</option>
            <option :value="3">Trimestre 3</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Grupo</label>
          <select v-model="selectedGroupId" class="form-select" :disabled="!selectedPeriod">
            <option :value="null">Selecciona un grupo</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.grade }}° {{ g.name }} ({{ g.cycle }})</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Materia</label>
          <select v-model="selectedSubjectId" class="form-select" :disabled="!selectedGroupId">
            <option :value="null">Selecciona materia</option>
            <option v-for="s in subjectsList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Evaluación Formativa</label>
          <select v-model="selectedRubricId" class="form-select" :disabled="!selectedSubjectId">
            <option :value="null">Selecciona evaluación</option>
            <option v-for="r in rubrics" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Actividad</label>
          <select v-model="selectedActivityId" class="form-select" :disabled="!selectedRubricId">
            <option :value="null">Selecciona actividad</option>
            <option v-for="a in activities" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end mt-4" v-if="selectedActivityId">
        <button class="btn btn-secondary" @click="loadTeams">🔄 Refrescar Listado</button>
      </div>
    </div>

    <div v-if="selectedActivityId" class="card fade-in">
      <div class="flex justify-between items-center" style="margin-bottom: 20px;">
        <div class="search-bar" style="max-width: 400px; flex: 1;">
          <span class="search-icon">🔍</span>
          <input v-model="filters.search" type="text" placeholder="Filtrar por nombre de alumno..." class="form-input" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <select v-model="filters.team" class="form-select" style="width: 160px;">
            <option value="">Todos los equipos</option>
            <option v-for="n in availableTeams" :key="n" :value="String(n)">Equipo {{ n }}</option>
            <option value="0">Sin equipo</option>
          </select>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 250px;">Alumno</th>
              <th style="width: 140px; text-align: center;">Estado y asistencia</th>
              <th style="width: 80px; text-align: center;">Calif.</th>
              <th style="width: 320px; text-align: center;">Equipo (1-10)</th>
              <th style="width: 180px;">Tema (Máx. 255)</th>
              <th>Comentarios (Opcional)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.student_id">
              <td>
                <div style="font-weight: 600;">{{ student.paternal_surname }} {{ student.maternal_surname }}</div>
                <div style="font-size: 13px; color: var(--text-muted);">{{ student.first_name }}</div>
              </td>
              <td style="text-align: center;">
                <div style="display: flex; gap: 6px; align-items: center; justify-content: center;">
                  <span class="btn-color btn-color-primary" style="font-size: 10px; padding: 2px 8px;" :title="`Estado: ${student.status_name}`">
                    {{ student.status_name }}
                  </span>
                  <span v-if="student.today_attendance" class="btn-color" :class="{
                     'btn-color-success': student.today_attendance === 'present',
                     'btn-color-danger': student.today_attendance === 'absent',
                     'btn-color-tertiary': student.today_attendance === 'late'
                  }" :title="`Asistencia: ${student.today_attendance === 'present' ? 'Presente' : student.today_attendance === 'absent' ? 'Ausente' : 'Retardo'}`">
                    {{ student.today_attendance === 'present' ? '✓' : student.today_attendance === 'absent' ? '✕' : '⏱' }}
                  </span>
                </div>
              </td>
              <td style="text-align: center;">
                <input 
                  v-model="student.activity_score"
                  type="text"
                  class="form-input"
                  style="width: 60px; text-align: center; padding: 4px; font-weight: 700; color: var(--color-primary);"
                  placeholder="-"
                  @input="hasChanges = true"
                />
              </td>
              <td>
                <div class="team-grid">
                  <label 
                    v-for="n in 10" 
                    :key="n" 
                    class="team-cell"
                    :class="{ active: student.team_number === n }"
                  >
                    <input 
                      type="checkbox" 
                      :checked="student.team_number === n" 
                      @change="setTeam(student, n)"
                      style="display: none;"
                    />
                    {{ n }}
                  </label>
                </div>
              </td>
              <td>
                <ExpandableTextarea 
                  v-model="student.topic" 
                  :max-length="255" 
                  placeholder="Máx 255 caracteres..."
                  @update:model-value="syncTopic(student)"
                />
              </td>
              <td>
                <ExpandableTextarea 
                  v-model="student.comments" 
                  :max-length="255" 
                  placeholder="Máx 255 caracteres..."
                  @update:model-value="hasChanges = true"
                />
              </td>
            </tr>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
                No se encontraron alumnos con los filtros seleccionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end mt-6" v-if="filteredStudents.length > 0">
        <button class="btn btn-primary btn-lg" @click="saveTeams" :disabled="saving || !hasChanges" style="min-width: 200px;">
          <span v-if="saving" class="spinner"></span>
          <span v-else>💾 Guardar Cambios</span>
        </button>
      </div>
    </div>

    <div v-else-if="!selectedGroupId" class="empty-state">
      <div class="empty-state-icon">👥</div>
      <h3>Selecciona un grupo para comenzar</h3>
      <p>Debes elegir un grupo, un elemento de evaluación y una actividad para organizar los equipos.</p>
    </div>
    </div>
  </div>
</template>

<style scoped>
.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.subject-tag {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.pda-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.4;
}
.pda-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 20px;
}
.team-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}
.team-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  max-width: 340px;
  margin: 0 auto;
}

.team-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  user-select: none;
  background: var(--bg-surface);
}

.team-cell:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.team-cell.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
