<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const groups = ref<any[]>([])
const subjects = ref<any[]>([])
const loading = ref(false)
const filters = ref({ 
  group_id: '', 
  date_from: '', 
  date_to: '',
  turno: '',
  subject_id: '',
  trimester: ''
})
const reportData = ref<any[]>([])
const generated = ref(false)
const school = ref<any>(null)
const currentUser = ref<any>(null)

onMounted(async () => {
  const [groupsData, schoolData, userData] = await Promise.all([
    window.electronAPI.getAttendanceGroups(),
    window.electronAPI.getSchool(),
    window.electronAPI.getCurrentUser()
  ])
  groups.value = groupsData
  school.value = schoolData
  currentUser.value = userData

  if (route.query.group && route.query.trimester) {
    filters.value.group_id = String(route.query.group)
    filters.value.trimester = String(route.query.trimester)
    setTimeout(() => {
        if (route.query.auto === '1') {
            generateReport().then(() => {
                exportToExcel()
            })
        }
    }, 500)
  }
})

watch(() => filters.value.group_id, async (newVal) => {
  if (newVal) {
    subjects.value = await window.electronAPI.getSettingsSubjectsForGroup(Number(newVal))
    const selectedGroup = groups.value.find(g => g.id === Number(newVal))
    if (selectedGroup) {
      filters.value.turno = selectedGroup.shift || ''
    }
  }
})

watch(() => filters.value.trimester, async (newVal) => {
  if (newVal) {
    const cycle = groups.value.find(g => g.id === Number(filters.value.group_id))?.cycle_id
    if (cycle) {
      const trimesters = await window.electronAPI.getTrimesters(cycle)
      const tData = trimesters.find((t: any) => t.trimester_number === Number(newVal))
      if (tData) {
        filters.value.date_from = tData.start_date
        filters.value.date_to = tData.end_date
      }
    }
  }
})

async function generateReport() {
  if (!filters.value.group_id) {
    toast.warning('Selecciona un grupo para generar el reporte.')
    return
  }
  loading.value = true
  try {
    reportData.value = await window.electronAPI.getAttendanceReport(JSON.parse(JSON.stringify(filters.value)))
    generated.value = true
  } catch (e) {
    toast.error('Error al generar el reporte.')
  }
  loading.value = false
}

const uniqueDates = computed(() => {
  const datesSet = new Set<string>()
  reportData.value.forEach(att => datesSet.add(att.date))
  return Array.from(datesSet).sort()
})

const pivoTable = computed(() => {
  const map: Record<number, any> = {}
  reportData.value.forEach(att => {
    if (!map[att.student_id]) {
      map[att.student_id] = {
        id: att.student_id,
        name: `${att.paternal_surname} ${att.maternal_surname} ${att.first_name}`.trim(),
        status_name: att.status_name,
        attendances: {},
        present: 0,
        absent: 0,
        late: 0,
        total: 0
      }
    }
    map[att.student_id].attendances[att.date] = att.status
    if (att.status === 'present') map[att.student_id].present++
    else if (att.status === 'absent') map[att.student_id].absent++
    else if (att.status === 'late') map[att.student_id].late++
    map[att.student_id].total++
  })
  return Object.values(map).sort((a: any, b: any) => a.name.localeCompare(b.name))
})

function getStatusChar(status: string) {
  if (!status) return ''
  if (status === 'present') return '1'
  if (status === 'absent') return ''
  if (status === 'late') return 'R'
  return ''
}

