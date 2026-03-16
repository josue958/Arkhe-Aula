<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast = useToastStore()

const activeTab = ref('horario')

// --- LÓGICA DE HORARIO --- 
const isMixed = ref(false)

const normalSlots = [
  { id: 'h1', time: '07:00 - 07:50', isBreak: false },
  { id: 'h2', time: '07:50 - 08:40', isBreak: false },
  { id: 'h3', time: '08:40 - 09:30', isBreak: false },
  { id: 'h4', time: '09:30 - 10:20', isBreak: false },
  { id: 'r1', time: '10:20 - 10:40', isBreak: true, label: 'RECESO' },
  { id: 'h5', time: '10:40 - 11:30', isBreak: false },
  { id: 'h6', time: '11:30 - 12:20', isBreak: false },
  { id: 'h7', time: '12:20 - 13:10', isBreak: false },
  { id: 'h8', time: '13:10 - 14:00', isBreak: false }
]

const mixedExtraSlots = [
  { id: 'r2', time: '14:00 - 14:20', isBreak: true, label: 'RECESO' },
  { id: 'h9', time: '14:20 - 15:10', isBreak: false },
  { id: 'h10', time: '15:10 - 16:00', isBreak: false },
  { id: 'h11', time: '16:00 - 16:50', isBreak: false },
  { id: 'h12', time: '16:50 - 17:40', isBreak: false }
]

const allSlots = computed(() => {
  return isMixed.value ? [...normalSlots, ...mixedExtraSlots] : normalSlots
})

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

interface ScheduleEntry {
  slotId: string
  day: string
  groupId: number
  groupLabel: string
  subjectId: number
  subjectName: string
  color: string
}

const entries = ref<ScheduleEntry[]>([])

// Selectores para agregar clases
const groups = ref<any[]>([])
const selectedGroupId = ref<number | null>(null)
const subjectsList = ref<any[]>([])
const selectedSubjectId = ref<number | null>(null)
const selectedDay = ref<string>('')
const selectedSlotId = ref<string>('')


const evalSelectedGroupId = ref<number | null>(null)
const evalSubjectsList = ref<any[]>([])
const evalSelectedSubjectId = ref<number | null>(null)
const evalStats = ref<any>({
  1: { inscritos: '', altas: '', bajas: '', evaluados: '', aprobados: '', reprobados: null, pctAprobados: '', pctReprobados: '', promedio: '' },
  2: { inscritos: '', altas: '', bajas: '', evaluados: '', aprobados: '', reprobados: null, pctAprobados: '', pctReprobados: '', promedio: '' },
  3: { inscritos: '', altas: '', bajas: '', evaluados: '', aprobados: '', reprobados: null, pctAprobados: '', pctReprobados: '', promedio: '' },
  global: { evaluados: '', aprobados: null, reprobados: null, pctAprobados: '', pctReprobados: '', promedio: '' }
})
const evalLoading = ref(false)

const cycles = ref<any[]>([])
const selectedCycle = ref<number | null>(null)
const selectedTrimester = ref<number | null>(null)

const threeAbsences = ref<any[]>([])
const moreThanThreeAbsences = ref<any[]>([])
const failingStudentsList = ref<any[]>([])
const loadingAlerts = ref(false)

const insuficienteSearch = ref('')
const insuficienteSortKey = ref('name')
const insuficienteSortAsc = ref(true)

const setInsuficienteSort = (key: string) => {
  if (insuficienteSortKey.value === key) {
    insuficienteSortAsc.value = !insuficienteSortAsc.value
  } else {
    insuficienteSortKey.value = key
    insuficienteSortAsc.value = true
  }
}

const filteredFailingStudents = computed(() => {
  let list = failingStudentsList.value || []
  if (insuficienteSearch.value) {
    const s = insuficienteSearch.value.toLowerCase()
    list = list.filter(stu =>
      stu.name.toLowerCase().includes(s) ||
      String(stu.grade).includes(s) ||
      stu.group.toLowerCase().includes(s) ||
      String(stu.finalGrade).includes(s)
    )
  }
  return list.sort((a, b) => {
    let valA = a[insuficienteSortKey.value]
    let valB = b[insuficienteSortKey.value]
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()
    if (valA < valB) return insuficienteSortAsc.value ? -1 : 1
    if (valA > valB) return insuficienteSortAsc.value ? 1 : -1
    return 0
  })
})

