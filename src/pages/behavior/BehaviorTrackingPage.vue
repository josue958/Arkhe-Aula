<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const props = defineProps({
  groupId: { type: String, required: true }
})

const router = useRouter()
const toast = useToastStore()
const unsaved = useUnsavedStore()

const group = ref<any>(null)
const students = ref<any[]>([])
const loading = ref(true)

const selectedDate = ref(new Date().toISOString().slice(0, 10))

const behaviorData = ref<Record<number, { type: 'good' | 'bad' | 'neutral', obs: string }>>({})
const reportDialog = ref({ open: false, trimester: '1' })
const exporting = ref(false)

onMounted(async () => {
  await loadData()
})

watch(selectedDate, async () => {
  await loadRecordsForDate()
})

async function loadData() {
  loading.value = true
  const [gData, sData] = await Promise.all([
    window.electronAPI.getGroup(Number(props.groupId)),
    window.electronAPI.getStudents(Number(props.groupId))
  ])
  group.value = gData
  students.value = sData.filter((s:any) => s.status_name !== 'Baja')
  
  await loadRecordsForDate()
  loading.value = false
}

async function loadRecordsForDate() {
  behaviorData.value = {}
  students.value.forEach(s => {
    behaviorData.value[s.id] = { type: 'neutral', obs: '' }
  })

  try {
    const records = await window.electronAPI.getBehaviorRecords(Number(props.groupId), selectedDate.value)
    if (records && records.length) {
      records.forEach((r: any) => {
        if (behaviorData.value[r.student_id]) {
          behaviorData.value[r.student_id] = { type: r.behavior_type, obs: r.observations || '' }
        }
      })
    }
  } catch(e) {
    console.error(e)
  }
}

function setBehavior(studentId: number, type: 'good' | 'bad' | 'neutral') {
  if (behaviorData.value[studentId]) {
    behaviorData.value[studentId].type = type
    unsaved.setDirty(true)
  }
}

function focusOutObs() {
   // Al perder foco, podríamos marcar unsaved pero ya está v-model atado al save.
}

async function saveGroupBehavior() {
  const records = students.value.map(s => {
    return {
      student_id: s.id,
      behavior_type: behaviorData.value[s.id].type,
      observations: behaviorData.value[s.id].obs
    }
  })

  try {
    await window.electronAPI.saveBehaviorRecords(Number(props.groupId), selectedDate.value, records)
    unsaved.setDirty(false)
    toast.success('Conducta guardada correctamente')
  } catch (e) {
    toast.error('Error al guardar conducta')
  }
}

function goBack() {
  if (unsaved.isDirty) {
     if (!window.confirm('Hay cambios sin guardar. ¿Deseas salir?')) return
  }
  unsaved.setDirty(false)
  router.push('/behavior')
}

