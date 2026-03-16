<script setup lang="ts">
import { ref, onMounted, watch, computed, toRaw } from 'vue'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'
import { exportPdaToDocx } from '@/utils/docxExport'
import ExpandableTextarea from '@/components/ExpandableTextarea.vue'

const toast = useToastStore()
const unsavedStore = useUnsavedStore()

// Datasets
const groups = ref<any[]>([])
const subjectTemplates = ref<any[]>([])
const pdas = ref<any[]>([])

// State
const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)
const viewMode = ref<'list' | 'edit'>('list')
const isInitializing = ref(false)

// Form / Current PDA
const currentPda = ref<any>({
  id: null,
  topic: '',
  subject_name: '',
  num_sessions: 1,
  selected_groups: [] as number[],
  sessions: [] as any[],
  tracking: {} as any // { session_num: { group_id: { start_date, end_date } } }
})

onMounted(async () => {
  await loadBaseData()
  await loadPdas()
})

async function loadBaseData() {
  try {
    groups.value = await window.electronAPI.getGroups({})
    subjectTemplates.value = await window.electronAPI.getSubjectTemplates()
  } catch (e) {
    console.error(e)
  }
}

async function loadPdas() {
  loading.value = true
  try {
    pdas.value = await window.electronAPI.getPdas()
  } catch (e) {
    toast.error('Error al cargar PDAs.')
  } finally {
    loading.value = false
  }
}

function startNewPda() {
  isInitializing.value = true
  currentPda.value = {
    id: null,
    topic: '',
    subject_name: '',
    num_sessions: 1,
    selected_groups: [],
    sessions: [{ session_number: 1, activity: '', observations: '' }],
    tracking: {}
  }
  viewMode.value = 'edit'
  setTimeout(() => {
    hasChanges.value = false
    isInitializing.value = false
  }, 100)
}

function editPda(pda: any) {
  isInitializing.value = true
  currentPda.value = {
    ...pda,
    selected_groups: [...(pda.groups || [])],
    sessions: pda.sessions?.length > 0 ? JSON.parse(JSON.stringify(pda.sessions)) : [],
    tracking: pda.tracking ? JSON.parse(JSON.stringify(pda.tracking)) : {}
  }
  
  // Sync sessions with num_sessions
  syncSessions()
  
  viewMode.value = 'edit'
  setTimeout(() => {
    hasChanges.value = false
    isInitializing.value = false
  }, 100)
}

async function deletePda(id: number) {
  if (!confirm('¿Estás seguro de eliminar este seguimiento de PDA?')) return
  try {
    await window.electronAPI.deletePda(id)
    toast.success('PDA eliminado.')
    await loadPdas()
  } catch (e) {
    toast.error('Error al eliminar.')
  }
}

function syncSessions() {
  const num = parseInt(String(currentPda.value.num_sessions)) || 0
  if (num < 1) return

  // Adjust sessions array
  if (currentPda.value.sessions.length < num) {
    for (let i = currentPda.value.sessions.length + 1; i <= num; i++) {
       currentPda.value.sessions.push({ session_number: i, activity: '', observations: '' })
    }
  } else if (currentPda.value.sessions.length > num) {
    currentPda.value.sessions = currentPda.value.sessions.slice(0, num)
  }

  // Ensure tracking structure
  currentPda.value.sessions.forEach((s: any) => {
    if (!currentPda.value.tracking[s.session_number]) {
      currentPda.value.tracking[s.session_number] = {}
    }
  })
}

watch(() => currentPda.value.num_sessions, () => {
  if (isInitializing.value) return
  syncSessions()
  hasChanges.value = true
}, { deep: false })

watch(currentPda, () => {
  if (isInitializing.value) return
  hasChanges.value = true
}, { deep: true })

function toggleTracking(sessionNum: number, groupId: number, type: 'start' | 'end') {
  if (isInitializing.value) return
  if (!currentPda.value.tracking[sessionNum]) {
    currentPda.value.tracking[sessionNum] = {}
  }
  if (!currentPda.value.tracking[sessionNum][groupId]) {
    currentPda.value.tracking[sessionNum][groupId] = { start_date: null, end_date: null }
  }

  const field = type === 'start' ? 'start_date' : 'end_date'
  if (currentPda.value.tracking[sessionNum][groupId][field]) {
    currentPda.value.tracking[sessionNum][groupId][field] = null
  } else {
    // Current date in short format (DD/MM/YY)
    const date = new Date()
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    currentPda.value.tracking[sessionNum][groupId][field] = `${dd}/${mm}/${yy}`
  }
  hasChanges.value = true
}

