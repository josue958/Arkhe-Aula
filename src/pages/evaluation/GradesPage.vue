<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'
import vuedraggable from 'vuedraggable'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

const props = defineProps<{ groupId: string; subjectId: string }>()
const router = useRouter()
const toast = useToastStore()

const data = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)
const unsavedStore = useUnsavedStore()
const activePeriod = ref(1)
const zoomLevel = ref(1)
const indicators = ref<any[]>([])

// Estado de ordenación y filtrado
const sortKey = ref('name')
const sortDir = ref<'asc' | 'desc'>('asc')
const filterQuery = ref('')

// Configuración de columnas visibles/movibles
const columnLayout = ref<string[]>(['status', 'attendance', 'performance', 'total'])
const savedSettings = ref<any[]>([]) 

// Mapa de calificaciones: { studentId: { activityId: score (string) } }
const gradesMap = ref<Record<number, Record<number, string>>>({})

// Estado de exportación
const showExportModal = ref(false)
const selectedExportColumns = ref<string[]>([])

const availableExportColumns = computed(() => {
  const cols = [
    { id: 'status', label: 'Estatus' },
    { id: 'attendance', label: 'Asistencia' },
    { id: 'performance', label: 'Desempeño' },
  ]
  rubricsForPeriod.value.forEach((r: any) => {
    cols.push({ id: `rubric_${r.id}`, label: r.name })
  })
  cols.push({ id: 'total', label: 'Calificación Final' })
  return cols
})

function toggleAllExportColumns(e: any) {
  if (e.target.checked) {
    selectedExportColumns.value = availableExportColumns.value.map(c => c.id)
  } else {
    selectedExportColumns.value = []
  }
}

async function confirmExport() {
  showExportModal.value = false
  await exportToExcel()
}

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [_data, _indicators] = await Promise.all([
      window.electronAPI.getEvaluationData(Number(props.groupId), JSON.parse(JSON.stringify(Number(props.subjectId)))),
      window.electronAPI.getIndicators()
    ])
    data.value = _data
    indicators.value = _indicators || []
    
    if (data.value) {
      activePeriod.value = data.value.group?.current_period || 1
      savedSettings.value = data.value.settings || []
      
      // Aplicar zoom guardado para el periodo actual
      const currentPeriodSettings = savedSettings.value.find(s => s.period_id === activePeriod.value)
      if (currentPeriodSettings) {
        zoomLevel.value = currentPeriodSettings.zoom_level || 1
      }

      syncLayout()
      
      const rawGrades = data.value.grades || {}
      const stringGrades: Record<number, Record<number, string>> = {}
      Object.entries(rawGrades).forEach(([sId, acts]: [any, any]) => {
        stringGrades[Number(sId)] = {}
        Object.entries(acts).forEach(([aId, score]: [any, any]) => {
          stringGrades[Number(sId)][Number(aId)] = String(score)
        })
      })
      gradesMap.value = stringGrades
      setTimeout(() => { hasChanges.value = false; unsavedStore.setDirty(false) }, 100)
    }
  } catch (e) {
    toast.error('Error al cargar las calificaciones.')
  }
  loading.value = false
}

const rubricsForPeriod = computed(() => {
  if (!data.value) return []
  return data.value.rubrics.filter((r: any) => r.period_id == activePeriod.value)
})

watch(gradesMap, () => {
  hasChanges.value = true
  unsavedStore.setDirty(true)
}, { deep: true })

