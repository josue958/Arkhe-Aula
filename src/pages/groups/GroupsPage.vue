<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast = useToastStore()

const groups = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showArchived = ref(false)

// Ciclos y trimestres
const cycles = ref<any[]>([])
const trimestersByCycle = ref<Map<string, any[]>>(new Map())

// Modal crear grupo
const showCreateModal = ref(false)
const creating = ref(false)
const subjectTemplates = ref<any[]>([])

const createForm = ref({
  name: '',
  grade: '1',
  cycle: '',
  shifts: ['matutino'] as string[],
  current_period: 1,
  period_ids: [1, 2, 3] as number[],
  subject_template_ids: [] as number[],
})

// Modal editar grupo
const showEditModal = ref(false)
const editForm = ref({
  id: 0,
  name: '',
  grade: '1',
  cycle: '',
  shifts: [] as string[],
  current_period: 1,
  period_ids: [] as number[],
  subject_template_ids: [] as number[],
})

// Obtener fechas del trimestre para un ciclo
function getTrimesterDates(cycleName: string, periodNumber: number) {
  const trimesters = trimestersByCycle.value.get(cycleName) || []
  const t = trimesters.find(tri => tri.trimester_number === periodNumber)
  return t ? { start_date: t.start_date, end_date: t.end_date } : { start_date: null, end_date: null }
}

// Actualizar period_ids cuando cambia el ciclo en crear
watch(() => createForm.value.cycle, (newCycle) => {
  if (newCycle) {
    const trimesters = trimestersByCycle.value.get(newCycle) || []
    if (trimesters.length > 0) {
      createForm.value.period_ids = trimesters.map(t => t.trimester_number)
    }
  }
})

// Actualizar period_ids cuando cambia el ciclo en editar
watch(() => editForm.value.cycle, (newCycle) => {
  if (newCycle && editForm.value.id) {
    const trimesters = trimestersByCycle.value.get(newCycle) || []
    if (trimesters.length > 0) {
      // Conservar solo los períodos que existen en el nuevo ciclo
      const availablePeriods = trimesters.map(t => t.trimester_number)
      editForm.value.period_ids = editForm.value.period_ids.filter(p => availablePeriods.includes(p))
      if (editForm.value.period_ids.length === 0) {
        editForm.value.period_ids = availablePeriods
      }
    }
  }
})

async function openEditModal(group: any) {
  editForm.value = {
    ...group,
    shifts: group.shift ? group.shift.split(',') : [],
    period_ids: [],
    subject_template_ids: []
  }

  // Load periods
  const periods = await window.electronAPI.getGroupPeriods(group.id)
  editForm.value.period_ids = periods.map((p: any) => p.period)

  // Load subjects
  const subjects = await window.electronAPI.getGroupSubjects(group.id)
  editForm.value.subject_template_ids = subjects.map((s: any) => s.subject_template_id || s.id)

  showEditModal.value = true
}
async function updateGroup() {
  if (!editForm.value.name || !editForm.value.grade || !editForm.value.cycle) {
    toast.warning('Completa todos los campos requeridos.')
    return
  }
  try {
    const payload = JSON.parse(JSON.stringify(editForm.value))
    payload.shift = editForm.value.shifts.join(',')
    await window.electronAPI.updateGroup(editForm.value.id, payload)
    toast.success('Grupo actualizado correctamente.')
    showEditModal.value = false
    await loadData()
  } catch (e) {
    toast.error('Error al actualizar el grupo.')
  }
}

// Modal migrar
const showMigrateModal = ref(false)
const groupToMigrate = ref<any>(null)
const migrateForm = ref({ target_group_id: '', new_group_name: '' })

// Grupos filtrados
const filteredGroups = computed(() => {
  return groups.value.filter(g => {
    const matchSearch = !searchQuery.value ||
      g.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      g.grade.toString().includes(searchQuery.value)
    const matchArchived = showArchived.value ? true : !g.archived_at
    return matchSearch && matchArchived
  })
})

const activeGroups = computed(() => filteredGroups.value.filter(g => !g.archived_at))
const archivedGroups = computed(() => filteredGroups.value.filter(g => g.archived_at))

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [groupsData, cyclesData, templatesData] = await Promise.all([
      window.electronAPI.getGroups({ include_archived: true }),
      window.electronAPI.getCycles(),
      window.electronAPI.getSubjectTemplates(),
    ])
    groups.value = groupsData
    cycles.value = cyclesData
    subjectTemplates.value = templatesData

    // Cargar trimestres por ciclo
    const trimestersMap = new Map<string, any[]>()
    for (const cycle of cyclesData) {
      const trimesters = await window.electronAPI.getTrimesters(cycle.id)
      trimestersMap.set(cycle.name, trimesters)
    }
    trimestersByCycle.value = trimestersMap

    // Pre-seleccionar ciclo activo
    const activeCycle = cyclesData.find((c: any) => c.is_active)
    if (activeCycle) {
      createForm.value.cycle = activeCycle.name
      // Pre-seleccionar trimestres disponibles
      const trimesters = trimestersMap.get(activeCycle.name) || []
      if (trimesters.length > 0) {
        createForm.value.period_ids = trimesters.map(t => t.trimester_number)
      }
    }
  } catch (e) {
    toast.error('Error al cargar los grupos.')
  }
  loading.value = false
}