const insufItemsPerPage = ref(5)
const insufCurrentPage = ref(1)

const insufTotalPages = computed(() => {
  return Math.ceil(filteredFailingStudents.value.length / insufItemsPerPage.value) || 1
})

const paginatedFailingStudents = computed(() => {
  const start = (insufCurrentPage.value - 1) * insufItemsPerPage.value
  return filteredFailingStudents.value.slice(start, start + insufItemsPerPage.value)
})

watch([insufItemsPerPage, insuficienteSearch], () => {
  insufCurrentPage.value = 1
})

const fetchAlertsData = async () => {
  if (activeTab.value === 'asistencia' && selectedCycle.value && selectedTrimester.value) {
    loadingAlerts.value = true
    const data = await window.electronAPI.getReportsAttendanceAlerts({ cycleId: selectedCycle.value, trimesterNumber: selectedTrimester.value })
    threeAbsences.value = data.threeAbsences
    moreThanThreeAbsences.value = data.moreThanThreeAbsences
    loadingAlerts.value = false
  } else if (activeTab.value === 'insuficiente' && selectedCycle.value && selectedTrimester.value) {
    loadingAlerts.value = true
    failingStudentsList.value = await window.electronAPI.getReportsFailingStudents({ cycleId: selectedCycle.value, trimesterNumber: selectedTrimester.value })
    loadingAlerts.value = false
  }
}

watch([selectedCycle, selectedTrimester, activeTab], fetchAlertsData)

watch(evalSelectedGroupId, async (newId) => {
  evalSelectedSubjectId.value = null
  evalSubjectsList.value = []
  if (newId) evalSubjectsList.value = await window.electronAPI.getGroupSubjects(newId)
})

