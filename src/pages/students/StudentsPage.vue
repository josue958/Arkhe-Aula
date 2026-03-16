<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToastStore } from '@/stores/toast'
import * as XLSX from 'xlsx'

const props = defineProps<{ groupId: string }>()
const toast = useToastStore()

const group = ref<any>(null)
const students = ref<any[]>([])
const statuses = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedIds = ref<number[]>([])
const bulkEnrolledAt = ref(new Date().toISOString().slice(0, 10))

// Modales
// Modales
const showAddModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const editStudent = ref<any>(null)
const saving = ref(false)

// Modal: Separación de nombres
const showSeparatorModal = ref(false)
const separatorRawText = ref('')
const separatorSearch = ref('')
const separatorData = ref<{ id: number, paterno: string, materno: string, nombres: string }[]>([])

const addForm = ref({
  first_name: '',
  paternal_surname: '',
  maternal_surname: '',
  curp: '',
  email: '',
  phone: '',
  birth_date: '',
  gender: '',
  student_status_id: null as number | null,
  enrolled_at: new Date().toISOString().slice(0, 10),
})

const separatorSelectedIds = ref<number[]>([])

function toggleSelectSeparator(id: number) {
  const i = separatorSelectedIds.value.indexOf(id)
  if (i === -1) separatorSelectedIds.value.push(id)
  else separatorSelectedIds.value.splice(i, 1)
}

function toggleSelectAllSeparator() {
  if (separatorSelectedIds.value.length === filteredSeparatorData.value.length) {
    separatorSelectedIds.value = []
  } else {
    separatorSelectedIds.value = filteredSeparatorData.value.map(s => s.id)
  }
}

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const q = searchQuery.value.toLowerCase()
  return students.value.filter(s =>
    s.first_name?.toLowerCase().includes(q) ||
    s.paternal_surname?.toLowerCase().includes(q) ||
    s.maternal_surname?.toLowerCase().includes(q)
  )
})

const defaultStatus = computed(() => statuses.value.find(s => s.is_default))