function syncLayout() {
  if (!data.value) return
  
  const currentLevelRubrics = rubricsForPeriod.value.map((r: any) => `rubric_${r.id}`)
  const specialKeys = ['status', 'attendance', 'performance', 'total']
  
  // 1. Intentar cargar desde guardado
  const saved = savedSettings.value.find(s => s.period_id === activePeriod.value)
  if (saved && saved.column_layout) {
    try {
      const layout = JSON.parse(saved.column_layout) as string[]
      // Filtrar por si han cambiado las rubricas
      columnLayout.value = layout.filter(k => specialKeys.includes(k) || currentLevelRubrics.includes(k))
      
      // Agregar rubricas nuevas que no estén en el layout
      currentLevelRubrics.forEach((rk: string) => {
        if (!columnLayout.value.includes(rk)) {
           const totalIdx = columnLayout.value.indexOf('total')
           if (totalIdx !== -1) columnLayout.value.splice(totalIdx, 0, rk)
           else columnLayout.value.push(rk)
        }
      })
      
      // Asegurar especiales
      specialKeys.forEach(sk => {
        if (!columnLayout.value.includes(sk)) columnLayout.value.push(sk)
      })
      return
    } catch (e) { console.error("Error parsing saved layout", e)}
  }

  // 2. Si no hay guardado, inicializar con el orden por defecto
  if (columnLayout.value.length === 0 || !columnLayout.value.some(k => k.startsWith('rubric_'))) {
    columnLayout.value = ['status', 'attendance', 'performance', ...currentLevelRubrics, 'total']
    return
  }

  // 3. Fallback: Mantener pero actualizar (quitar viejas, poner nuevas)
  let newLayout = columnLayout.value.filter(k => 
    specialKeys.includes(k) || currentLevelRubrics.includes(k)
  )
  
  currentLevelRubrics.forEach((rk: string) => {
    if (!newLayout.includes(rk)) {
       const totalIdx = newLayout.indexOf('total')
       if (totalIdx !== -1) newLayout.splice(totalIdx, 0, rk)
       else newLayout.push(rk)
    }
  })
  
  specialKeys.forEach((sk: string) => {
     if (!newLayout.includes(sk)) newLayout.push(sk)
  })

  columnLayout.value = newLayout
}

// Watch rubrics or period to sync layout
import { watch } from 'vue'
watch([rubricsForPeriod, activePeriod], () => {
  // Al cambiar periodo, intentar cargar zoom guardado si existe en savedSettings
  const currentPeriodSettings = savedSettings.value.find(s => s.period_id === activePeriod.value)
  if (currentPeriodSettings) {
    zoomLevel.value = currentPeriodSettings.zoom_level || 1
  }
  syncLayout()
})

const rubricsMap = computed(() => {
  const map: Record<string, any> = {}
  rubricsForPeriod.value.forEach((r: any) => {
    map[`rubric_${r.id}`] = r
  })
  return map
})

function getGrade(studentId: number, activityId: number): string {
  const val = gradesMap.value[studentId]?.[activityId]
  if (val !== undefined) return val
  
  // Tanto para rúbricas extra como normales, usar la calificación mínima como valor por defecto
  const min = data.value?.grading_config?.setting_min_pass || 6
  return String(min)
}