watch(hasChanges, (val) => {
  unsavedStore.setDirty(val, async () => {
    await handleSave()
  })
})


async function handleSave() {
  if (!currentPda.value.topic || !currentPda.value.subject_name) {
    toast.error('Nombre del PDA y Materia son obligatorios.')
    return
  }
  
  saving.value = true
  try {
    // Clean data to avoid Proxy related issues in IPC
    const payload = JSON.parse(JSON.stringify({
      pda: {
        id: currentPda.value.id,
        topic: currentPda.value.topic,
        subject_name: currentPda.value.subject_name,
        num_sessions: currentPda.value.num_sessions
      },
      groups: toRaw(currentPda.value.selected_groups),
      sessions: toRaw(currentPda.value.sessions),
      tracking: toRaw(currentPda.value.tracking)
    }))

    const res = await window.electronAPI.savePda(payload)
    
    if (res.success) {
      toast.success('Cambios guardados correctamente.')
      hasChanges.value = false
      if (!currentPda.value.id) currentPda.value.id = res.id
      await loadPdas()
    } else {
      toast.error('Error al guardar: ' + res.message)
    }
  } catch (e: any) {
    console.error('Save PDA Error:', e)
    toast.error('Error de comunicación con el sistema: ' + (e.message || 'Error desconocido'))
  } finally {
    saving.value = false
  }
}

function getGroupName(id: number) {
  const g = groups.value.find(x => x.id === id)
  return g ? `${g.grade}° ${g.name}` : '?'
}

const selectedGroupsData = computed(() => {
  return groups.value.filter(g => currentPda.value.selected_groups.includes(g.id))
})

function getPdaStatus(p: any) {
  const finishedGroups: string[] = []
  const inProgressGroups: string[] = []
  
  if (!p.groups || p.groups.length === 0) {
    return { finishedGroups, inProgressGroups, completedSessionsTotal: 0, totalSessionsExpected: 0 }
  }

  const totalSessions = p.num_sessions
  let sumCompletedSessions = 0

  for (const gid of p.groups) {
    let completedSessions = 0

    if (p.tracking) {
      for (let s = 1; s <= totalSessions; s++) {
        const gTracking = p.tracking[s] && p.tracking[s][gid]
        // Se considera completada la sesión para el grupo si ya tiene ambas fechas
        if (gTracking && gTracking.start_date && gTracking.end_date) {
           completedSessions++
        }
      }
    }
    
    sumCompletedSessions += completedSessions
    const groupName = getGroupName(gid)
    if (completedSessions === totalSessions && totalSessions > 0) {
      finishedGroups.push(groupName)
    } else {
      inProgressGroups.push(groupName)
    }
  }

  return {
    finishedGroups,
    inProgressGroups,
    completedSessionsTotal: sumCompletedSessions,
    totalSessionsExpected: totalSessions * p.groups.length
  }
}

async function handleVolver() {
  if (hasChanges.value) {
    const confirmSave = window.confirm('¿Deseas guardar los cambios?')
    if (confirmSave) {
      await handleSave()
    }
    // Independientemente de la respuesta, limpiamos los cambios y regresamos (si fue aceptar, ya se guardó)
    hasChanges.value = false
  }
  viewMode.value = 'list'
}

</script>