async function createGroup() {
  if (!createForm.value.name || !createForm.value.grade || !createForm.value.cycle) {
    toast.warning('Completa todos los campos requeridos.')
    return
  }
  creating.value = true
  try {
    const payload = JSON.parse(JSON.stringify(createForm.value))
    payload.shift = createForm.value.shifts.join(',')
    await window.electronAPI.createGroup(payload)
    toast.success('Grupo creado correctamente.')
    showCreateModal.value = false
    resetCreateForm()
    await loadData()
  } catch (e) {
    toast.error('Error al crear el grupo.')
  }
  creating.value = false
}

function resetCreateForm() {
  const activeCycle = cycles.value.find((c: any) => c.is_active)
  createForm.value = {
    name: '',
    grade: '1',
    cycle: activeCycle?.name || '',
    shifts: ['matutino'],
    current_period: 1,
    period_ids: [1, 2, 3],
    period_start_date: '',
    period_end_date: '',
    subject_template_ids: [],
  }
}

async function archiveGroup(id: number) {
  if (!confirm('¿Ocultar este grupo de la vista principal?')) return
  await window.electronAPI.archiveGroup(id)
  toast.success('Grupo archivado.')
  await loadData()
}

async function restoreGroup(id: number) {
  await window.electronAPI.restoreGroup(id)
  toast.success('Grupo restaurado.')
  await loadData()
}

async function deleteGroup(id: number) {
  if (!confirm('¿Eliminar completamente este grupo? Esta acción no se puede deshacer.')) return
  await window.electronAPI.deleteGroup(id)
  toast.success('Grupo eliminado.')
  await loadData()
}

function openMigrateModal(group: any) {
  groupToMigrate.value = group
  migrateForm.value = { target_group_id: '', new_group_name: '' }
  showMigrateModal.value = true
}

async function migrateGroup() {
  if (!groupToMigrate.value) return
  try {
    await window.electronAPI.migrateGroup(groupToMigrate.value.id, JSON.parse(JSON.stringify(migrateForm.value)))
    toast.success('Grupo migrado correctamente.')
    showMigrateModal.value = false
    await loadData()
  } catch (e) {
    toast.error('Error al migrar el grupo.')
  }
}