function setGrade(student_id: number, activity_id: number, value: string) {
  if (!gradesMap.value[student_id]) gradesMap.value[student_id] = {}
  
  // Limpiar valor para permitir solo números y un decimal
  let cleanValue = value.replace(/[^0-9.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) cleanValue = parts[0] + '.' + parts.slice(1).join('')
  if (parts[1]?.length > 1) cleanValue = parts[0] + '.' + parts[1][0]
  
  const max = data.value?.grading_config?.setting_max_score || 10
  const num = parseFloat(cleanValue)
  
  if (!isNaN(num) && num > max) {
    cleanValue = String(max)
  }
  
  gradesMap.value[student_id][activity_id] = cleanValue
}

function calcStudentRubricAvg(studentId: number, rubric: any): number {
  if (!rubric.activities?.length) return 0
  // Usar siempre la calificación mínima configurada como valor por defecto (incluyendo extra)
  const min = data.value?.grading_config?.setting_min_pass || 6
  const scores = rubric.activities.map((a: any) => {
    const val = gradesMap.value[studentId]?.[a.id]
    return val === undefined || val === '' ? min : parseFloat(val)
  })
  return scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
}

function calcStudentRubricPuntaje(studentId: number, rubric: any): number {
  if (rubric.is_extra) return calcStudentRubricAvg(studentId, rubric);
  if (!data.value?.grading_config) return 0;
  
  const w = rubric.percentage || 0;
  const min = data.value.grading_config.setting_min_pass || 6;
  const maxSys = data.value.grading_config.setting_max_score || 10;
  const s = calcStudentRubricAvg(studentId, rubric);

  const x = maxSys - min;
  const p = w;
  if (x <= 0) return 0;
  const a = p / x;
  const b = -a * min;

  const puntaje = a * s + b;
  return Math.round(puntaje * 10) / 10;
}

function calcStudentTotal(studentId: number): number {
  let total = 0
  rubricsForPeriod.value.forEach((rubric: any) => {
    total += calcStudentRubricPuntaje(studentId, rubric);
  })
  const min = data.value?.grading_config?.setting_min_pass || 6
  const finalScore = total + min
  return Math.round(finalScore * 10) / 10
}

const getPerformanceStatus = (score: number) => {
  if (!indicators.value || indicators.value.length === 0) {
    if (score >= 8) return { label: 'Bueno', color: 'bg-success', hex: '#10b981' }
    if (score >= 6) return { label: 'Regular', color: 'bg-warning', hex: '#f59e0b' }
    return { label: 'Insuficiente', color: 'bg-danger', hex: '#ef4444' }
  }
  
  const found = indicators.value.find(ind => score >= ind.min_value && score <= ind.max_value)
  if (found) {
    return { label: found.label, color: '', hex: found.color }
  }
  return { label: indicators.value[0].label, color: '', hex: indicators.value[0].color }
}

function moveFocusDown(e: Event) {
  const target = e.target as HTMLInputElement;
  const currentCell = target.closest('td');
  const currentRow = target.closest('tr');
  if (!currentCell || !currentRow) return;

  const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
  const nextRow = currentRow.nextElementSibling;
  
  if (nextRow) {
    const nextCell = nextRow.children[cellIndex];
    if (nextCell) {
      const input = nextCell.querySelector('input');
      if (input) {
        (input as HTMLInputElement).focus();
        (input as HTMLInputElement).select();
      }
    }
  } else {
    target.blur();
  }
}

const sortedAndFilteredStudents = computed(() => {
  if (!data.value?.students) return []
  
  let list = [...data.value.students]
  
  // Filtrado
  if (filterQuery.value) {
    const q = filterQuery.value.toLowerCase()
    list = list.filter(s => {
      const name = `${s.paternal_surname} ${s.maternal_surname} ${s.first_name}`.toLowerCase()
      const status = (s.status_name || '').toLowerCase()
      return name.includes(q) || status.includes(q)
    })
  }
  
  // Ordenación
  list.sort((a, b) => {
    let valA: any = ''
    let valB: any = ''
    
    if (sortKey.value === 'name') {
      valA = `${a.paternal_surname} ${a.maternal_surname} ${a.first_name}`
      valB = `${b.paternal_surname} ${b.maternal_surname} ${b.first_name}`
    } else if (sortKey.value === 'status') {
      valA = a.status_name || ''
      valB = b.status_name || ''
    } else if (sortKey.value === 'attendance') {
      valA = a.today_attendance || ''
      valB = b.today_attendance || ''
    } else if (sortKey.value === 'performance' || sortKey.value === 'total') {
      valA = calcStudentTotal(a.id)
      valB = calcStudentTotal(b.id)
    }
    
    if (valA < valB) return sortDir.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
  
  return list
})

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function moveColumn(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= columnLayout.value.length) return
  const temp = columnLayout.value[index]
  columnLayout.value[index] = columnLayout.value[newIndex]
  columnLayout.value[newIndex] = temp
}

async function moveRubric(id: number, direction: 'left' | 'right') {
  await window.electronAPI.moveRubric({ rubricId: id, direction })
  await loadData()
}

async function moveActivity(id: number, direction: 'left' | 'right') {
  await window.electronAPI.moveActivity({ activityId: id, direction })
  await loadData()
}

async function saveGrades() {
  saving.value = true
  try {
    const grades: any[] = []
    Object.entries(gradesMap.value).forEach(([studentId, activities]) => {
      Object.entries(activities).forEach(([activityId, val]) => {
        // Usar siempre la calificación mínima como valor por defecto (incluyendo rúbricas extra)
        const defaultScore = data.value?.grading_config?.setting_min_pass || 6
        const score = val === '' ? defaultScore : parseFloat(val as string)
        grades.push({ student_id: Number(studentId), activity_id: Number(activityId), score })
      })
    })

    // Guardar ajustes de vista (layout y zoom)
    const settings = [{
      period_id: activePeriod.value,
      column_layout: JSON.stringify(columnLayout.value),
      zoom_level: zoomLevel.value
    }]

    await Promise.all([
      window.electronAPI.saveGrades({ grades }),
      window.electronAPI.saveGradesSettings({ subjectId: Number(props.subjectId), settings })
    ])

    // Actualizar savedSettings localmente para que syncLayout lo use
    const existingIdx = savedSettings.value.findIndex(s => s.period_id === activePeriod.value)
    if (existingIdx !== -1) {
      savedSettings.value[existingIdx].column_layout = JSON.stringify(columnLayout.value)
      savedSettings.value[existingIdx].zoom_level = zoomLevel.value
    } else {
      savedSettings.value.push({
        period_id: activePeriod.value,
        column_layout: JSON.stringify(columnLayout.value),
        zoom_level: zoomLevel.value
      })
    }

    toast.success('Cambios y ajustes guardados correctamente.')
    hasChanges.value = false
    unsavedStore.setDirty(false)
  } catch (e) {
    toast.error('Error al guardar los cambios.')
  }
  saving.value = false
}

async function addRubric() {
  const name = prompt('Nombre de la rúbrica:')
  if (!name) return
  const pct = prompt('Porcentaje (0-100):') || '100'
  await window.electronAPI.createRubric({
    subject_id: Number(props.subjectId),
    name,
    percentage: Number(pct),
    period_id: activePeriod.value,
  })
  await loadData()
}

async function addActivity(rubricId: number) {
  const name = prompt('Nombre de la actividad:')
  if (!name) return
  await window.electronAPI.createActivity({ rubric_id: rubricId, name, period_id: JSON.parse(JSON.stringify(activePeriod.value)) })
  await loadData()
}

async function deleteRubric(id: number) {
  if (!confirm('¿Eliminar esta rúbrica y todas sus actividades?')) return
  await window.electronAPI.deleteRubric(String(id))
  await loadData()
}

async function deleteActivity(id: number) {
  if (!confirm('¿Eliminar esta actividad?')) return
  await window.electronAPI.deleteActivity(String(id))
  await loadData()
}


async function exportToExcel() {
  if (!data.value) return
  
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Calificaciones')
  
  const schoolResult = await window.electronAPI.getSchool()

  // Pre-calcular cabeceras para saber el ancho total
  const headers = ['No', 'NOMBRE DEL ALUMNO']
  const filteredLayout = columnLayout.value.filter(k => selectedExportColumns.value.includes(k))
  filteredLayout.forEach(colKey => {
    if (colKey === 'status') headers.push('ESTADO')
    else if (colKey === 'attendance') headers.push('ASIST.')
    else if (colKey === 'performance') headers.push('DESEMPEÑO')
    else if (colKey === 'total') headers.push('CALIFICACIÓN')
    else if (colKey.startsWith('rubric_')) {
      const rubric = rubricsMap.value[colKey]
        if (rubric) {
          rubric.activities.forEach((a: any) => headers.push(a.name.toUpperCase()))
          headers.push(`P. ${rubric.name.toUpperCase()} (${rubric.percentage || 0})`)
        }
    }
  })
  const lastColIdx = headers.length

  // 1. Logos (Estado Izquierda, Escuela Derecha)
  const addLogoToSheet = (base64OrBuffer: any, mimeType: string, isLeft: boolean) => {
    if (!base64OrBuffer) return;
    try {
      const extension = (mimeType?.split('/')[1] || 'png') as any;
      let finalBase64;
      let finalBuffer;
      if (typeof base64OrBuffer === 'string') {
        finalBase64 = base64OrBuffer.includes('base64,') ? base64OrBuffer.split('base64,')[1] : base64OrBuffer;
      } else if (base64OrBuffer instanceof Uint8Array) {
        finalBuffer = base64OrBuffer;
      } else if (base64OrBuffer?.type === 'Buffer' && Array.isArray(base64OrBuffer.data)) {
        finalBuffer = new Uint8Array(base64OrBuffer.data);
      } else {
        finalBuffer = new Uint8Array(base64OrBuffer);
      }
      
      const imageId = workbook.addImage({
        base64: finalBase64,
        buffer: finalBuffer,
        extension: extension,
      } as any);
      worksheet.addImage(imageId, {
        tl: { col: isLeft ? 0 : lastColIdx - 1, row: 0 },
        ext: { width: 60, height: 60 }
      });
    } catch (e) {
      console.error('Error adding logo to Excel:', e);
    }
  };

  addLogoToSheet(schoolResult?.state_logo, schoolResult?.state_logo_mime, true);
  addLogoToSheet(schoolResult?.logo, schoolResult?.logo_mime, false);

  // 2. Títulos
  worksheet.mergeCells(1, 1, 1, lastColIdx)
  const title1 = worksheet.getCell(1, 1)
  title1.value = (schoolResult?.name || 'ESCUELA SECUNDARIA').toUpperCase()
  title1.font = { bold: true, size: 14 }
  title1.alignment = { horizontal: 'center' }

  worksheet.mergeCells(2, 1, 2, lastColIdx)
  const title2 = worksheet.getCell(2, 1)
  title2.value = 'CONTROL DE EVALUACIÓN FORMATIVA'
  title2.font = { bold: true, size: 12 }
  title2.alignment = { horizontal: 'center' }

  // 3. Metadata
  const currentUser = await window.electronAPI.getCurrentUser()
  worksheet.getRow(4).values = [
    'PROFESOR (A):', (currentUser?.name || '').toUpperCase(), '', 
    'DICIPLINA:', (data.value.subject?.name || '').toUpperCase(), 
    'GRADO:', data.value.group?.grade || '', 
    'GRUPO:', data.value.group?.name || '', 
    'Trimestre:', activePeriod.value, 
    'TURNO:', (data.value.group?.shift || '').toUpperCase()
  ]
  worksheet.getRow(4).font = { bold: true, size: 9 }

  // 4. Cabeceras de Tabla (ya calculadas arriba)
  const headerRow = worksheet.getRow(6)
  headerRow.values = headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 }
    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  })
  headerRow.height = 100

  // 5. Datos de Alumnos
  sortedAndFilteredStudents.value.forEach((student, idx) => {
    const rowData = [idx + 1, `${student.paternal_surname} ${student.maternal_surname} ${student.first_name}`.toUpperCase()]
    
    filteredLayout.forEach(colKey => {
      if (colKey === 'status') rowData.push(student.status_name || '')
      else if (colKey === 'attendance') rowData.push(student.today_attendance === 'present' ? 'P' : student.today_attendance === 'absent' ? 'F' : 'R')
      else if (colKey === 'performance') rowData.push(getPerformanceStatus(calcStudentTotal(student.id)).label)
      else if (colKey === 'total') rowData.push(calcStudentTotal(student.id))
      else if (colKey.startsWith('rubric_')) {
        const rubric = rubricsMap.value[colKey]
        if (rubric) {
          rubric.activities.forEach((a: any) => {
            const score = getGrade(student.id, a.id)
            rowData.push(score === '' ? 0 : parseFloat(score))
          })
          rowData.push(calcStudentRubricPuntaje(student.id, rubric))
        }
      }
    })
    const row = worksheet.addRow(rowData)
    row.eachCell(cell => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
    })
    
    // Estilo para alumnos de baja
    if (student.status_name === 'Baja') {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }
        cell.font = { color: { argb: 'FFFF0000' } }
      })
    }
  })

  // Estética final
  worksheet.getColumn(1).width = 5
  worksheet.getColumn(2).width = 40

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = `Evaluacion_${data.value.group?.grade}${data.value.group?.name}_T${activePeriod.value}_${new Date().toISOString().slice(0,10)}.xlsx`
  saveAs(new Blob([buffer]), fileName)
  toast.success('Reporte exportado correctamente.')
}
</script>