async function exportBehaviorReport() {
  exporting.value = true
  try {
    const data = await window.electronAPI.getBehaviorReport(Number(props.groupId), Number(reportDialog.value.trimester))
    if (!data.students || data.students.length === 0) {
      toast.warning('No hay alumnos para exportar.')
      exporting.value = false
      return
    }

    const records = data.records || []
    
    // Identificar fechas únicas
    const uniqueDates: string[] = Array.from(new Set(records.map((r: any) => r.date))).sort() as string[]

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reporte de Conducta')

    const headers = ['No.', 'Nombre del Alumno']
    uniqueDates.forEach((d: string) => headers.push(d))
    headers.push('Total Mal comportamiento', 'Observaciones')
    ws.addRow(headers)

    // Estilos del encabezado
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
    ws.getRow(1).alignment = { horizontal: 'center' }

    data.students.forEach((student: any, idx: number) => {
      const row: any[] = [
        idx + 1,
        `${student.paternal_surname} ${student.maternal_surname} ${student.first_name}`.trim()
      ]

      let badCount = 0
      let obsList: string[] = []

      uniqueDates.forEach((d: string) => {
        const _rec = records.find((r: any) => r.student_id === student.id && r.date === d)
        if (_rec) {
          if (_rec.behavior_type === 'good') row.push('B')
          else if (_rec.behavior_type === 'neutral') row.push('N')
          else if (_rec.behavior_type === 'bad') {
            row.push('M')
            badCount++
          } else row.push('')

          if (_rec.observations?.trim()) {
            obsList.push(`[${d}] ${_rec.observations.trim()}`)
          }
        } else {
          row.push('')
        }
      })

      row.push(badCount)
      row.push(obsList.join(' | '))

      ws.addRow(row)
    })

    // Ajustar columnas
    ws.getColumn(2).width = 40
    uniqueDates.forEach((_, i) => { ws.getColumn(i + 3).width = 12 })
    ws.getColumn(uniqueDates.length + 3).width = 25
    ws.getColumn(uniqueDates.length + 4).width = 60

    const buffer = await wb.xlsx.writeBuffer()
    const cycleName = group.value?.cycle || 'Ciclo'
    const fileName = `Conducta_${group.value?.grade}_${group.value?.name}_Trim_${reportDialog.value.trimester}.xlsx`
    saveAs(new Blob([buffer]), fileName)

    toast.success('Reporte exportado correctamente.')
    reportDialog.value.open = false
  } catch (e) {
    console.error(e)
    toast.error('Error al exportar reporte de conducta.')
  }
  exporting.value = false
}
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando seguimiento de conducta...</p>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <button class="btn btn-ghost btn-sm" @click="goBack" style="margin-bottom: 8px;">← Volver</button>
        <h2>Seguimiento de Conducta</h2>
        <p class="text-muted">{{ group?.grade }}° {{ group?.name }} - {{ group?.shift }}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" @click="reportDialog.open = true">📊 Reporte</button>
        <label class="form-label mb-0" style="margin-left: 10px;">Fecha:</label>
        <input 
          type="date" 
          class="form-input" 
          v-model="selectedDate" 
          style="width: 150px;" 
        />
        <button class="btn btn-primary" @click="saveGroupBehavior">💾 Guardar Conducta</button>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: auto; max-width: 1000px; margin: 0 auto;">
      <table class="data-table">
        <thead>
          <tr class="header-frozen">
            <th style="width: 50px;">No.</th>
            <th style="min-width: 250px;">Nombre del Alumno</th>
            <th style="width: 180px; text-align: center;">Comportamiento</th>
            <th style="min-width: 250px;">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in students" :key="student.id">
            <td class="text-muted" style="text-align: center;">{{ index + 1 }}</td>
            <td style="font-weight: 500;">
              {{ student.paternal_surname }} {{ student.maternal_surname }} {{ student.first_name }}
            </td>
            
            <td style="text-align: center;">
              <div class="behavior-toggles">
                <button 
                  class="btn-icon circle"
                  :class="{ 'btn-success': behaviorData[student.id].type === 'good' }"
                  @click="setBehavior(student.id, 'good')"
                  title="Buen comportamiento"
                >
                  👼
                </button>
                <button 
                  class="btn-icon circle"
                  :class="{ 'btn-warning': behaviorData[student.id].type === 'neutral' }"
                  @click="setBehavior(student.id, 'neutral')"
                  title="Comportamiento neutral"
                >
                  😐
                </button>
                <button 
                  class="btn-icon circle"
                  :class="{ 'btn-danger': behaviorData[student.id].type === 'bad' }"
                  @click="setBehavior(student.id, 'bad')"
                  title="Mal comportamiento"
                >
                  👿
                </button>
              </div>
            </td>

            <td>
              <input 
                type="text" 
                class="form-input w-full" 
                v-model="behaviorData[student.id].obs"
                placeholder="Descripción del incidente..."
                @input="unsaved.setDirty(true)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Reporte -->
    <div v-if="reportDialog.open" class="modal-overlay" style="z-index: 1000;" @click.self="reportDialog.open = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Exportar Reporte de Conducta</h3>
          <button class="btn btn-ghost btn-icon" @click="reportDialog.open = false">✕</button>
        </div>
        <p class="text-muted" style="margin-bottom: 16px;">Selecciona el trimestre a exportar.</p>
        
        <div class="form-group" style="margin-bottom: 24px;">
          <label class="form-label">Trimestre</label>
          <select v-model="reportDialog.trimester" class="form-select">
            <option value="1">Trimestre I</option>
            <option value="2">Trimestre II</option>
            <option value="3">Trimestre III</option>
          </select>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="reportDialog.open = false">Cancelar</button>
          <button class="btn btn-primary" @click="exportBehaviorReport" :disabled="exporting">
            <span v-if="exporting" class="spinner"></span>
            <span v-else>Exportar Excel</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex !important;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--bg-card);
  padding: 24px;
  border-radius: var(--radius);
  margin-bottom: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.behavior-toggles {
  display: inline-flex;
  gap: 8px;
  background: var(--bg-hover);
  padding: 4px;
  border-radius: 20px;
}

.btn-icon.circle {
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
  background: transparent;
  opacity: 0.6;
}

.btn-icon.circle:hover {
  opacity: 0.9;
  background: var(--bg-elevated);
}

.btn-success {
  background: var(--color-success) !important;
  opacity: 1 !important;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.btn-warning {
  background: var(--color-warning) !important;
  opacity: 1 !important;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
}

.btn-danger {
  background: var(--color-danger) !important;
  opacity: 1 !important;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}
</style>