<template>
  <div class="pda-tracking-page">
    <div class="page-header">
      <div>
        <h2>Seguimiento de PDA</h2>
        <p class="text-muted">Gestión y monitoreo del Proceso de Desarrollo de Aprendizaje.</p>
      </div>
      <div class="actions">
        <button v-if="viewMode === 'list'" class="btn btn-primary" @click="startNewPda">➕ Nuevo Seguimiento</button>
      </div>
    </div>

    <!-- LIST MODE -->
    <div v-if="viewMode === 'list'" class="fade-in">
       <div v-if="loading" class="empty-state">
         <div class="spinner"></div>
       </div>
       <div v-else-if="pdas.length === 0" class="empty-state">
         <div class="empty-state-icon">📋</div>
         <h3>No hay seguimientos registrados</h3>
         <p>Comienza creando uno nuevo para llevar el control de tus temas.</p>
       </div>
        <div v-else class="grid-3" style="gap: 16px;">
          <div v-for="p in pdas" :key="p.id" class="card pda-card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" @click="editPda(p)" title="Clic para ver seguimiento">
            <div class="pda-header" style="align-items: flex-start;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span class="subject-tag">{{ p.subject_name }}</span>
              </div>
              <div class="pda-actions" @click.stop>
                <button class="btn btn-icon btn-ghost" @click="editPda(p)">✏️</button>
                <button class="btn btn-icon btn-ghost text-danger" @click="deletePda(p.id)">🗑️</button>
              </div>
            </div>
            
            <h3 class="pda-title">{{ p.topic }}</h3>
            <div class="pda-info">
              <span>📅 {{ p.num_sessions }} Sesiones</span>
            </div>
            
            <!-- Bloque de Estatus -->
            <div class="mt-4" style="background: var(--bg-elevated); padding: 12px; border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--text-color);">📑 Estatus de Avance</div>
              
              <!-- Caso sin grupos -->
              <div v-if="p.groups.length === 0" class="text-muted" style="font-size: 12px;">Sin grupos asignados</div>
              
              <div v-else>
                <!-- Etiquetas de progreso con tooltips o lista de grupos -->
                <div v-if="getPdaStatus(p).inProgressGroups.length > 0" style="margin-bottom: 6px;">
                  <span class="badge badge-warning" style="font-size: 11px; margin-bottom: 4px; display: inline-block;">En Progreso</span>
                  <div style="font-size: 12px; color: var(--text-muted); line-height: 1.3;">
                    {{ getPdaStatus(p).inProgressGroups.join(', ') }}
                  </div>
                </div>
                
                <div v-if="getPdaStatus(p).finishedGroups.length > 0">
                  <span class="badge badge-success" style="font-size: 11px; margin-bottom: 4px; display: inline-block;">Finalizado</span>
                  <div style="font-size: 12px; color: var(--text-muted); line-height: 1.3;">
                    {{ getPdaStatus(p).finishedGroups.join(', ') }}
                  </div>
                </div>
                
                <!-- Barra de progreso general opcional -->
                <div v-if="getPdaStatus(p).totalSessionsExpected > 0" style="margin-top: 10px; height: 6px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden; position: relative;">
                  <div :style="{ width: ((getPdaStatus(p).completedSessionsTotal / getPdaStatus(p).totalSessionsExpected) * 100) + '%', background: 'var(--color-primary)', height: '100%', position: 'absolute', left: '0', top: '0', transition: 'width 0.3s ease' }"></div>
                </div>
              </div>
            </div>

            <div class="pda-footer" @click.stop style="margin-top: 16px;">
              <button class="btn btn-secondary btn-sm w-full" @click="editPda(p)">Ver Seguimiento</button>
            </div>
          </div>
       </div>
    </div>

    <!-- EDIT MODE -->
    <div v-if="viewMode === 'edit'" class="pda-editor fade-in">
      <!-- Top Actions -->
      <div class="flex justify-between items-center mb-4">
        <button class="btn btn-ghost" @click="handleVolver">← Volver al Listado</button>
        <div class="flex gap-2">
          <button class="btn btn-secondary" @click="exportPdaToDocx(currentPda, selectedGroupsData)">📄 Exportar a DOCX</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="!hasChanges || saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>💾 Guardar Cambios</span>
          </button>
        </div>
      </div>

      <div class="card pda-form mb-6">
        <div class="grid-4" style="gap: 16px; align-items: flex-end;">
          <div class="form-group mb-0" style="grid-column: span 2;">
            <label class="form-label">Nombre del PDA (Tema)</label>
            <ExpandableTextarea 
              v-model="currentPda.topic" 
              placeholder="Ej: Las Leyes de Newton" 
            />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Materia</label>
            <select v-model="currentPda.subject_name" class="form-select">
              <option value="">Selecciona materia</option>
              <option v-for="s in subjectTemplates" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Número de Sesiones</label>
            <input v-model.number="currentPda.num_sessions" type="number" min="1" max="50" class="form-input" />
          </div>
          <div class="form-group mb-0">
             <label class="form-label">Grupos</label>
             <div class="group-chips">
                <label v-for="g in groups" :key="g.id" class="group-chip" :class="{ active: currentPda.selected_groups.includes(g.id) }">
                  <input type="checkbox" :value="g.id" v-model="currentPda.selected_groups" style="display: none;" />
                  {{ g.grade }}° {{ g.name }}
                </label>
             </div>
          </div>
        </div>
      </div>

      <div class="tracking-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px; text-align: center;">Sesión</th>
              <th style="width: 350px;">Actividad (Máx. 2000 palabras)</th>
              <th style="width: 250px;">Observaciones (Máx. 500 carac.)</th>
              <th v-for="g in selectedGroupsData" :key="g.id" style="text-align: center; min-width: 140px;">
                {{ g.grade }}° {{ g.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(session, idx) in currentPda.sessions" :key="idx">
              <td style="text-align: center; font-weight: bold; color: var(--color-primary);">
                {{ session.session_number }}
              </td>
              <td>
                <textarea 
                  v-model="session.activity" 
                  class="form-input table-textarea" 
                  rows="3" 
                  placeholder="Describe la actividad..."
                  @input="hasChanges = true"
                ></textarea>
              </td>
              <td>
                <textarea 
                  v-model="session.observations" 
                  class="form-input table-textarea" 
                  rows="3" 
                  maxlength="500" 
                  placeholder="Notas u observaciones..."
                  @input="hasChanges = true"
                ></textarea>
              </td>
              <td v-for="g in selectedGroupsData" :key="g.id" class="tracking-cells">
                <div class="tracking-box">
                  <div class="check-container">
                    <label class="check-label">
                      <input 
                        type="checkbox" 
                        :checked="!!currentPda.tracking[session.session_number]?.[g.id]?.start_date"
                        @change="toggleTracking(session.session_number, g.id, 'start')"
                      />
                      <span>Inicio</span>
                    </label>
                    <input 
                      v-if="currentPda.tracking[session.session_number]?.[g.id]?.start_date"
                      type="text" 
                      class="form-input" 
                      style="width: 70px; padding: 2px 4px; font-size: 11px; text-align: center; height: 22px; min-height: 22px;"
                      v-model="currentPda.tracking[session.session_number][g.id].start_date"
                      @input="hasChanges = true"
                    />
                    <div v-else class="tracking-date">--/--/--</div>
                  </div>
                  <div class="check-divider"></div>
                  <div class="check-container">
                    <label class="check-label">
                      <input 
                        type="checkbox" 
                        :checked="!!currentPda.tracking[session.session_number]?.[g.id]?.end_date"
                        @change="toggleTracking(session.session_number, g.id, 'end')"
                      />
                      <span>Final</span>
                    </label>
                    <input 
                      v-if="currentPda.tracking[session.session_number]?.[g.id]?.end_date"
                      type="text" 
                      class="form-input" 
                      style="width: 70px; padding: 2px 4px; font-size: 11px; text-align: center; height: 22px; min-height: 22px;"
                      v-model="currentPda.tracking[session.session_number][g.id].end_date"
                      @input="hasChanges = true"
                    />
                    <div v-else class="tracking-date">--/--/--</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bottom Save Button -->
      <div class="flex justify-end mt-6">
        <button class="btn btn-primary btn-lg" @click="handleSave" :disabled="!hasChanges || saving" style="min-width: 200px;">
          <span v-if="saving" class="spinner"></span>
          <span v-else>💾 Guardar Seguimiento</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pda-tracking-page {
  padding: 0;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.group-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
  padding: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.group-chip {
  padding: 4px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.group-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pda-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}

.pda-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

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
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.table-textarea {
  font-size: 13px;
  padding: 8px;
  resize: vertical;
  min-height: 80px;
  background: transparent;
  border-color: transparent;
}

.table-textarea:focus {
  background: var(--bg-surface);
  border-color: var(--color-primary);
}

.tracking-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-elevated);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.check-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.check-divider {
  height: 1px;
  background: var(--border);
  margin: 2px 0;
}

.tracking-date {
  font-family: monospace;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 2px 4px;
  border-radius: 4px;
}

.tracking-date.active {
  color: var(--color-primary);
  font-weight: 700;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.data-table th {
  background: var(--bg-elevated);
  position: sticky;
  top: 0;
  z-index: 2;
}

.tracking-table-container {
  max-height: 60vh;
  overflow-y: auto;
  border-radius: 12px;
}
</style>