watch(evalSelectedSubjectId, async (newId) => {
  if (newId && evalSelectedGroupId.value) {
    evalLoading.value = true
    try {
      const data = await window.electronAPI.getEvaluationData(evalSelectedGroupId.value, newId)
      // Basic computation based on platform platform has
      if (data && data.students) {
        const rawGrades = data.grades || {};
        const minPass = data.grading_config?.setting_min_pass || 6;
        const maxSys = data.grading_config?.setting_max_score || 10;

        let globalAltas = 0;
        let globalBajas = 0;
        let globalInscritos = data.students.length;

        [1,2,3].forEach(period => {
           const t = (data.trimesters || []).find((x:any) => x.trimester_number === period);
           const tStartStr = t?.start_date || '1970-01-01';
           const tEndStr = t?.end_date || '2099-12-31';

           // Use locale comparison for YYYY-MM-DD
           const inscritosList = data.students.filter((s:any) => {
             const eDate = s.enrolled_at || '1970-01-01';
             const dDate = s.status_name === 'Baja' && s.dropped_at ? s.dropped_at : '2099-12-31';
             return eDate <= tEndStr && dDate >= tStartStr;
           });

           const altasList = data.students.filter((s:any) => {
             if (!s.enrolled_at) return false;
             return s.enrolled_at >= tStartStr && s.enrolled_at <= tEndStr;
           });

           const bajasList = data.students.filter((s:any) => {
             if (s.status_name !== 'Baja' || !s.dropped_at) return false;
             return s.dropped_at >= tStartStr && s.dropped_at <= tEndStr;
           });

           const inscritos = inscritosList.length;
           const altas = altasList.length;
           const bajas = bajasList.length;
           const evaluados = Math.max(0, inscritos - bajas);

           globalAltas += altas;
           globalBajas += bajas;

           evalStats.value[period].inscritos = inscritos;
           evalStats.value[period].bajas = bajas;
           evalStats.value[period].altas = altas;
           evalStats.value[period].evaluados = evaluados;

           const rubricsForPeriod = data.rubrics ? data.rubrics.filter((r: any) => r.period_id == period) : [];

           let aprob = 0;
           let reprob = 0;
           let totalGrades = 0;

           if (evaluados > 0) {
             // Evaluar solo a los que no son baja en este trimestre
             const evaluatesForPeriod = inscritosList.filter((s:any) => !bajasList.includes(s));

             evaluatesForPeriod.forEach((student: any) => {
               let stuTotal = 0;
               rubricsForPeriod.forEach((rubric: any) => {
                 if (!rubric.activities?.length) return;
                 // Usar siempre minPass como valor por defecto (incluyendo rúbricas extra)
                 const minAvg = minPass;
                 const scores = rubric.activities.map((a: any) => {
                   const val = rawGrades[student.id]?.[a.id];
                   return val === undefined || val === '' ? minAvg : parseFloat(val);
                 });
                 const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;

                 if (rubric.is_extra) {
                   stuTotal += avg;
                 } else {
                   const w = rubric.percentage || 0;
                   const x = maxSys - minPass;
                   if (x > 0) {
                       const a = w / x;
                       const b = -a * minPass;
                       stuTotal += (a * avg + b);
                   }
                 }
               });

               const finalGrade = Math.round((stuTotal + minPass) * 10) / 10;
               totalGrades += finalGrade;

               if (finalGrade >= minPass) {
                 aprob++;
               } else {
                 reprob++;
               }
             });

             evalStats.value[period].aprobados = aprob;
             evalStats.value[period].reprobados = reprob;
             evalStats.value[period].pctAprobados = Math.round((aprob / evaluados) * 100) || 0;
             evalStats.value[period].pctReprobados = Math.round((reprob / evaluados) * 100) || 0;
             evalStats.value[period].promedio = (totalGrades / evaluados).toFixed(1);
           } else {
             evalStats.value[period].aprobados = 0;
             evalStats.value[period].reprobados = 0;
             evalStats.value[period].pctAprobados = 0;
             evalStats.value[period].pctReprobados = 0;
             evalStats.value[period].promedio = (0).toFixed(1);
           }
        });

        // Calculate Resultados Finales (Promedio of I, II, III for each student)
        let globalAprobados = 0;
        let globalReprobados = 0;
        let globalTotalGrades = 0;

        const globalBajasAll = data.students.filter((s:any) => s.status_name === 'Baja').length;
        const evaluadosData = Math.max(0, globalInscritos - globalBajasAll);

        if (evaluadosData > 0) {
          data.students.filter((s:any) => s.status_name !== 'Baja').forEach((student: any) => {
            let studentPeriodTotals: number[] = [];
            [1,2,3].forEach(period => {
               const rubricsForPeriod = data.rubrics ? data.rubrics.filter((r: any) => r.period_id == period) : [];
               let stuTotal = 0;
               rubricsForPeriod.forEach((rubric: any) => {
                 if (!rubric.activities?.length) return;
                 // Usar siempre minPass como valor por defecto (incluyendo rúbricas extra)
                 const minAvg = minPass;
                 const scores = rubric.activities.map((a: any) => {
                   const val = rawGrades[student.id]?.[a.id];
                   return val === undefined || val === '' ? minAvg : parseFloat(val);
                 });
                 const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;

                 if (rubric.is_extra) {
                   stuTotal += avg;
                 } else {
                   const w = rubric.percentage || 0;
                   const x = maxSys - minPass;
                   if (x > 0) {
                       const a = w / x;
                       const b = -a * minPass;
                       stuTotal += (a * avg + b);
                   }
                 }
               });
               studentPeriodTotals.push(Math.round((stuTotal + minPass) * 10) / 10);
            });

            const finalGradeGlobal = studentPeriodTotals.reduce((a,b)=>a+b,0) / 3;
            globalTotalGrades += finalGradeGlobal;

            if (finalGradeGlobal >= minPass) {
               globalAprobados++;
            } else {
               globalReprobados++;
            }
          });

          evalStats.value.global = {
            inscritos: globalInscritos,
            altas: globalAltas,
            bajas: globalBajasAll,
            evaluados: evaluadosData,
            aprobados: globalAprobados,
            reprobados: globalReprobados,
            pctAprobados: Math.round((globalAprobados / evaluadosData) * 100) || 0,
            pctReprobados: Math.round((globalReprobados / evaluadosData) * 100) || 0,
            promedio: (globalTotalGrades / evaluadosData).toFixed(1)
          };
        } else {
          evalStats.value.global = { inscritos: globalInscritos, altas: globalAltas, bajas: globalBajasAll, evaluados: 0, aprobados: 0, reprobados: 0, pctAprobados: 0, pctReprobados: 0, promedio: (0).toFixed(1) };
        }
      }
    } catch (e) {
      console.error('Error loading evaluation data:', e);
      toast.error('Error al cargar datos de evaluación');
    } finally {
      evalLoading.value = false
    }
  }
})