const availableTargetGroups = computed(() => {
  if (!groupToMigrate.value) return []
  return groups.value.filter(g =>
    g.id !== groupToMigrate.value.id &&
    g.grade === groupToMigrate.value.grade &&
    !g.archived_at
  )
})

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Grupos</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">
          {{ activeGroups.length }} activo(s)
          <span v-if="archivedGroups.length"> • {{ archivedGroups.length }} archivado(s)</span>
        </p>
      </div>
      <div class="actions">
        <label class="flex items-center gap-2" style="font-size: 13px; cursor: pointer;">
          <input type="checkbox" v-model="showArchived" />
          Ver archivados
        </label>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Buscar grupo..."
            style="width: 200px;"
          />
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          + Nuevo Grupo
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid-3">
      <div v-for="i in 6" :key="i" class="card" style="height: 180px; animation: pulse 1.5s infinite;"></div>
    </div>

    <!-- Grupos activos -->
    <div v-else-if="activeGroups.length > 0" class="grid-3" style="margin-bottom: 28px;">
      <div
        v-for="group in activeGroups"
        :key="group.id"
        class="card card--glow group-card"
      >
        <div class="flex justify-between items-start" style="margin-bottom: 12px;">
          <div class="flex flex-col gap-1">
            <span class="badge badge-primary" style="font-size: 10px; padding: 2px 8px;">{{ group.cycle }}</span>
            <div class="flex gap-1" v-if="group.periods && group.periods.length">
              <span 
                v-for="p in group.periods" 
                :key="p.period" 
                class="badge" 
                :class="p.period === group.current_period ? 'badge-neutral' : 'badge-ghost'"
                style="font-size: 10px; padding: 1px 6px;"
              >
                T{{ p.period }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 items-center">
            <template v-for="s in (group.shift || '').split(',')" :key="s">
              <span class="badge" 
                v-if="s"
                :class="s === 'matutino' ? 'badge-info' : 'badge-warning'"
                :title="s === 'matutino' ? 'Turno Matutino 🌅' : 'Turno Vespertino 🌆'"
              >
                {{ s === 'matutino' ? '🌅 Turno Matutino' : '🌆 Turno Vespertino' }}
              </span>
            </template>
          </div>
        </div>

        <h3 style="margin-bottom: 4px; font-size: 1.2rem;">{{ group.grade }}° {{ group.name }}</h3>
        <p class="text-muted" style="font-size: 13px; margin-bottom: 12px;">
          {{ group.students_count || 0 }} alumnos
          <span v-if="group.subjects_list"> • {{ group.subjects_list }}</span>
        </p>

        <!-- Fechas de los períodos -->
        <div v-if="group.periods && group.periods.length" style="font-size: 11px; color: var(--text-muted); margin-bottom: 14px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 600; color: var(--text-secondary);">
            <span>📅 Trimestres:</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div v-for="p in group.periods" :key="p.period" style="display: flex; align-items: center; gap: 6px;">
              <span class="badge" :class="p.period === group.current_period ? 'badge-neutral' : 'badge-ghost'" style="font-size: 9px; padding: 1px 4px; min-width: 28px; text-align: center;">T{{ p.period }}</span>
              <span style="flex: 1;">{{ formatDate(p.start_date) || 'Sin fecha' }} — {{ formatDate(p.end_date) || 'Sin fecha' }}</span>
              <span v-if="p.period === group.current_period" style="font-size: 9px; color: var(--color-primary); font-weight: 600;">● Actual</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2" style="margin-top: auto; flex-wrap: wrap;">
          <button
            class="btn btn-secondary btn-sm"
            @click="router.push(`/groups/${group.id}/students`)"
          >
            👨‍🎓 Alumnos
          </button>
          <button
            class="btn btn-secondary btn-sm"
            @click="router.push(`/evaluation/${group.id}/subjects`)"
          >
            📝 Evaluar
          </button>
          <button
            class="btn btn-secondary btn-sm"
            @click="router.push(`/attendance/${group.id}/take`)"
          >
            ✅ Asistencia
          </button>
          <button class="btn btn-ghost btn-sm" @click="openEditModal(group)">Editar</button>
          <button class="btn btn-ghost btn-sm" @click="openMigrateModal(group)">Migrar</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--color-warning);" @click="archiveGroup(group.id)">Archivar</button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else-if="!loading && activeGroups.length === 0" class="empty-state">
      <div class="empty-state-icon">🏫</div>
      <h3>No hay grupos activos</h3>
      <p>Crea tu primer grupo para comenzar a registrar alumnos, asistencia y calificaciones.</p>
      <button class="btn btn-primary" style="margin-top: 20px;" @click="showCreateModal = true">
        + Crear Primer Grupo
      </button>
    </div>

    <!-- Grupos archivados -->
    <div v-if="showArchived && archivedGroups.length > 0" style="margin-top: 28px;">
      <h3 style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 16px;">Grupos Archivados</h3>
      <div class="grid-3">
        <div
          v-for="group in archivedGroups"
          :key="group.id"
          class="card"
          style="opacity: 0.7;"
        >
          <h4 style="margin-bottom: 4px;">{{ group.grade }}° {{ group.name }} <span style="color: var(--text-muted);">({{ group.cycle }})</span></h4>
          <p class="text-muted" style="font-size: 12px; margin-bottom: 12px;">{{ group.students_count || 0 }} alumnos</p>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" @click="restoreGroup(group.id)">Restaurar</button>
            <button class="btn btn-danger btn-sm" @click="deleteGroup(group.id)">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Grupo -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Grupo</h2>
          <button class="btn btn-ghost btn-icon" @click="showEditModal = false">✕</button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Letra del Grupo *</label>
              <input v-model="editForm.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Grado *</label>
              <select v-model="editForm.grade" class="form-select">
                <option v-for="g in [1,2,3,4,5,6]" :key="g" :value="String(g)">{{ g }}°</option>
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Ciclo Escolar *</label>
              <select v-model="editForm.cycle" class="form-select">
                <option v-for="c in cycles" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Turno <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" value="matutino" v-model="editForm.shifts" /> 🌅 Matutino
                </label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" value="vespertino" v-model="editForm.shifts" /> 🌆 Vespertino
                </label>
              </div>
            </div>
          </div>
          
          
          <div class="form-group">
            <label class="form-label">Materia <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list">
              <label v-for="t in subjectTemplates" :key="t.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                <input type="checkbox" :value="t.id" v-model="editForm.subject_template_ids" />
                {{ t.name }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list" style="max-height: 200px; overflow-y: auto;">
              <template v-if="editForm.cycle && trimestersByCycle.get(editForm.cycle)">
                <label v-for="t in trimestersByCycle.get(editForm.cycle)" :key="t.trimester_number" 
                       class="flex items-center gap-2" style="cursor: pointer; padding: 6px; background: rgba(0,0,0,0.02); border-radius: 4px; margin-bottom: 4px;">
                  <input type="checkbox" :value="t.trimester_number" v-model="editForm.period_ids" />
                  <span style="flex: 1;">
                    <strong>Trimestre {{ t.trimester_number }}</strong>
                    <span class="text-muted text-xs" style="display: block; font-size: 10px;">
                      {{ formatDate(t.start_date) || 'Sin fecha' }} — {{ formatDate(t.end_date) || 'Sin fecha' }}
                    </span>
                  </span>
                </label>
              </template>
              <template v-else>
                <p class="text-muted" style="font-size: 12px; padding: 8px;">Selecciona un ciclo escolar para ver los trimestres disponibles.</p>
              </template>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateGroup">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Crear Grupo -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nuevo Grupo</h2>
          <button class="btn btn-ghost btn-icon" @click="showCreateModal = false">✕</button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Letra del Grupo *</label>
              <input v-model="createForm.name" type="text" class="form-input" placeholder="Ej: A, B, Matutino..." />
            </div>
            <div class="form-group">
              <label class="form-label">Grado *</label>
              <select v-model="createForm.grade" class="form-select">
                <option v-for="g in [1,2,3,4,5,6]" :key="g" :value="String(g)">{{ g }}°</option>
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Ciclo Escolar *</label>
              <select v-model="createForm.cycle" class="form-select">
                <option value="" disabled>Selecciona un ciclo</option>
                <option v-for="c in cycles" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Turno <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" value="matutino" v-model="createForm.shifts" /> 🌅 Matutino
                </label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" value="vespertino" v-model="createForm.shifts" /> 🌆 Vespertino
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Materia (opcional) <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list">
              <label v-for="t in subjectTemplates" :key="t.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                <input type="checkbox" :value="t.id" v-model="createForm.subject_template_ids" />
                {{ t.name }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list" style="max-height: 200px; overflow-y: auto;">
              <template v-if="createForm.cycle && trimestersByCycle.get(createForm.cycle)">
                <label v-for="t in trimestersByCycle.get(createForm.cycle)" :key="t.trimester_number" 
                       class="flex items-center gap-2" style="cursor: pointer; padding: 6px; background: rgba(0,0,0,0.02); border-radius: 4px; margin-bottom: 4px;">
                  <input type="checkbox" :value="t.trimester_number" v-model="createForm.period_ids" />
                  <span style="flex: 1;">
                    <strong>Trimestre {{ t.trimester_number }}</strong>
                    <span class="text-muted text-xs" style="display: block; font-size: 10px;">
                      {{ formatDate(t.start_date) || 'Sin fecha' }} — {{ formatDate(t.end_date) || 'Sin fecha' }}
                    </span>
                  </span>
                </label>
              </template>
              <template v-else>
                <p class="text-muted" style="font-size: 12px; padding: 8px;">Selecciona un ciclo escolar para ver los trimestres disponibles.</p>
              </template>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createGroup" :disabled="creating">
            <span v-if="creating" class="spinner"></span>
            <span v-else>Crear Grupo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Migrar Grupo -->
    <div v-if="showMigrateModal" class="modal-overlay" @click.self="showMigrateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Migrar: {{ groupToMigrate?.grade }}° {{ groupToMigrate?.name }}</h2>
          <button class="btn btn-ghost btn-icon" @click="showMigrateModal = false">✕</button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Destino de Migración</label>
            <select v-model="migrateForm.target_group_id" class="form-select">
              <option value="">Crear Nuevo Grupo (Clonar)</option>
              <option v-for="g in availableTargetGroups" :key="g.id" :value="g.id">
                {{ g.grade }}° {{ g.name }} ({{ g.cycle }})
              </option>
            </select>
          </div>

          <div v-if="!migrateForm.target_group_id" class="form-group">
            <label class="form-label">Nombre del Nuevo Grupo</label>
            <input v-model="migrateForm.new_group_name" type="text" class="form-input" placeholder="Nombre del grupo de destino" />
          </div>

          <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: var(--radius); padding: 12px; font-size: 13px; color: #60a5fa;">
            <strong>Nota:</strong> Los alumnos, calificaciones y rúbricas se moverán al grupo destino. El grupo actual quedará archivado.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showMigrateModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="migrateGroup">Migrar Grupo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-card {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.badge-ghost {
  background: rgba(255,255,255,0.1);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
</style>