const filteredSeparatorData = computed(() => {
  if (!separatorSearch.value) return separatorData.value
  const q = separatorSearch.value.toLowerCase()
  return separatorData.value.filter(s =>
    s.paterno.toLowerCase().includes(q) ||
    s.materno.toLowerCase().includes(q) ||
    s.nombres.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [groupData, studentsData, statusesData] = await Promise.all([
      window.electronAPI.getGroup(Number(props.groupId)),
      window.electronAPI.getStudents(Number(props.groupId)),
      window.electronAPI.getStatuses(),
    ])
    group.value = groupData
    students.value = studentsData
    statuses.value = statusesData
    addForm.value.student_status_id = defaultStatus.value?.id || null
  } catch (e) {
    toast.error('Error al cargar los alumnos.')
  }
  loading.value = false
}

async function addStudent() {
  if (!addForm.value.first_name || !addForm.value.paternal_surname) {
    toast.warning('Nombre y apellido paterno son requeridos.')
    return
  }
  saving.value = true
  try {
    await window.electronAPI.createStudent({ ...addForm.value, group_id: Number(props.groupId) })
    toast.success('Alumno agregado correctamente.')
    showAddModal.value = false
    resetForm()
    await loadData()
  } catch (e) {
    toast.error('Error al agregar el alumno.')
  }
  saving.value = false
}

async function saveEdit() {
  if (!editStudent.value) return
  saving.value = true
  try {
    await window.electronAPI.updateStudent(editStudent.value.id, JSON.parse(JSON.stringify(editStudent.value)))
    toast.success('Alumno actualizado.')
    showEditModal.value = false
    await loadData()
  } catch (e) {
    toast.error('Error al actualizar el alumno.')
  }
  saving.value = false
}

function openEdit(student: any) {
  editStudent.value = { ...student }
  showEditModal.value = true
}

async function deleteStudent(id: number) {
  if (!confirm('¿Eliminar este alumno? Se perderán sus calificaciones y asistencias.')) return
  await window.electronAPI.deleteStudent(id)
  toast.success('Alumno eliminado.')
  await loadData()
}

async function bulkDelete() {
  if (!confirm(`¿Eliminar ${selectedIds.value.length} alumno(s)?`)) return
  await window.electronAPI.bulkDeleteStudents(JSON.parse(JSON.stringify(selectedIds.value)))
  selectedIds.value = []
  toast.success('Alumnos eliminados.')
  await loadData()
}

async function bulkSetStatus(statusId: number) {
  await window.electronAPI.bulkUpdateStudentStatus(JSON.parse(JSON.stringify(selectedIds.value)), statusId)
  selectedIds.value = []
  toast.success('Estatus actualizado.')
  await loadData()
}

async function bulkSetEnrolledAt() {
  if (!bulkEnrolledAt.value) return
  await window.electronAPI.bulkUpdateStudentEnrolledAt(JSON.parse(JSON.stringify(selectedIds.value)), bulkEnrolledAt.value)
  selectedIds.value = []
  toast.success('Fecha de alta actualizada.')
  await loadData()
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleSelectAll() {
  if (selectedIds.value.length === filteredStudents.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredStudents.value.map(s => s.id)
  }
}

function resetForm() {
  addForm.value = {
    first_name: '', paternal_surname: '', maternal_surname: '',
    curp: '', email: '', phone: '', birth_date: '', gender: '',
    student_status_id: defaultStatus.value?.id || null,
    enrolled_at: new Date().toISOString().slice(0, 10),
  }
}

// Importar desde Excel
async function handleExcelImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

      // Asumir columnas: Apellido Paterno | Apellido Materno | Nombre(s)
      const students = rows.slice(1).filter(row => row[0] || row[2]).map(row => ({
        paternal_surname: String(row[0] || '').trim(),
        maternal_surname: String(row[1] || '').trim(),
        first_name: String(row[2] || '').trim(),
      }))

      const result = await window.electronAPI.importStudentsFromExcel({
        groupId: Number(props.groupId),
        students,
      })
      toast.success(`${result.imported} alumno(s) importados correctamente.`)
      showImportModal.value = false
      await loadData()
    } catch (err) {
      toast.error('Error al importar el archivo.')
    }
  }
  reader.readAsArrayBuffer(file)
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Apellido Paterno', 'Apellido Materno', 'Nombre(s)'],
    ['García', 'López', 'Juan'],
    ['Martínez', 'Sánchez', 'María'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alumnos')
  XLSX.writeFile(wb, 'plantilla_alumnos.xlsx')
}

function getStatusColor(statusColor: string) {
  return statusColor || '#6b7280'
}

function processSeparatorData() {
  if (!separatorRawText.value) return
  const lines = separatorRawText.value.split('\n').filter(l => l.trim())
  
  const newData = lines.map((line, index) => {
    const parts = line.trim().toUpperCase().split(/\s+/)
    let paterno = '', materno = '', nombres = ''
    
    if (parts.length >= 3) {
      paterno = parts[0]
      materno = parts[1]
      nombres = parts.slice(2).join(' ')
    } else if (parts.length === 2) {
      paterno = parts[0]
      materno = ''
      nombres = parts[1]
    } else if (parts.length === 1) {
      paterno = parts[0]
      materno = ''
      nombres = ''
    }
    
    return {
      id: Date.now() + index,
      paterno,
      materno,
      nombres
    }
  })
  
  separatorData.value = [...separatorData.value, ...newData]
  separatorSelectedIds.value = [...separatorSelectedIds.value, ...newData.map(d => d.id)]
  separatorRawText.value = ''
  toast.success('Nombres procesados.')
}

function removeSeparatorRow(id: number) {
  separatorData.value = separatorData.value.filter(item => item.id !== id)
  separatorSelectedIds.value = separatorSelectedIds.value.filter(sid => sid !== id)
}

function clearSeparatorTable() {
  if (confirm('¿Deseas limpiar toda la tabla?')) {
    separatorData.value = []
    separatorSelectedIds.value = []
  }
}