onMounted(async () => {
  // Cargar estado desde local storage
  const savedEntries = localStorage.getItem('arkhe-schedule-entries')
  if (savedEntries) entries.value = JSON.parse(savedEntries)
  
  const savedMixed = localStorage.getItem('arkhe-schedule-mixed')
  if (savedMixed) isMixed.value = savedMixed === 'true'

  // Cargar grupos
  try {
    groups.value = await window.electronAPI.getGroups({})
    cycles.value = await window.electronAPI.getCycles()
  } catch (e) {
    toast.error('Error al cargar grupos o ciclos')
  }
})

watch(isMixed, (val) => {
  localStorage.setItem('arkhe-schedule-mixed', String(val))
  // Eliminar las entradas extra si desactiva el mixto
  if (!val) {
    entries.value = entries.value.filter(e => !e.slotId.includes('r2') && !e.slotId.includes('h9') && !e.slotId.includes('h10') && !e.slotId.includes('h11') && !e.slotId.includes('h12'))
    saveEntries()
  }
})

watch(selectedGroupId, async (newId) => {
  selectedSubjectId.value = null
  subjectsList.value = []
  if (newId) {
    subjectsList.value = await window.electronAPI.getGroupSubjects(newId)
  }
})

const availableSlotsForDay = computed(() => {
  if (!selectedDay.value) return []
  const available = allSlots.value.filter(slot => !slot.isBreak)
  // Quitar las horas que ya están ocupadas ese día
  const occupiedIds = entries.value.filter(e => e.day === selectedDay.value).map(e => e.slotId)
  return available.filter(slot => !occupiedIds.includes(slot.id))
})