<template>
  <div>
    <div class="page-header" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
      <div>
        <h2 style="font-size: 1.5rem;">Calificaciones</h2>
        <p class="text-muted" style="font-size: 12px; margin-top: 2px;" v-if="data">
          {{ data.group?.grade }}° {{ data.group?.name }} • {{ data.subject?.name }}
        </p>
      </div>
      <div class="actions" style="gap: 8px;">
        <div class="zoom-controls" style="padding: 2px 8px; margin-right: 4px;">
          <button class="btn btn-ghost btn-xs" @click="zoomLevel = Math.max(0.5, zoomLevel - 0.05)">➖</button>
          <span style="font-size: 10px; font-weight: 700; min-width: 35px; text-align: center;">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="btn btn-ghost btn-xs" @click="zoomLevel = Math.min(1.5, zoomLevel + 0.05)">➕</button>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push(`/evaluation/${groupId}/subjects`)">← Volver</button>
        <button class="btn btn-secondary btn-sm" @click="() => { selectedExportColumns = availableExportColumns.map(c => c.id); showExportModal = true }">📥 Exportar</button>
        <button class="btn btn-primary btn-sm" @click="saveGrades" :disabled="saving || !hasChanges">
          <span v-if="saving" class="spinner"></span>
          <span v-else>💾 Guardar todo</span>
        </button>
      </div>
    </div>

    <!-- Modal de Exportación -->
    <div v-if="showExportModal" class="modal-overlay" style="z-index: 1000;">
      <div class="modal-content" style="max-width: 450px;">
        <h3 style="margin-bottom: 8px;">Configurar Exportación</h3>
        <p class="text-muted" style="font-size: 13px; margin-bottom: 20px;">
          Selecciona las columnas que deseas incluir en el reporte Excel para el <b>Trimestre {{ activePeriod }}</b>.
        </p>
        
        <div style="margin-bottom: 12px; padding: 10px; background: var(--bg-elevated); border-radius: 8px; border: 1px solid var(--border);">
          <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; font-size: 14px;">
            <input type="checkbox" @change="toggleAllExportColumns" :checked="selectedExportColumns.length === availableExportColumns.length" />
            Todas las columnas
          </label>
        </div>

        <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          <label v-for="col in availableExportColumns" :key="col.id" style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; padding: 4px;">
            <input type="checkbox" v-model="selectedExportColumns" :value="col.id" />
            {{ col.label }}
          </label>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px;">
          <button class="btn btn-ghost" @click="showExportModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmExport" :disabled="selectedExportColumns.length === 0">Generar Excel</button>
        </div>
      </div>
    </div>

    <!-- Filtro y Controles de Columna -->
    <div class="card" style="padding: 8px 12px; margin-bottom: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <div class="search-bar" style="flex: 1; min-width: 200px; display: flex; align-items: center; position: relative;">
        <span class="search-icon" style="font-size: 14px; position: absolute; left: 10px; z-index: 2; pointer-events: none;">🔍</span>
        <input v-model="filterQuery" type="text" placeholder="Filtrar..." class="form-input" style="padding: 6px 8px 6px 32px !important; font-size: 12px; width: 100%; box-sizing: border-box;" />
      </div>
      <div class="column-manager" style="flex: 3;">
        <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-right: 8px;">Orden (Arrastra para reordenar):</span>
        <vuedraggable 
          v-model="columnLayout" 
          item-key="id"
          class="col-pill-container"
          handle=".drag-handle"
        >
          <template #item="{ element: col }">
            <div class="col-pill drag-handle" style="padding: 4px 8px; cursor: grab;">
              <span v-if="col === 'status'">Estatus</span>
              <span v-else-if="col === 'attendance'">Asist.</span>
              <span v-else-if="col === 'performance'">Semaforo</span>
              <span v-else-if="col === 'total'">Final</span>
              <span v-else-if="col.startsWith('rubric_')" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
                {{ rubricsForPeriod.find((r: any) => `rubric_${r.id}` === col)?.name || 'R' }}
              </span>
              <span style="font-size: 10px; margin-left: 4px; opacity: 0.5;">⋮⋮</span>
            </div>
          </template>
        </vuedraggable>
      </div>
    </div>

    <!-- Tabs de períodos -->
    <div class="tabs" v-if="data">
      <button
        v-for="p in [1, 2, 3]"
        :key="p"
        class="tab"
        :class="{ active: activePeriod === p }"
        @click="activePeriod = p"
      >
        Trimestre {{ p }}
      </button>
    </div>

    <!-- Tabla de calificaciones -->
    <div v-if="loading" class="empty-state">
      <div class="spinner" style="width: 40px; height: 40px; border-width: 3px;"></div>
    </div>

    <div v-else-if="data" class="table-container">
      <table class="data-table" :style="{ transformOrigin: 'top left', transform: `scale(${zoomLevel})` }">
        <thead>
          <tr>
            <th style="position: sticky; left: 0; background: var(--bg-elevated); z-index: 5; width: 40px; text-align: center; padding: 6px 4px; font-size: 11px;">
              No.
            </th>
            <th 
              @click="toggleSort('name')" 
              style="position: sticky; left: 40px; background: var(--bg-elevated); z-index: 5; min-width: 200px; padding: 6px 10px; cursor: pointer; font-size: 11px;"
            >
              Alumno {{ sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
            </th>
            
            <template v-for="colKey in columnLayout" :key="colKey">
              <th v-if="colKey === 'status'" @click="toggleSort('status')" style="text-align: center; width: 80px; font-size: 10px; cursor: pointer;">
                Est. {{ sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th v-else-if="colKey === 'attendance'" @click="toggleSort('attendance')" style="text-align: center; width: 60px; font-size: 10px; cursor: pointer;">
                Asist. {{ sortKey === 'attendance' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th v-else-if="colKey === 'performance'" @click="toggleSort('performance')" style="text-align: center; width: 90px; font-size: 10px; cursor: pointer;">
                Aprovech. {{ sortKey === 'performance' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <th v-else-if="colKey === 'total'" @click="toggleSort('total')" style="text-align: center; width: 70px; font-size: 10px; background: rgba(99,102,241,0.1); color: var(--color-primary); cursor: pointer;">
                Final {{ sortKey === 'total' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
              </th>
              <template v-else-if="colKey.startsWith('rubric_')">
                <template v-if="rubricsMap[colKey]">
                  <th
                    v-for="activity in rubricsMap[colKey].activities"
                    :key="activity.id"
                    style="text-align: center; min-width: 100px; max-width: 150px; font-size: 11px; padding: 6px; white-space: normal; line-height: 1.2; word-wrap: break-word;"
                  >
                    <div class="header-act-name" :title="activity.name">
                      {{ activity.name }}
                    </div>
                  </th>
                  <th style="text-align: center; min-width: 60px; font-size: 11px; background-color: var(--color-warning); color: #000; font-weight: 800; border-left: 2px solid rgba(0,0,0,0.1);">
                    P. {{ rubricsMap[colKey].name.substring(0,8) }} ({{ rubricsMap[colKey].percentage || 0 }})
                  </th>
                </template>
              </template>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in sortedAndFilteredStudents" :key="student.id">
            <td style="position: sticky; left: 0; background: var(--bg-surface); z-index: 4; text-align: center; font-size: 10px; color: var(--text-muted); border-right: 1px solid var(--border);">
              {{ index + 1 }}
            </td>
            <td style="position: sticky; left: 40px; background: var(--bg-surface); z-index: 4; font-weight: 600; font-size: 11px; padding: 4px 10px;">
              {{ student.paternal_surname }} {{ student.maternal_surname }}, {{ student.first_name }}
            </td>
            
            <template v-for="colKey in columnLayout" :key="colKey">
              <td v-if="colKey === 'status'" style="text-align: center; padding: 2px;">
                <span class="badge" 
                  v-if="student.status_name"
                  :style="{ backgroundColor: student.status_color || '#eee', color: '#fff', fontSize: '9px', padding: '2px 4px' }"
                >
                  {{ student.status_name }}
                </span>
              </td>
              <td v-else-if="colKey === 'attendance'" style="text-align: center; font-size: 1em; padding: 2px;">
                <span v-if="student.today_attendance === 'present'">✅</span>
                <span v-else-if="student.today_attendance === 'absent'">❌</span>
                <span v-else-if="student.today_attendance === 'late'">⏱</span>
                <span v-else style="color: var(--text-muted); font-size: 10px;">-</span>
              </td>
              <td v-else-if="colKey === 'performance'" style="text-align: center; padding: 2px;">
                <span class="badge" 
                  :class="getPerformanceStatus(calcStudentTotal(student.id)).color"
                  :style="getPerformanceStatus(calcStudentTotal(student.id)).hex ? { backgroundColor: getPerformanceStatus(calcStudentTotal(student.id)).hex, color: '#fff' } : { color: '#fff' }"
                  style="font-size: 9px; padding: 2px 6px;"
                >
                  {{ getPerformanceStatus(calcStudentTotal(student.id)).label }}
                </span>
              </td>
              <td v-else-if="colKey === 'total'" style="text-align: center; font-weight: 800; font-size: 12px; padding: 2px; background-color: var(--color-warning); color: #000;">
                {{ calcStudentTotal(student.id).toFixed(1) }}
              </td>
              <template v-else-if="colKey.startsWith('rubric_')">
                <template v-if="rubricsMap[colKey]">
                  <td
                    v-for="activity in rubricsMap[colKey].activities"
                    :key="activity.id"
                    style="text-align: center; padding: 1px;"
                  >
                    <input
                      type="text"
                      class="grade-input no-spin"
                      :value="getGrade(student.id, activity.id)"
                      @focus="(e) => (e.target as HTMLInputElement).select()"
                      @keydown.enter.prevent="moveFocusDown"
                      @input="e => setGrade(student.id, activity.id, (e.target as HTMLInputElement).value)"
                      style="font-size: 11px; width: 35px; padding: 2px; text-align: center;"
                    />
                  </td>
                  <td style="text-align: center; font-size: 11px; font-weight: 800; padding: 2px; background-color: rgba(245, 158, 11, 0.4); border-left: 2px solid rgba(0,0,0,0.1); color: var(--text-main);">
                    {{ calcStudentRubricPuntaje(student.id, rubricsMap[colKey]).toFixed(1) }}
                  </td>
                </template>
              </template>
            </template>
          </tr>
        </tbody>
      </table>

      <div v-if="rubricsForPeriod.length === 0" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No hay rúbricas para el Trimestre {{ activePeriod }}</h3>
        <p>Agrega una rúbrica para comenzar a registrar calificaciones.</p>
        <p style="margin-top: 16px;">Ve a Configuración > Evaluación Formativa para agregar elementos de evaluación.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
}

.header-rubric-ctrl {
  background: rgba(99,102,241,0.05);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-primary);
  font-weight: 800;
  margin-bottom: 4px;
}

.header-act-name {
  color: var(--text-main);
  font-weight: 500;
}

.col-pill-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: thin;
}

.col-pill-container::-webkit-scrollbar {
  height: 4px;
}

.col-pill-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.col-pill {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.col-pill:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.col-arrows button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  color: var(--color-primary);
  font-size: 10px;
}

.col-arrows button:disabled { color: var(--text-muted); cursor: default; }

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  padding: 4px 12px;
  border-radius: 8px;
  margin-right: 12px;
}

.perf-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
}

.grade-input {
  width: 35px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 4px;
  text-align: center;
  background: var(--bg-surface);
  color: var(--text-main);
  transition: border-color 0.2s;
}

.grade-input:focus {
  border-color: var(--color-primary);
  outline: none;
  background: var(--bg-elevated);
}

.no-spin::-webkit-inner-spin-button,
.no-spin::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spin {
  -moz-appearance: textfield;
  appearance: textfield;
}

.semaphore {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.2);
}

.bg-success { background-color: #22c55e !important; }
.bg-warning { background-color: #f59e0b !important; }
.bg-danger { background-color: #ef4444 !important; }
</style>