function exportSeparatorData() {
  const ws = XLSX.utils.json_to_sheet(
    separatorData.value.map(r => ({
      'Apellido Paterno': r.paterno,
      'Apellido Materno': r.materno,
      'Nombre(s)': r.nombres
    }))
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Nombres_Separados')
  XLSX.writeFile(wb, 'Nombres_Separados.xlsx')
}

async function insertSeparatorToGroup() {
  const toImport = separatorData.value.filter(s => separatorSelectedIds.value.includes(s.id))
  if (toImport.length === 0) {
    toast.warning('Selecciona alumnos para importar.')
    return
  }
  saving.value = true
  try {
    const students = toImport.map(row => ({
      first_name: row.nombres,
      paternal_surname: row.paterno,
      maternal_surname: row.materno,
      enrolled_at: new Date().toISOString().slice(0, 10),
    }))
    const result = await window.electronAPI.importStudentsFromExcel({
      groupId: Number(props.groupId),
      students,
    })
    toast.success(`${result.imported} alumno(s) agregados al grupo.`)
    showSeparatorModal.value = false
    separatorData.value = []
    separatorSelectedIds.value = []
    await loadData()
  } catch (err) {
    toast.error('Error al agregar alumnos.')
  }
  saving.value = false
}

function copySeparatorData() {
  const tableRows = separatorData.value.map(row => 
    `${row.paterno}\t${row.materno}\t${row.nombres}`
  ).join('\n')
  navigator.clipboard.writeText(tableRows)
  toast.success('Copiado al portapapeles.')
}

function updateVal(row: any, field: string, event: Event) {
  row[field] = (event.target as HTMLElement).innerText.trim().toUpperCase()
}
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn btn-ghost btn-icon" @click="$router.back()" title="Regresar">←</button>
          <h2 style="margin: 0;">Alumnos</h2>
        </div>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;" v-if="group">
          {{ group.grade }}° {{ group.name }} • {{ group.cycle }}
          — {{ students.length }} alumno(s)
        </p>
      </div>
      <div class="actions">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" class="form-input" placeholder="Buscar alumno..." style="width: 200px;" />
        </div>
        <button class="btn btn-secondary" @click="showSeparatorModal = true">✂️ Separación de nombres</button>
        <button class="btn btn-secondary" @click="showImportModal = true">📥 Importar Excel</button>
        <button class="btn btn-primary" @click="showAddModal = true">+ Agregar Alumno</button>
      </div>
    </div>

    <!-- Acciones en masa -->
    <div v-if="selectedIds.length > 0" class="bulk-actions">
      <span>{{ selectedIds.length }} seleccionado(s)</span>
      <div class="flex gap-2">
        <select class="form-select" style="width: auto;" @change="e => bulkSetStatus(Number((e.target as HTMLSelectElement).value))">
          <option value="" disabled selected>Cambiar estatus...</option>
          <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <div class="flex items-center gap-2" style="background: var(--bg-card); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border);">
          <span class="text-xs text-muted">Alta:</span>
          <input type="date" v-model="bulkEnrolledAt" class="form-input" style="padding: 4px; height: auto;" />
          <button class="btn btn-primary btn-sm" @click="bulkSetEnrolledAt">Aplicar</button>
        </div>
        <button class="btn btn-danger btn-sm" @click="bulkDelete">Eliminar selección</button>
        <button class="btn btn-ghost btn-sm" @click="selectedIds = []">Cancelar</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <table class="data-table" v-if="!loading && filteredStudents.length > 0">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" @change="toggleSelectAll"
                :checked="selectedIds.length === filteredStudents.length && filteredStudents.length > 0" />
            </th>
            <th>#</th>
            <th>Apellido Paterno</th>
            <th>Apellido Materno</th>
            <th>Nombre(s)</th>
            <th>CURP</th>
            <th>Estatus</th>
            <th>Fecha Alta</th>
            <th>Fecha Baja</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, idx) in filteredStudents" :key="student.id">
            <td>
              <input type="checkbox"
                :checked="selectedIds.includes(student.id)"
                @change="toggleSelect(student.id)" />
            </td>
            <td class="text-muted">{{ idx + 1 }}</td>
            <td>{{ student.paternal_surname }}</td>
            <td>{{ student.maternal_surname }}</td>
            <td style="font-weight: 500;">{{ student.first_name }}</td>
            <td class="text-muted" style="font-size: 12px;">{{ student.curp || '—' }}</td>
            <td>
              <span class="badge" :style="{ background: getStatusColor(student.status_color) + '30', color: getStatusColor(student.status_color) }">
                {{ student.status_name || 'Sin estatus' }}
              </span>
            </td>
            <td class="text-muted" style="font-size: 12px;">{{ student.enrolled_at || '—' }}</td>
            <td class="text-muted" style="font-size: 12px;">{{ student.dropped_at || '—' }}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" @click="openEdit(student)">✏️</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteStudent(student.id)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="empty-state">
        <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon">👨‍🎓</div>
        <h3>No hay alumnos</h3>
        <p>Agrega alumnos manualmente o importa desde un archivo Excel.</p>
        <div class="flex gap-2 justify-center" style="margin-top: 16px;">
          <button class="btn btn-primary" @click="showAddModal = true">+ Agregar Alumno</button>
          <button class="btn btn-secondary" @click="showImportModal = true">📥 Importar Excel</button>
        </div>
      </div>
    </div>

    <!-- Modal: Agregar Alumno -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Agregar Alumno</h2>
          <button class="btn btn-ghost btn-icon" @click="showAddModal = false">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="grid-3">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label">Nombre(s) *</label>
              <input v-model="addForm.first_name" type="text" class="form-input" placeholder="Nombre(s)" autofocus />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido Paterno *</label>
              <input v-model="addForm.paternal_surname" type="text" class="form-input" placeholder="Apellido Paterno" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido Materno</label>
              <input v-model="addForm.maternal_surname" type="text" class="form-input" placeholder="Apellido Materno" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">CURP</label>
              <input v-model="addForm.curp" type="text" class="form-input" placeholder="CURP" style="text-transform: uppercase;" />
            </div>
            <div class="form-group">
              <label class="form-label">Género</label>
              <select v-model="addForm.gender" class="form-select">
                <option value="">Sin especificar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Nacimiento</label>
              <input v-model="addForm.birth_date" type="date" class="form-input" />
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Estatus</label>
                  <select v-model="addForm.student_status_id" class="form-select">
                    <option :value="null">Ninguno</option>
                    <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Alta</label>
                  <input v-model="addForm.enrolled_at" type="date" class="form-input" />
                </div>
              </div>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input v-model="addForm.phone" type="tel" class="form-input" placeholder="Teléfono" />
            </div>
            <div class="form-group">
              <label class="form-label">Correo</label>
              <input v-model="addForm.email" type="email" class="form-input" placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="addStudent" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>Agregar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Alumno -->
    <div v-if="showEditModal && editStudent" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Alumno</h2>
          <button class="btn btn-ghost btn-icon" @click="showEditModal = false">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="grid-3">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label">Nombre(s) *</label>
              <input v-model="editStudent.first_name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido Paterno *</label>
              <input v-model="editStudent.paternal_surname" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido Materno</label>
              <input v-model="editStudent.maternal_surname" type="text" class="form-input" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">CURP</label>
              <input v-model="editStudent.curp" type="text" class="form-input" style="text-transform: uppercase;" />
            </div>
            <div class="form-group">
              <label class="form-label">Estatus</label>
              <select v-model="editStudent.student_status_id" class="form-select">
                <option :value="null">Ninguno</option>
                <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Alta</label>
              <input v-model="editStudent.enrolled_at" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Nacimiento</label>
              <input v-model="editStudent.birth_date" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Género</label>
              <select v-model="editStudent.gender" class="form-select">
                <option value="">Sin especificar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Baja</label>
              <input v-model="editStudent.dropped_at" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input v-model="editStudent.phone" type="tel" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>Guardar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Importar Excel -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Importar Alumnos desde Excel</h2>
          <button class="btn btn-ghost btn-icon" @click="showImportModal = false">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); padding: 16px; border-radius: var(--radius); font-size: 13px; color: #60a5fa;">
            <p><strong>Formato esperado del archivo:</strong></p>
            <p>Columna A: Apellido Paterno | Columna B: Apellido Materno | Columna C: Nombre(s)</p>
            <p style="margin-top: 8px;">La primera fila se considera encabezado y se omite.</p>
          </div>
          <button class="btn btn-secondary" @click="downloadTemplate">📥 Descargar Plantilla</button>
          <div class="form-group">
            <label class="form-label">Seleccionar archivo Excel</label>
            <input type="file" accept=".xlsx,.xls,.csv" class="form-input" @change="handleExcelImport" style="padding: 8px;" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showImportModal = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Separación de nombres -->
    <div v-if="showSeparatorModal" class="modal-overlay" @click.self="showSeparatorModal = false">
      <div class="modal" style="max-width: 900px; width: 90%; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h2>Separación de Nombres</h2>
          <button class="btn btn-ghost btn-icon" @click="showSeparatorModal = false">✕</button>
        </div>
        
        <div class="flex gap-4" style="flex: 1; overflow: hidden; margin-top: 10px;">
          <!-- Columna Izquierda: Carga -->
          <div style="flex: 0 0 250px; display: flex; flex-direction: column; gap: 12px;">
            <label class="form-label" style="margin: 0;">Carga Masiva</label>
            <p style="font-size: 11px; margin: 0; color: var(--text-muted); line-height: 1.4;">
              Pega la lista de nombres uno por línea.<br/>
              (Paterno Materno Nombres)
            </p>
            <textarea
              v-model="separatorRawText"
              class="form-input"
              style="flex: 1; resize: none; white-space: pre-wrap; font-family: monospace; font-size: 13px;"
              placeholder="Ej:
GARCIA LOPEZ JUAN
MARTINEZ MARIA..."
            ></textarea>
            <button class="btn btn-primary" @click="processSeparatorData" :disabled="!separatorRawText">Procesar Nombres</button>
          </div>
          
          <!-- Columna Derecha: Tabla -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
            <div class="flex items-center gap-2 justify-between">
              <div class="search-bar" style="flex: 1; max-width: 300px;">
                <span class="search-icon">🔍</span>
                <input v-model="separatorSearch" type="text" class="form-input btn-sm" placeholder="Buscar..." />
              </div>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" @click="copySeparatorData" title="Copiar"><span style="font-size:16px;">📋</span> Copiar</button>
                <button class="btn btn-secondary btn-sm" @click="exportSeparatorData" title="Exportar XLSX"><span style="font-size:16px;">📥</span> Exportar</button>
                <button class="btn btn-primary btn-sm" @click="insertSeparatorToGroup" :disabled="saving" title="Agregar Grupo"><span v-if="saving" class="spinner"></span><span v-else style="font-size:16px;">➕</span> Insertar a Grupo</button>
                <button class="btn btn-danger btn-sm" @click="clearSeparatorTable" title="Limpiar"><span style="font-size:16px;">🗑️</span> Limpiar</button>
              </div>
            </div>
            
            <div class="card" style="padding: 0; overflow: auto; flex: 1;">
              <table class="data-table" v-if="filteredSeparatorData.length > 0">
                <thead style="position: sticky; top: 0; z-index: 10;">
                  <tr>
                    <th style="width: 40px; text-align: center;">
                      <input type="checkbox"
                        :checked="filteredSeparatorData.length > 0 && separatorSelectedIds.length === filteredSeparatorData.length"
                        @change="toggleSelectAllSeparator" />
                    </th>
                    <th>#</th>
                    <th>Apellido Paterno</th>
                    <th>Apellido Materno</th>
                    <th>Nombre(s)</th>
                    <th style="width: 60px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in filteredSeparatorData" :key="row.id">
                    <td style="text-align: center;">
                      <input type="checkbox" 
                        :checked="separatorSelectedIds.includes(row.id)"
                        @change="toggleSelectSeparator(row.id)" />
                    </td>
                    <td class="text-muted" style="width: 40px;">{{ idx + 1 }}</td>
                    <td contenteditable="true" @blur="updateVal(row, 'paterno', $event)" style="outline: none; cursor: text;">{{ row.paterno }}</td>
                    <td contenteditable="true" @blur="updateVal(row, 'materno', $event)" style="outline: none; cursor: text;">{{ row.materno }}</td>
                    <td contenteditable="true" @blur="updateVal(row, 'nombres', $event)" style="outline: none; cursor: text;">{{ row.nombres }}</td>
                    <td>
                      <button class="btn btn-ghost btn-icon btn-sm" style="color: var(--color-danger);" @click="removeSeparatorRow(row.id)">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="flex items-center justify-center text-muted" style="height: 100%; min-height: 200px;">
                Carga la lista a la izquierda para comenzar.
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="margin-top: 16px;">
          <button class="btn btn-secondary" @click="showSeparatorModal = false">Cerrar Ventana</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: var(--radius);
  padding: 12px 20px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #818cf8;
}
</style>