function getGroupColor(groupId: number): string {
  const colors = ['#fecaca', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fbcfe8', '#fed7aa', '#cffafe', '#e0e7ff', '#fef9c3']
  return colors[groupId % colors.length]
}

function getEntry(slotId: string, day: string) {
  return entries.value.find(e => e.slotId === slotId && e.day === day)
}

function saveEntries() {
  localStorage.setItem('arkhe-schedule-entries', JSON.stringify(entries.value))
}

function addClass() {
  if (!selectedGroupId.value || !selectedSubjectId.value || !selectedDay.value || !selectedSlotId.value) {
    toast.error('Completa todos los campos para agregar.')
    return
  }
  const g = groups.value.find(x => x.id === selectedGroupId.value)
  const s = subjectsList.value.find(x => x.id === selectedSubjectId.value)
  
  entries.value.push({
    slotId: selectedSlotId.value,
    day: selectedDay.value,
    groupId: g.id,
    groupLabel: `${g.grade}° ${g.name}`,
    subjectId: s.id,
    subjectName: s.name,
    color: getGroupColor(g.id)
  })
  
  saveEntries()
  toast.success('Clase agregada al horario.')
  
  // Limpiar seleccion para rápido ingreso
  selectedSlotId.value = ''
}

function removeClass(slotId: string, day: string) {
  // if (!confirm('¿Quitar clase del horario?')) return
  entries.value = entries.value.filter(e => !(e.slotId === slotId && e.day === day))
  saveEntries()
}

function goAttendance(groupId: number) {
  router.push(`/attendance/${groupId}/take`)
}

</script>

<template>
  <div class="reports-page fade-in">
    <div class="page-header">
      <div>
        <h2>Reportes y Horario</h2>
        <p class="text-muted">Gestiona tu horario y visualiza reportes del ciclo escolar.</p>
      </div>
    </div>

    <!-- Pestañas -->
    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs-grid">
        <button class="tab-btn" :class="{ active: activeTab === 'horario' }" @click="activeTab = 'horario'">🕒 Horario</button>
        <button class="tab-btn" :class="{ active: activeTab === 'asistencia' }" @click="activeTab = 'asistencia'">✅ Asistencia</button>
        <button class="tab-btn" :class="{ active: activeTab === 'evaluacion' }" @click="activeTab = 'evaluacion'">📝 Evaluación</button>
        <button class="tab-btn" :class="{ active: activeTab === 'insuficiente' }" @click="activeTab = 'insuficiente'">⚠️ Cali. Insuficiente</button>
      </div>
    </div>

    <!-- PESTAÑA: HORARIO -->
    <div v-if="activeTab === 'horario'" class="fade-in">

      <!-- Controles de agendado -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title">Configurar Clases</h3>
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer;">
            <input type="checkbox" v-model="isMixed" />
            Horario Mixto (hasta 5:40 PM)
          </label>
        </div>
        
        <div class="grid-5" style="gap: 16px; align-items: flex-end;">
          <div class="form-group">
            <label class="form-label">Grupo</label>
            <select v-model="selectedGroupId" class="form-select">
              <option :value="null">Seleccionar...</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.grade }}° {{ g.name }} ({{ g.cycle }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Materia</label>
            <select v-model="selectedSubjectId" class="form-select" :disabled="!selectedGroupId">
              <option :value="null">Seleccionar...</option>
              <option v-for="s in subjectsList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Día</label>
            <select v-model="selectedDay" class="form-select">
              <option value="">Seleccionar...</option>
              <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <select v-model="selectedSlotId" class="form-select" :disabled="!selectedDay">
              <option value="">Seleccionar...</option>
              <option v-for="s in availableSlotsForDay" :key="s.id" :value="s.id">{{ s.time }}</option>
            </select>
          </div>
          <div class="form-group">
            <button class="btn btn-primary w-full" @click="addClass" :disabled="!selectedGroupId || !selectedSubjectId || !selectedDay || !selectedSlotId">
              ➕ Agregar
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla / Matriz del horario -->
      <div class="card" style="padding: 0; overflow-x: auto;">
        <table class="data-table schedule-table">
          <thead>
            <tr>
              <th style="width: 130px; text-align: center; border-right: 1px solid var(--border);">Horas</th>
              <th v-for="day in days" :key="day" style="text-align: center; border-right: 1px solid var(--border);">
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in allSlots" :key="slot.id">
              <td style="text-align: center; font-weight: 600; font-size: 12px; color: var(--text-muted); border-right: 1px solid var(--border); white-space: nowrap;">
                {{ slot.time }}
              </td>
              
              <!-- Receso -->
              <td v-if="slot.isBreak" :colspan="days.length" style="text-align: center; background: rgba(0,0,0,0.03); color: var(--text-muted); font-weight: 700; letter-spacing: 2px;">
                {{ slot.label }}
              </td>
              
              <!-- Celdas normales -->
              <template v-else>
                <td v-for="day in days" :key="day" style="padding: 6px; border-right: 1px solid var(--border); vertical-align: top;">
                  <div v-if="getEntry(slot.id, day)" class="schedule-cell fade-in" :style="{ backgroundColor: getEntry(slot.id, day)?.color }">
                    <button class="remove-btn" @click="removeClass(slot.id, day)" title="Quitar clase">×</button>
                    <div style="font-weight: 700; font-size: 13px; color: #1f2937;">{{ getEntry(slot.id, day)?.groupLabel }}</div>
                    <div style="font-size: 11px; color: #4b5563; margin-top: 2px; margin-bottom: 6px; line-height: 1.2;">{{ getEntry(slot.id, day)?.subjectName }}</div>
                    <button class="btn btn-ghost btn-sm attendance-btn" @click="goAttendance(getEntry(slot.id, day)!.groupId)">✅ Pase de lista</button>
                  </div>
                  <div v-else class="empty-cell"></div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- PESTAÑA: ASISTENCIA -->
    <div v-if="activeTab === 'asistencia'" class="fade-in">
      <div class="card" style="margin-bottom: 24px;">
        <h3 class="card-title mb-4">Reporte de Asistencia (Faltas Continuas)</h3>
        
        <div class="grid-2" style="gap: 16px; margin-bottom: 24px;">
          <div class="form-group">
            <label class="form-label">Ciclo Escolar</label>
            <select v-model="selectedCycle" class="form-select">
              <option :value="null">Seleccionar...</option>
              <option v-for="c in cycles" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Trimestre</label>
            <select v-model="selectedTrimester" class="form-select" :disabled="!selectedCycle">
              <option :value="null">Seleccionar...</option>
              <option :value="1">Trimestre I</option>
              <option :value="2">Trimestre II</option>
              <option :value="3">Trimestre III</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="selectedCycle && selectedTrimester" style="display: flex; flex-direction: column; gap: 24px;">
        <div class="card" style="overflow-x: auto; padding: 0;">
          <h4 style="padding: 16px; border-bottom: 1px solid var(--border); margin: 0; background: var(--bg-card);">3 Faltas Continuas</h4>
          <table class="data-table" v-if="threeAbsences.length > 0">
            <thead>
              <tr>
                <th>Nombre del alumno</th>
                <th>Grado</th>
                <th>Grupo</th>
                <th style="text-align: center;">Total Faltas (Trimestre)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stu in threeAbsences" :key="stu.id">
                <td style="font-weight: 500;">{{ stu.name }}</td>
                <td>{{ stu.grade }}°</td>
                <td>{{ stu.group }}</td>
                <td style="text-align: center; font-weight: 600; color: #f59e0b;">{{ stu.totalAbsences }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="padding: 24px; text-align: center; color: var(--text-muted);">No hay alumnos con 3 faltas continuas.</div>
        </div>

        <div class="card" style="overflow-x: auto; padding: 0;">
          <h4 style="padding: 16px; border-bottom: 1px solid var(--border); margin: 0; background: var(--bg-card); color: #ef4444;">Más de 3 Faltas Continuas</h4>
          <table class="data-table" v-if="moreThanThreeAbsences.length > 0">
            <thead>
              <tr>
                <th>Nombre del alumno</th>
                <th>Grado</th>
                <th>Grupo</th>
                <th style="text-align: center;">Total Faltas (Trimestre)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stu in moreThanThreeAbsences" :key="stu.id">
                <td style="font-weight: 500;">{{ stu.name }}</td>
                <td>{{ stu.grade }}°</td>
                <td>{{ stu.group }}</td>
                <td style="text-align: center; font-weight: 600; color: #ef4444;">{{ stu.totalAbsences }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="padding: 24px; text-align: center; color: var(--text-muted);">No hay alumnos con más de 3 faltas continuas.</div>
        </div>
      </div>
    </div>
    
    <!-- PESTAÑA: EVALUACIÓN -->
    <div v-if="activeTab === 'evaluacion'" class="fade-in">
      <div class="card" style="margin-bottom: 24px;">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title">Estadística de Evaluación</h3>
        </div>
        <div class="grid-2" style="gap: 16px; margin-bottom: 24px;">
          <div class="form-group">
            <label class="form-label">Grupo</label>
            <select v-model="evalSelectedGroupId" class="form-select">
              <option :value="null">Seleccionar...</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.grade }}° {{ g.name }} ({{ g.cycle }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Materia</label>
            <select v-model="evalSelectedSubjectId" class="form-select" :disabled="!evalSelectedGroupId">
              <option :value="null">Seleccionar...</option>
              <option v-for="s in evalSubjectsList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <div style="overflow-x: auto;" v-if="evalSelectedGroupId && evalSelectedSubjectId">
          <div v-if="evalLoading" class="empty-state" style="padding: 48px;">
            <div class="spinner"></div>
            <p style="margin-top: 16px; color: var(--text-muted);">Cargando estadísticas...</p>
          </div>
          <template v-else>
          <table class="data-table" style="border: 1px solid var(--border); width: 100%;">
            <thead>
              <tr>
                <th colspan="5" style="text-align: center; font-size: 18px; font-weight: 800; background: var(--bg-elevated); padding: 12px; border-bottom: 1px solid var(--border);">ESTADISTICA</th>
              </tr>
              <tr>
                <th style="min-width: 300px; padding: 0; position: relative;">
                  <div style="text-align: right; padding: 8px 16px; font-weight: 700;">PERIODO</div>
                  <div style="height: 1px; background: var(--border); width: 100%; transform: rotate(15deg) scaleX(1.1); transform-origin: left center; position: absolute; top: 50%; left: 0;"></div>
                  <div style="text-align: left; padding: 8px 16px; font-weight: 700; font-size: 11px;">DATOS ESTADISTICOS POR PERIODO</div>
                </th>
                <th style="text-align: center; width: 80px; font-size: 14px; font-weight: bold; border-left: 1px solid var(--border);">I</th>
                <th style="text-align: center; width: 80px; font-size: 14px; font-weight: bold; border-left: 1px solid var(--border);">II</th>
                <th style="text-align: center; width: 80px; font-size: 14px; font-weight: bold; border-left: 1px solid var(--border);">III</th>
                <th style="text-align: center; width: 120px; font-size: 12px; font-weight: bold; border-left: 1px solid var(--border);">RESULTADOS<br>FINALES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. ALUMNOS INSCRITOS (INICIO DE CURSO)</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].inscritos || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].inscritos || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].inscritos || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats[1].inscritos || '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. ALTAS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].altas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].altas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].altas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats[1].altas || '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. BAJAS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].bajas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].bajas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].bajas || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats[1].bajas || '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. ALUMNOS EVALUADOS POR PERIODO</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].evaluados || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].evaluados || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].evaluados || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.evaluados || '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. ALUMNOS APROBADOS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].aprobados !== null ? evalStats[1].aprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].aprobados !== null ? evalStats[2].aprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].aprobados !== null ? evalStats[3].aprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.aprobados !== null ? evalStats.global?.aprobados : '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">No. ALUMNOS REPROBADOS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].reprobados !== null ? evalStats[1].reprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].reprobados !== null ? evalStats[2].reprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].reprobados !== null ? evalStats[3].reprobados : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.reprobados !== null ? evalStats.global?.reprobados : '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">% ALUMNOS APROBADOS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].pctAprobados !== undefined ? evalStats[1].pctAprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].pctAprobados !== undefined ? evalStats[2].pctAprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].pctAprobados !== undefined ? evalStats[3].pctAprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.pctAprobados !== undefined ? evalStats.global?.pctAprobados + '%' : '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">% ALUMNOS REPROBADOS</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].pctReprobados !== undefined ? evalStats[1].pctReprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].pctReprobados !== undefined ? evalStats[2].pctReprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].pctReprobados !== undefined ? evalStats[3].pctReprobados + '%' : '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.pctReprobados !== undefined ? evalStats.global?.pctReprobados + '%' : '' }}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; font-size: 11px;">CALIFICACION PROMEDIO (POR PERIODO)</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[1].promedio || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[2].promedio || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border);">{{ evalStats[3].promedio || '' }}</td>
                <td style="text-align: center; border-left: 1px solid var(--border); background: var(--bg-elevated);">{{ evalStats.global?.promedio || '' }}</td>
              </tr>
            </tbody>
          </table>
          </template>
        </div>
        <div v-else class="empty-state">
           <div class="empty-state-icon">📊</div>
           <p>Selecciona un grupo y materia para ver la estadística.</p>
        </div>
      </div>
    </div>

    <!-- PESTAÑA: CALIFICACIÓN INSUFICIENTE -->
    <div v-if="activeTab === 'insuficiente'" class="fade-in">
      <div class="card" style="margin-bottom: 24px;">
        <h3 class="card-title mb-4">Matriz de Calificaciones Insuficientes</h3>
        
        <div class="grid-2" style="gap: 16px; margin-bottom: 24px;">
          <div class="form-group">
            <label class="form-label">Ciclo Escolar</label>
            <select v-model="selectedCycle" class="form-select">
              <option :value="null">Seleccionar...</option>
              <option v-for="c in cycles" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Trimestre</label>
            <select v-model="selectedTrimester" class="form-select" :disabled="!selectedCycle">
              <option :value="null">Seleccionar...</option>
              <option :value="1">Trimestre I</option>
              <option :value="2">Trimestre II</option>
              <option :value="3">Trimestre III</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card" style="overflow-x: auto; padding: 0;" v-if="selectedCycle && selectedTrimester">
        <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);">
          <h4 style="margin: 0; color: #ef4444;">🛡️ Alumnos Reprobados</h4>
          <div class="flex items-center gap-2">
            <input v-model="insuficienteSearch" type="text" class="form-input" placeholder="🔍 Buscar alumno, grado, grupo..." style="min-width: 250px;" />
            <button class="btn btn-secondary" @click="fetchAlertsData" :disabled="loadingAlerts">
              <span v-if="loadingAlerts" class="spinner"></span>
              <span v-else>🔄 Refrescar</span>
            </button>
          </div>
        </div>
        <template v-if="filteredFailingStudents.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="setInsuficienteSort('name')" style="cursor: pointer;">Nombre del alumno <span class="text-xs">{{ insuficienteSortKey === 'name' ? (insuficienteSortAsc ? '↑' : '↓') : '' }}</span></th>
                <th @click="setInsuficienteSort('grade')" style="cursor: pointer;">Grado <span class="text-xs">{{ insuficienteSortKey === 'grade' ? (insuficienteSortAsc ? '↑' : '↓') : '' }}</span></th>
                <th @click="setInsuficienteSort('group')" style="cursor: pointer;">Grupo <span class="text-xs">{{ insuficienteSortKey === 'group' ? (insuficienteSortAsc ? '↑' : '↓') : '' }}</span></th>
                <th @click="setInsuficienteSort('totalAbsences')" style="cursor: pointer; text-align: center;">Faltas Trimestre <span class="text-xs">{{ insuficienteSortKey === 'totalAbsences' ? (insuficienteSortAsc ? '↑' : '↓') : '' }}</span></th>
                <th @click="setInsuficienteSort('finalGrade')" style="cursor: pointer; text-align: center;">Promedio Final <span class="text-xs">{{ insuficienteSortKey === 'finalGrade' ? (insuficienteSortAsc ? '↑' : '↓') : '' }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stu in paginatedFailingStudents" :key="stu.id">
                <td style="font-weight: 500;">{{ stu.name }}</td>
                <td>{{ stu.grade }}°</td>
                <td>{{ stu.group }}</td>
                <td style="text-align: center;">{{ stu.totalAbsences }}</td>
                <td style="text-align: center; font-weight: 700; color: #ef4444;">{{ stu.finalGrade }}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="flex items-center justify-between" style="padding: 16px; border-top: 1px solid var(--border); background: var(--bg-card);">
            <div class="flex items-center gap-2 text-sm text-muted">
              <span>Mostrar</span>
              <select v-model="insufItemsPerPage" class="form-select text-sm" style="padding: 4px 28px 4px 8px;">
                <option :value="5">5</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span>alumnos (Total: {{ filteredFailingStudents.length }})</span>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-secondary btn-sm" :disabled="insufCurrentPage === 1" @click="insufCurrentPage = 1">⏮</button>
              <button class="btn btn-secondary btn-sm" :disabled="insufCurrentPage === 1" @click="insufCurrentPage--">Anterior</button>
              <span class="text-sm text-muted">Página {{ insufCurrentPage }} de {{ insufTotalPages }}</span>
              <button class="btn btn-secondary btn-sm" :disabled="insufCurrentPage === insufTotalPages" @click="insufCurrentPage++">Siguiente</button>
              <button class="btn btn-secondary btn-sm" :disabled="insufCurrentPage === insufTotalPages" @click="insufCurrentPage = insufTotalPages">⏭</button>
            </div>
          </div>
        </template>
        
        <div v-else style="padding: 24px; text-align: center; color: var(--text-muted);">No hay alumnos reprobados para los filtros seleccionados.</div>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.schedule-table th, .schedule-table td {
  border-bottom: 1px solid var(--border);
}

.schedule-cell {
  position: relative;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(0,0,0,0.05);
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,0.1);
  border: none;
  font-size: 14px;
  line-height: 1;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.schedule-cell:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

.empty-cell {
  min-height: 60px;
  background: transparent;
}

.attendance-btn {
  font-size: 10px;
  padding: 4px;
  margin-top: 4px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.1);
  color: #1f2937;
  width: 100%;
}

.attendance-btn:hover {
  background: white;
  transform: translateY(-1px);
}

.data-table td { padding: 4px 8px; border-bottom: 1px solid var(--border); }

/* Nuevos Estilos para Tabs */
.tabs-container {
  margin-bottom: 24px;
}
.tabs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.tab-btn {
  padding: 10px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}
.tab-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
</style>