async function exportToExcel() {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Asistencia')

  const students = pivoTable.value
  const dates = uniqueDates.value
  const selectedGroup = groups.value.find(g => g.id === Number(filters.value.group_id))
  const selectedSubject = subjects.value.find(s => s.id === Number(filters.value.subject_id))

  // 1. Logos (Estado Izquierda, Escuela Derecha)
  const lastCol = Math.max(12, 3 + dates.length);
  const addLogoToSheet = (base64OrBuffer: any, mimeType: string, isLeft: boolean) => {
    if (!base64OrBuffer) return;
    try {
      const extension = (mimeType?.split('/')[1] || 'png') as any;
      let finalBase64;
      let finalBuffer;
      if (typeof base64OrBuffer === 'string') {
        // En caso de que contenga el data URI se lo quitamos por si acaso, aunque normalmente SettingsPage lo guarda limpio
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
        tl: { col: isLeft ? 0 : lastCol - 1, row: 0 },
        ext: { width: 60, height: 60 }
      });
    } catch (e) {
      console.error('Error adding logo to Excel (Attendance):', e);
    }
  };

  addLogoToSheet(school.value?.state_logo, school.value?.state_logo_mime, true);
  addLogoToSheet(school.value?.logo, school.value?.logo_mime, false);

  // 2. Encabezados
  worksheet.mergeCells(1, 1, 1, lastCol);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = school.value?.name || 'ESCUELA SECUNDARIA TECNICA'
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }
  worksheet.getRow(1).height = 40 // Espacio para los logos

  worksheet.mergeCells(2, 1, 2, lastCol);
  const subTitleCell = worksheet.getCell(2, 1);
  subTitleCell.value = 'CONTROL DE ASISTENCIAS / INASISTENCIAS'
  subTitleCell.font = { bold: true, size: 12 }
  subTitleCell.alignment = { horizontal: 'center' }

  // 3. Metadata Row
  const metaRow = worksheet.getRow(4)
  metaRow.values = [
    'PROFESOR (A):', (currentUser.value?.name || '___________________________').toUpperCase(), '', 'DICIPLINA:', (selectedSubject?.name || '_______').toUpperCase(), 'GRADO:', selectedGroup?.grade || '', 'GRUPO:', selectedGroup?.name || '', 'Trimestre:', filters.value.trimester || '', 'TURNO:', (filters.value.turno || '').toUpperCase()
  ]
  metaRow.font = { size: 8, bold: true }

  // 4. Tabla Header
  const headerRowValues = ['No.', 'NOMBRE DEL ALUMNO', ...dates.map(d => d.split('-').reverse().join('/')), 'TOTAL FALTAS', 'ESTATUS']
  const headerRow = worksheet.getRow(6)
  headerRow.values = headerRowValues
  headerRow.font = { bold: true, size: 7 }
  headerRow.height = 60 // Para las fechas verticales
  
  headerRow.eachCell((cell, colNum) => {
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (colNum > 2 && colNum <= 2 + dates.length) {
      cell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' }
    }
  })

  // 5. Datos
  students.forEach((s, idx) => {
    const isBaja = s.status_name?.toLowerCase().includes('baja')
    const isActive = s.status_name?.toLowerCase().includes('activo') || s.status_name?.toLowerCase() === 'activa'
    const isOther = !isBaja && !isActive && s.status_name

    const rowData = [
      idx + 1,
      s.name,
      ...dates.map(d => getStatusChar(s.attendances[d])),
      s.absent,
      isOther ? s.status_name : ''
    ]
    const row = worksheet.addRow(rowData)
    row.font = { size: 8 }
    row.height = 15
    
    row.eachCell((cell, colNum) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      if (colNum > 2) cell.alignment = { horizontal: 'center' }
    })

    if (isBaja) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 8 }
      })
    } else if (isOther) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      })
    }
  })

  // Ajustes de columna
  worksheet.getColumn(1).width = 4
  worksheet.getColumn(2).width = 40
  dates.forEach((_, i) => {
    worksheet.getColumn(3 + i).width = 3
  })
  worksheet.getColumn(3 + dates.length).width = 10
  worksheet.getColumn(lastCol).width = 10 // Garantiza que la última columna exista visualmente para alojar el logo

  const buffer = await workbook.xlsx.writeBuffer()
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const fileName = `ReporteAsistencias_${selectedGroup?.grade || ''}${selectedGroup?.name || ''}_${dateStr}.xlsx`;
  
  saveAs(new Blob([buffer]), fileName)
  toast.success('Reporte exportado correctamente.')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Reporte de Asistencia</h2>
      <div class="actions">
        <button class="btn btn-ghost" @click="router.push('/attendance')">← Regresar</button>
        <button v-if="generated" class="btn btn-secondary" @click="generated = false">Refrescar</button>
        <button v-if="generated" class="btn btn-primary" @click="exportToExcel">📥 Exportar Excel</button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 16px; font-size: 1rem;">Filtros de Reporte</h3>
      <div class="grid-4" style="gap: 16px;">
        <div class="form-group">
          <label class="form-label">Grupo *</label>
          <select v-model="filters.group_id" class="form-select">
            <option value="" disabled>Selecciona un grupo</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.grade }}° {{ g.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Materia</label>
          <select v-model="filters.subject_id" class="form-select" :disabled="!filters.group_id">
            <option value="">Todas</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Trimestre</label>
          <select v-model="filters.trimester" class="form-select">
            <option value="">Seleccionar...</option>
            <option value="1">Trimestre I</option>
            <option value="2">Trimestre II</option>
            <option value="3">Trimestre III</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Turno</label>
          <select v-model="filters.turno" class="form-select">
            <option value="matutino">Matutino</option>
            <option value="vespertino">Vespertino</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Desde</label>
          <input v-model="filters.date_from" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Hasta</label>
          <input v-model="filters.date_to" type="date" class="form-input" />
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <button class="btn btn-primary" @click="generateReport" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>🔍 Generar Reporte</span>
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="generated" class="card" style="padding: 0; overflow: auto; max-height: 70vh;">
      <table v-if="pivoTable.length > 0" class="data-table">
        <thead>
          <tr class="header-frozen">
            <th style="width: 40px; position: sticky; left: 0; z-index: 10; background: var(--bg-elevated);">#</th>
            <th style="min-width: 250px; position: sticky; left: 40px; z-index: 10; background: var(--bg-elevated);">Alumno</th>
            
            <!-- Columnas de fechas -->
            <th v-for="date in uniqueDates" :key="date" class="date-col">
              {{ date.split('-').slice(1).reverse().join('/') }}
            </th>

            <th style="text-align: center; color: var(--color-success); background: var(--bg-elevated);">✓</th>
            <th style="text-align: center; color: var(--color-danger); background: var(--bg-elevated);">✕</th>
            <th style="text-align: center; color: var(--color-warning); background: var(--bg-elevated);">⏱</th>
            <th style="text-align: center; background: var(--bg-elevated);">%</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in pivoTable" :key="row.id" :class="{'row-baja': row.status_name?.toLowerCase().includes('baja')}">
            <td class="text-muted" style="position: sticky; left: 0; background: inherit; z-index: 2;">{{ idx + 1 }}</td>
            <td style="font-weight: 500; position: sticky; left: 40px; background: inherit; z-index: 2;">
              {{ row.name }}
              <span v-if="row.status_name?.toLowerCase().includes('baja')" class="badge badge-danger btn-sm" style="margin-left: 8px;">BAJA</span>
            </td>
            
            <td v-for="date in uniqueDates" :key="date" style="text-align: center;">
              <span v-if="row.attendances[date] === 'present'" class="att-present">✓</span>
              <span v-else-if="row.attendances[date] === 'absent'" class="att-absent">✕</span>
              <span v-else-if="row.attendances[date] === 'late'" class="att-warning">⏱</span>
              <span v-else class="text-muted" style="opacity: 0.2;">-</span>
            </td>

            <td style="text-align: center; color: var(--color-success); font-weight: 600; background: inherit;">{{ row.present }}</td>
            <td style="text-align: center; color: var(--color-danger); font-weight: 600; background: inherit;">{{ row.absent }}</td>
            <td style="text-align: center; color: var(--color-warning); font-weight: 600; background: inherit;">{{ row.late }}</td>
            <td style="text-align: center; background: inherit;">
              <span class="badge" :class="(row.present / Math.max(row.total, 1)) >= 0.8 ? 'badge-success' : 'badge-danger'">
                {{ row.total > 0 ? Math.round((row.present / row.total) * 100) : 0 }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>Sin registros</h3>
        <p>No hay asistencias registradas para los filtros seleccionados.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  border-collapse: separate;
  border-spacing: 0;
}

.header-frozen th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bg-elevated);
}

.date-col {
  min-width: 45px;
  max-width: 45px;
  font-size: 10px;
  text-align: center;
  padding: 8px 4px !important;
  border-left: 1px solid var(--border);
}

.att-present { color: var(--color-success); font-weight: bold; }
.att-absent  { color: var(--color-danger); font-weight: bold; }
.att-warning { color: var(--color-warning); font-weight: bold; }

.row-baja {
  background: rgba(239, 68, 68, 0.1) !important;
  color: var(--color-danger);
}

tr:hover td {
  background: var(--bg-hover) !important;
}
</style>
