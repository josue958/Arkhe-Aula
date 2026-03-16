<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const activeTab = ref('school')

const aiConfig = ref({
  model: localStorage.getItem('arkhe-ai-model') || 'gemini-3-flash',
  qwenKey: localStorage.getItem('arkhe-qwen-key') || ''
})

function saveAiConfig() {
  localStorage.setItem('arkhe-ai-model', aiConfig.value.model)
  localStorage.setItem('arkhe-qwen-key', aiConfig.value.qwenKey)
  toast.success('Configuración de IA guardada correctamente.')
}

// Escuela
const school = ref<any>({})
const savingSchool = ref(false)

// Ciclos
const cycles = ref<any[]>([])
const newCycle = ref({ name: '', start_date: '', end_date: '', is_active: false })
const showCycleModal = ref(false)
const savingCycle = ref(false)
const showEditCycleModal = ref(false)
const editCycleData = ref({ id: -1, name: '', start_date: '', end_date: '', is_active: false })
const savingEditCycle = ref(false)

// Materias
const subjects = ref<any[]>([])
const newSubject = ref({ name: '', color: '#3b82f6', group_ids: [] as number[] })
const showSubjectModal = ref(false)
const showEditSubjectModal = ref(false)
const editSubjectData = ref({ id: -1, name: '', color: '#3b82f6', group_ids: [] as number[] })
const savingEditSubject = ref(false)

// Estatus
const statuses = ref<any[]>([])
const newStatus = ref({ name: '', color: '#6b7280' })
const showStatusModal = ref(false)
const showEditStatusModal = ref(false)
const editStatusData = ref({ id: -1, name: '', color: '#6b7280' })
const savingEditStatus = ref(false)

// Tipos de Incidente
const incidentTypes = ref<any[]>([])
const newIncidentType = ref({ name: '' })
const showIncidentTypeModal = ref(false)
const showEditIncidentTypeModal = ref(false)
const editIncidentTypeData = ref({ id: -1, name: '' })
const savingEditIncidentType = ref(false)

const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#78716c', '#000000'
]

// Semáforo
const indicators = ref<any[]>([])
const savingIndicators = ref(false)

// Trimestres
const trimestersCycleId = ref<number | null>(null)
const trimestersData = ref<any[]>([])
const savingTrimesters = ref(false)


const uniqueSubjectNames = computed(() => {
  const names = new Set<string>()
  for (const s of subjects.value) {
    names.add(s.name)
  }
  return Array.from(names).sort()
})

const uniqueRubricNames = computed(() => {
  const names = new Set<string>()
  for (const e of evalElements.value) {
    names.add(e.name)
  }
  return Array.from(names).sort()
})

const autoBackupDb = ref(false)
const autoBackupDbPath = ref('')
const lastBackupDbDate = ref('')

const autoBackupProfile = ref(false)
const autoBackupProfilePath = ref('')
const lastBackupProfileDate = ref('')

const evalSortKey = ref('name')
const evalSortAsc = ref(true)

const setEvalSort = (key: string) => {
  if (evalSortKey.value === key) evalSortAsc.value = !evalSortAsc.value
  else { evalSortKey.value = key; evalSortAsc.value = true }
}

const groupedEvalElements = computed(() => {
  const map = new Map()
  for (const e of evalElements.value) {
    if (!map.has(e.name)) {
      map.set(e.name, {
        id: e.id,
        name: e.name,
        percentage: e.percentage,
        is_extra: e.is_extra,
        groups: new Set([e.group_grade + '° ' + e.group_name]),
        raw_groups: new Set([e.group_id]),
        raw_subjects: new Set([e.subject_name]),
        raw_periods: new Set([e.period_id]),
        subjects: new Set([e.subject_name]),
        trimesters: new Set([e.period_id])
      })
    } else {
      const g = map.get(e.name)
      g.groups.add(e.group_grade + '° ' + e.group_name)
      g.raw_groups.add(e.group_id)
      g.raw_subjects.add(e.subject_name)
      g.raw_periods.add(e.period_id)
      g.subjects.add(e.subject_name)
      g.trimesters.add(e.period_id)
      g.percentage = e.percentage
      g.is_extra = e.is_extra
    }
  }
  let arr = Array.from(map.values()).map(g => ({
    ...g,
    groupsStr: Array.from(g.groups).sort().join(', '),
    subjectsStr: Array.from(g.subjects).sort().join(', '),
    trimestersStr: Array.from(g.trimesters).sort().map(t => 'T'+t).join(', ')
  }))
  arr.sort((a, b) => {
    const valA = a[evalSortKey.value]
    const valB = b[evalSortKey.value]
    if (valA < valB) return evalSortAsc.value ? -1 : 1
    if (valA > valB) return evalSortAsc.value ? 1 : -1
    return 0
  })
  return arr
})

const actSortKey = ref('name')
const actSortAsc = ref(true)

const setActSort = (key: string) => {
  if (actSortKey.value === key) actSortAsc.value = !actSortAsc.value
  else { actSortKey.value = key; actSortAsc.value = true }
}

const groupedActivities = computed(() => {
  const map = new Map()
  for (const a of activities.value) {
    if (!map.has(a.name)) {
      map.set(a.name, {
        id: a.id,
        name: a.name,
        elements: new Set([a.rubric_name]),
        raw_rubrics: new Set([a.rubric_name]),
        raw_groups: new Set([a.group_id]),
        raw_subjects: new Set([a.subject_name]),
        raw_periods: new Set([a.trimester]),
        groups: new Set([a.group_grade + '° ' + a.group_name]),
        subjects: new Set([a.subject_name]),
        trimesters: new Set([a.trimester])
      })
    } else {
      const g = map.get(a.name)
      g.elements.add(a.rubric_name)
      g.raw_rubrics.add(a.rubric_name)
      g.raw_groups.add(a.group_id)
      g.raw_subjects.add(a.subject_name)
      g.raw_periods.add(a.trimester)
      g.groups.add(a.group_grade + '° ' + a.group_name)
      g.subjects.add(a.subject_name)
      g.trimesters.add(a.trimester)
    }
  }
  let arr = Array.from(map.values()).map(g => ({
    ...g,
    elementsStr: Array.from(g.elements).sort().join(', '),
    groupsStr: Array.from(g.groups).sort().join(', '),
    subjectsStr: Array.from(g.subjects).sort().join(', '),
    trimestersStr: Array.from(g.trimesters).sort().map(t => 'T'+t).join(', ')
  }))
  arr.sort((a, b) => {
    const valA = a[actSortKey.value]
    const valB = b[actSortKey.value]
    if (valA < valB) return actSortAsc.value ? -1 : 1
    if (valA > valB) return actSortAsc.value ? 1 : -1
    return 0
  })
  return arr
})

// Evaluación Formativa
const formGroups = ref<any[]>([])
const formEvalSubjects = ref<any[]>([])
const evalElements = ref<any[]>([])
const showEvalModal = ref(false)
const newEval = ref({ name: '', group_ids: [] as number[], subject_names: [] as string[], percentage: 0, period_ids: [] as number[], is_extra: false })
const savingEval = ref(false)
const showEditEvalModal = ref(false)
const editEval = ref({ oldName: '', name: '', percentage: 0, is_extra: false, group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[] })

// Actividades
const formActSubjects = ref<any[]>([])
const formActRubrics = ref<any[]>([])
const activities = ref<any[]>([])
const showActivityModal = ref(false)
const newActivity = ref({ name: '', group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[], rubric_name: '' })
const savingActivity = ref(false)
const showEditActivityModal = ref(false)
const editActivity = ref({ oldName: '', name: '', group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[], rubric_name: '' })

// Plantillas de evaluación
const evalTemplates = ref<any[]>([])

// Configuración de calificaciones
const gradingConfig = ref({ setting_max_score: 10, setting_min_pass: 6, setting_periods: 3 })

// DB
const dbInfo = ref<any>(null)
const changingDbPath = ref(false)


// Perfil de usuario
const exportingProfile = ref(false)
const importingProfile = ref(false)

// Sincronización Multi-Dispositivo
const syncConfig = ref({
  provider: 'none',
  email: '',
  password: ''
})
const savingSync = ref(false)

const syncProviderName = computed(() => {
  if (syncConfig.value.provider === 'firebase') return 'Google'
  if (syncConfig.value.provider === 'cloudkit') return 'Apple'
  if (syncConfig.value.provider === 'msgraph') return 'Microsoft'
  if (syncConfig.value.provider === 'qwen') return 'Qwen'
  return 'Ninguno'
})

async function simulateLogin(provider: string) {
  savingSync.value = true
  setTimeout(async () => {
    syncConfig.value.provider = provider;
    await saveSyncConfig()
    savingSync.value = false
  }, 1000)
}

async function disconnectSync() {
  if (!confirm('¿Seguro que deseas desconectar la sincronización de tu cuenta?')) return
  syncConfig.value.provider = 'none'
  await saveSyncConfig()
}

onMounted(async () => {
  await loadAll()
  
  // Load autobackup preferences
  autoBackupDb.value = localStorage.getItem('arkhe-auto-backup-db') === 'true'
  autoBackupDbPath.value = localStorage.getItem('arkhe-auto-backup-db-path') || ''
  lastBackupDbDate.value = localStorage.getItem('arkhe-last-backup-db') || ''
  
  autoBackupProfile.value = localStorage.getItem('arkhe-auto-backup-profile') === 'true'
  autoBackupProfilePath.value = localStorage.getItem('arkhe-auto-backup-profile-path') || ''
  lastBackupProfileDate.value = localStorage.getItem('arkhe-last-backup-profile') || ''

  try {
    const savedSync = localStorage.getItem('arkhe-sync-config')
    if (savedSync) {
      syncConfig.value = JSON.parse(savedSync)
    }
  } catch(e) {}
})

async function loadAll() {
  try {
    const [schoolData, cyclesData, subjectsData, statusesData, indicatorsData, gradingData, dbData, groups, evals, acts, iTypesData] = await Promise.all([
      window.electronAPI.getSchool(),
      window.electronAPI.getCycles(),
      window.electronAPI.getSubjectTemplates(),
      window.electronAPI.getStatuses(),
      window.electronAPI.getIndicators(),
      window.electronAPI.getGradingConfig(),
      window.electronAPI.getDatabaseInfo(),
      window.electronAPI.getGroups({}),
      window.electronAPI.getSettingsEvaluationElements(),
      window.electronAPI.getSettingsActivities(),
      window.electronAPI.getIncidentTypes(),
    ])
    school.value = schoolData || {}
    cycles.value = cyclesData
    subjects.value = subjectsData
    statuses.value = statusesData
    indicators.value = indicatorsData
    gradingConfig.value = gradingData || { setting_max_score: 10, setting_min_pass: 6, setting_periods: 3 }
    dbInfo.value = dbData


    
    formGroups.value = groups || []
    evalElements.value = evals || []
    activities.value = acts || []
    incidentTypes.value = iTypesData || []
    
    if (cycles.value.length > 0 && !trimestersCycleId.value) {
      trimestersCycleId.value = cycles.value[0].id
      await loadTrimesters()
    }


  } catch (e) {
    console.error('Error loading settings:', e)
  }
}

async function loadTrimesters() {
  if (!trimestersCycleId.value) return
  const data = await window.electronAPI.getTrimesters(trimestersCycleId.value)
  const map = new Map(data.map((d: any) => [d.trimester_number, d]))
  trimestersData.value = [1, 2, 3].map(n => ({
    trimester_number: n,
    start_date: map.get(n)?.start_date || '',
    end_date: map.get(n)?.end_date || ''
  }))
}

async function saveTrimesters() {
  if (!trimestersCycleId.value) return
  savingTrimesters.value = true
  try {
    await window.electronAPI.saveTrimesters({ cycleId: trimestersCycleId.value, trimesters: JSON.parse(JSON.stringify(trimestersData.value)) })
    toast.success('Fechas de trimestres guardadas.')
  } catch (e: any) {
    toast.error('Error al guardar trimestres: ' + String(e.message || e))
  }
  savingTrimesters.value = false
}



async function createEvaluationElement() {
  if (newEval.value.group_ids.length === 0) {
    toast.error('Selecciona al menos un grupo'); return;
  }
  if (newEval.value.period_ids.length === 0) {
    toast.error('Selecciona al menos un trimestre'); return;
  }
  if (newEval.value.subject_names.length === 0) {
    toast.error('Selecciona al menos una materia'); return;
  }

  savingEval.value = true
  let elemsCreated = 0
  try {
    for (const gid of newEval.value.group_ids) {
      const gSubjects = await window.electronAPI.getSettingsSubjectsForGroup(gid)
      const matchingSubs = gSubjects.filter((s: any) => newEval.value.subject_names.includes(s.name))
      for (const sub of matchingSubs) {
        for (const pid of newEval.value.period_ids) {
          await window.electronAPI.createRubric({
            subject_id: Number(sub.id),
            name: newEval.value.name,
            percentage: Number(newEval.value.percentage),
            period_id: Number(pid),
            is_extra: newEval.value.is_extra ? 1 : 0
          })
          elemsCreated++
        }
      }
    }
    if (elemsCreated > 0) {
      toast.success('Elementos de evaluación creados.')
      showEvalModal.value = false
      newEval.value = { name: '', group_ids: [], subject_names: [], percentage: 10.0, period_ids: [], is_extra: false }
      await loadAll()
    } else {
      toast.error('No se crearon elementos (Revisa que las materias seleccionadas existan en los grupos elegidos).')
    }
  } catch(e) {
    toast.error('Error creando elementos.')
  }
  savingEval.value = false
}

async function deleteEvalElement(name: string) {
  if (!confirm('¿Eliminar este elemento y todas sus actividades vinculadas?')) return
  await window.electronAPI.deleteRubric(name)
  await loadAll()
  toast.success('Elemento eliminado.')
}

function openEditEval(e: any) {
  editEval.value = { oldName: e.name, name: e.name, percentage: e.percentage, is_extra: !!e.is_extra, group_ids: Array.from(e.raw_groups) as number[], subject_names: Array.from(e.raw_subjects) as string[], period_ids: Array.from(e.raw_periods) as number[] }
  showEditEvalModal.value = true
}

async function updateEvalElement() {
  savingEval.value = true
  await window.electronAPI.updateRubricFull({ oldName: editEval.value.oldName, data: { name: editEval.value.name, percentage: Number(editEval.value.percentage), is_extra: editEval.value.is_extra, group_ids: Array.from(editEval.value.group_ids), subject_names: Array.from(editEval.value.subject_names), period_ids: Array.from(editEval.value.period_ids) } })
  showEditEvalModal.value = false
  await loadAll()
  toast.success('Elemento actualizado.')
  savingEval.value = false
}

async function createActivityElement() {
  savingActivity.value = true
  try {
    for (const gid of newActivity.value.group_ids) {
      const gSubjects = await window.electronAPI.getSettingsSubjectsForGroup(gid)
      const matchingSubs = gSubjects.filter((s: any) => newActivity.value.subject_names.includes(s.name))
      for (const sub of matchingSubs) {
        for (const pid of newActivity.value.period_ids) {
          const rubrics = await window.electronAPI.getSettingsRubricsForSubject({
            subjectId: sub.id, periodId: pid
          })
          const targetRubric = rubrics.find((r: any) => r.name === newActivity.value.rubric_name)
          if (targetRubric) {
             await window.electronAPI.createActivity({
               rubric_id: targetRubric.id,
               name: newActivity.value.name,
               period_id: pid
             })
          }
        }
      }
    }
    toast.success('Actividades creadas.')
    showActivityModal.value = false
    newActivity.value = { name: '', group_ids: [], subject_names: [], period_ids: [], rubric_name: '' }
    await loadAll()
  } catch (e: any) {
    console.error(e)
    toast.error('Error al crear actividades: ' + String(e.message || e))
  }
  savingActivity.value = false
}

async function deleteActivityElement(name: string) {
  if (!confirm('¿Eliminar esta actividad?')) return
  await window.electronAPI.deleteActivity(name)
  await loadAll()
  toast.success('Actividad eliminada.')
}

function openEditActivity(a: any) {
  editActivity.value = { oldName: a.name, name: a.name, group_ids: Array.from(a.raw_groups) as number[], subject_names: Array.from(a.raw_subjects) as string[], period_ids: Array.from(a.raw_periods) as number[], rubric_name: Array.from(a.raw_rubrics)[0] as string }
  showEditActivityModal.value = true
}

async function updateActivityElement() {
  savingActivity.value = true
  await window.electronAPI.updateActivityFull({ oldName: editActivity.value.oldName, data: { name: editActivity.value.name, group_ids: Array.from(editActivity.value.group_ids), subject_names: Array.from(editActivity.value.subject_names), period_ids: Array.from(editActivity.value.period_ids), rubric_name: editActivity.value.rubric_name } })
  showEditActivityModal.value = false
  await loadAll()
  toast.success('Actividad actualizada.')
  savingActivity.value = false
}

async function saveSchool() {
  savingSchool.value = true
  try {
    await window.electronAPI.saveSchool(JSON.parse(JSON.stringify(school.value)))
    toast.success('Datos de la escuela guardados.')
  } catch (e: any) {
    toast.error('Error al guardar la escuela: ' + String(e))
  } finally {
    savingSchool.value = false
  }
}

async function handleLogoUpload(event: Event, field: string) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const base64 = (e.target?.result as string).split(',')[1]
    school.value[field] = base64
    school.value[field + '_mime'] = file.type
    await window.electronAPI.saveSchool(JSON.parse(JSON.stringify(school.value)))
    toast.success('Logo guardado.')
  }
  reader.readAsDataURL(file)
}

async function createCycle() {
  savingCycle.value = true
  try {
    await window.electronAPI.createCycle(JSON.parse(JSON.stringify(newCycle.value)))
    showCycleModal.value = false
    newCycle.value = { name: '', start_date: '', end_date: '', is_active: false }
    await loadAll()
    toast.success('Ciclo escolar creado.')
  } catch (e: any) {
    toast.error('Error al crear el ciclo: ' + String(e))
  } finally {
    savingCycle.value = false
  }
}

async function deleteCycle(id: number) {
  if (!confirm('¿Eliminar este ciclo?')) return
  await window.electronAPI.deleteCycle(id)
  await loadAll()
  toast.success('Ciclo eliminado.')
}

async function createSubject() {
  if (!newSubject.value.name) return
  await window.electronAPI.createSubjectTemplate(JSON.parse(JSON.stringify(newSubject.value)))
  showSubjectModal.value = false
  newSubject.value = { name: '', color: '#6366f1', group_ids: [] }
  await loadAll()
  toast.success('Materia creada.')
}

async function deleteSubject(id: number) {
  if (!confirm('¿Eliminar esta materia?')) return
  await window.electronAPI.deleteSubjectTemplate(id)
  await loadAll()
}

async function createStatus() {
  if (!newStatus.value.name) return
  await window.electronAPI.createStatus(JSON.parse(JSON.stringify(newStatus.value)))
  showStatusModal.value = false
  newStatus.value = { name: '', color: '#6b7280' }
  await loadAll()
  toast.success('Estatus creado.')
}

async function deleteStatus(id: number) {
  const result = await window.electronAPI.deleteStatus(id)
  if (!result.success) { toast.error((result as any).message || 'No se puede eliminar.'); return }
  await loadAll()
}

async function saveIndicators() {
  savingIndicators.value = true
  try {
    await window.electronAPI.updateIndicators(JSON.parse(JSON.stringify(indicators.value)))
    toast.success('Semáforo actualizado.')
  } catch (e: any) {
    toast.error('Error al actualizar semáforo: ' + String(e))
  } finally {
    savingIndicators.value = false
  }
}

async function saveGradingConfig() {
  await window.electronAPI.updateGradingConfig(JSON.parse(JSON.stringify(gradingConfig.value)))
  toast.success('Configuración de calificaciones guardada.')
}

async function exportDB() {
  const result = await window.electronAPI.saveFileDialog({
    title: 'Exportar Base de Datos',
    defaultPath: `arke-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'SQLite DB', extensions: ['db'] }],
  })
  if (!result.canceled && result.filePath) {
    await window.electronAPI.exportDatabase(result.filePath)
    toast.success('Base de datos exportada correctamente.')
  }
}



async function importDB() {
  const result = await window.electronAPI.openFileDialog({
    title: 'Importar Base de Datos',
    filters: [{ name: 'SQLite DB', extensions: ['db'] }],
    properties: ['openFile'],
  })
  if (!result.canceled && result.filePaths[0]) {
    if (!confirm('Se reemplazará toda la base de datos actual. ¿Continuar?')) return
    await window.electronAPI.importDatabase(result.filePaths[0])
    toast.success('Base de datos importada. Reinicia la aplicación para aplicar los cambios.')
  }
}

async function changeDbPath() {
  const result = await window.electronAPI.saveFileDialog({
    title: 'Seleccionar nueva ubicación para la Base de Datos',
    defaultPath: 'arke_software.db',
    filters: [{ name: 'SQLite DB', extensions: ['db'] }],
  })
  if (!result.canceled && result.filePath) {
    changingDbPath.value = true
    try {
      const r = await window.electronAPI.changeDatabasePath(result.filePath)
      if (r.success) {
        toast.success('Ruta de base de datos cambiada. La aplicación usa la nueva ubicación.')
        await loadAll()
      } else {
        toast.error('Error al cambiar ruta: ' + (r.message || 'Desconocido'))
      }
    } catch (e) {
      toast.error('Error al cambiar la ruta.')
    }
    changingDbPath.value = false
  }
}

async function resetDbPath() {
  if (!confirm('Esto restablece la ruta al directorio predeterminado. ¿Continuar?')) return
  const r = await window.electronAPI.resetDatabasePath()
  if (r.success) {
    toast.success('Ruta restablecida. Reinicia la aplicación para aplicar el cambio.')
  }
}

async function exportProfile() {
  const result = await window.electronAPI.saveFileDialog({
    title: 'Exportar Perfil de Usuario',
    defaultPath: `perfil-${new Date().toISOString().slice(0,10)}.json`,
    filters: [{ name: 'Perfil Arkhe', extensions: ['json'] }],
  })
  if (!result.canceled && result.filePath) {
    exportingProfile.value = true
    try {
      const r = await window.electronAPI.exportUserProfile(result.filePath)
      if (r.success) {
        toast.success('Perfil exportado correctamente.')
      } else {
        toast.error('Error al exportar: ' + (r.message || 'Desconocido'))
      }
    } catch (e) {
      toast.error('Error al exportar el perfil.')
    }
    exportingProfile.value = false
  }
}

async function importProfile() {
  const result = await window.electronAPI.openFileDialog({
    title: 'Importar Perfil de Usuario',
    filters: [{ name: 'Perfil Arkhe', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (!result.canceled && result.filePaths[0]) {
    if (!confirm('Se importarán los grupos y alumnos del perfil seleccionado. Los datos existentes NO se eliminarán. ¿Continuar?')) return
    importingProfile.value = true
    try {
      const r = await window.electronAPI.importUserProfile(result.filePaths[0])
      if (r.success) {
        toast.success(`Perfil importado: ${r.groupsImported} grupo(s) y ${r.studentsImported} alumno(s) importados.`)
        await loadAll()
      } else {
        toast.error('Error al importar: ' + (r.message || 'Formato inválido'))
      }
    } catch (e) {
      toast.error('Error al importar el perfil.')
    }
    importingProfile.value = false
  }
}

async function saveSyncConfig() {
  savingSync.value = true
  try {
    localStorage.setItem('arkhe-sync-config', JSON.stringify(syncConfig.value))
    if (syncConfig.value.provider !== 'none') {
      await window.electronAPI.syncSetProvider(syncConfig.value.provider, JSON.parse(JSON.stringify(syncConfig.value)))
      toast.success('Proveedor de sincronización guardado y conectado.')
    } else {
      toast.success('Sincronización desactivada.')
    }
  } catch (e: any) {
    toast.error('Error configurando sincronización: ' + String(e.message || e))
  } finally {
    savingSync.value = false
  }
}

async function forceSyncPush() {
  savingSync.value = true
  try {
    const res = await window.electronAPI.syncPush(JSON.parse(JSON.stringify(syncConfig.value)))
    if (res && res.success) toast.success('Datos subidos correctamente a la nube.')
    else toast.error('Error al subir: ' + (res?.message || ''))
  } catch (e: any) {
    toast.error('Error al subir datos: ' + String(e.message || e))
  } finally {
    savingSync.value = false
  }
}

async function forceSyncPull() {
  savingSync.value = true
  try {
    const res = await window.electronAPI.syncPull(JSON.parse(JSON.stringify(syncConfig.value)))
    if (res && res.success) toast.success('Datos actualizados desde la nube.')
    else toast.error('Error al descargar: ' + (res?.message || ''))
  } catch (e: any) {
    toast.error('Error al descargar datos: ' + String(e.message || e))
  } finally {
    savingSync.value = false
  }
}

// ─────────────────────────────────────────────────────────────────
// Tipos de Incidente func
// ─────────────────────────────────────────────────────────────────
async function createIncidentType() {
  if (!newIncidentType.value.name) return
  try {
    const res = await window.electronAPI.createIncidentType({ name: newIncidentType.value.name })
    if (res.success) {
      toast.success('Tipo de incidente creado.')
      incidentTypes.value = await window.electronAPI.getIncidentTypes()
      showIncidentTypeModal.value = false
      newIncidentType.value.name = ''
    } else {
      toast.error('Error al crear tipo de incidente.')
    }
  } catch(e) { toast.error('Error.') }
}

function openEditIncidentType(item: any) {
  editIncidentTypeData.value = { ...item }
  showEditIncidentTypeModal.value = true
}

async function updateIncidentType() {
  if (!editIncidentTypeData.value.name) return
  savingEditIncidentType.value = true
  try {
    const res = await window.electronAPI.updateIncidentType(editIncidentTypeData.value.id, { name: editIncidentTypeData.value.name })
    if (res.success) {
      toast.success('Tipo de incidente actualizado.')
      incidentTypes.value = await window.electronAPI.getIncidentTypes()
      showEditIncidentTypeModal.value = false
    } else {
      toast.error('Error al actualizar.')
    }
  } catch(e) {}
  savingEditIncidentType.value = false
}

async function deleteIncidentType(id: number) {
  if (!confirm('¿Eliminar este tipo de incidente?')) return
  try {
    const res = await window.electronAPI.deleteIncidentType(id)
    if (res.success) {
      toast.success('Tipo eliminado.')
      incidentTypes.value = await window.electronAPI.getIncidentTypes()
    } else {
      toast.error(res.message || 'Error al eliminar.')
    }
  } catch(e) {}
}

function canEditStatus(name: string) {
  return !['Activo', 'Baja'].includes(name)
}

function toggleAutoBackupDb() {
  localStorage.setItem('arkhe-auto-backup-db', String(autoBackupDb.value))
}

function toggleAutoBackupProfile() {
  localStorage.setItem('arkhe-auto-backup-profile', String(autoBackupProfile.value))
}

async function selectAutoBackupDbPath() {
  const result = await window.electronAPI.openFileDialog({
    title: 'Seleccionar carpeta para Auto-Respaldo DB',
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths[0]) {
    autoBackupDbPath.value = result.filePaths[0]
    localStorage.setItem('arkhe-auto-backup-db-path', autoBackupDbPath.value)
  }
}

async function selectAutoBackupProfilePath() {
  const result = await window.electronAPI.openFileDialog({
    title: 'Seleccionar carpeta para Auto-Respaldo Perfil',
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths[0]) {
    autoBackupProfilePath.value = result.filePaths[0]
    localStorage.setItem('arkhe-auto-backup-profile-path', autoBackupProfilePath.value)
  }
}

async function manualBackupDb() {
  if (autoBackupDbPath.value) {
    const filePath = `${autoBackupDbPath.value}/arkhe_db_backup_${new Date().getTime()}.db`
    await window.electronAPI.exportDatabase(filePath)
    const dstr = new Date().toLocaleString()
    lastBackupDbDate.value = dstr
    localStorage.setItem('arkhe-last-backup-db', dstr)
    toast.success('Respaldo de Base de Datos realizado correctamente.')
  } else {
    exportDB()
  }
}

async function manualBackupProfile() {
  if (autoBackupProfilePath.value) {
    const filePath = `${autoBackupProfilePath.value}/arkhe_profile_backup_${new Date().getTime()}.json`
    const r = await window.electronAPI.exportUserProfile(filePath)
    if (r.success) {
      const dstr = new Date().toLocaleString()
      lastBackupProfileDate.value = dstr
      localStorage.setItem('arkhe-last-backup-profile', dstr)
      toast.success('Respaldo de Perfil realizado correctamente.')
    } else {
      toast.error('Error al exportar: ' + (r.message || 'Desconocido'))
    }
  } else {
    exportProfile()
  }
}

function openEditCycle(cycle: any) {
  editCycleData.value = { ...cycle }
  showEditCycleModal.value = true
}

async function updateCycle() {
  savingEditCycle.value = true
  try {
    await window.electronAPI.updateCycle(editCycleData.value.id, JSON.parse(JSON.stringify(editCycleData.value)))
    showEditCycleModal.value = false
    await loadAll()
    toast.success('Ciclo escolar actualizado.')
  } catch (e: any) {
    toast.error('Error al actualizar el ciclo: ' + String(e))
  } finally {
    savingEditCycle.value = false
  }
}

function openEditSubject(subject: any) {
  editSubjectData.value = { ...subject, group_ids: Array.isArray(subject.group_ids) ? [...subject.group_ids] : [] }
  showEditSubjectModal.value = true
}

async function updateSubject() {
  savingEditSubject.value = true
  try {
    await window.electronAPI.updateSubjectTemplate(editSubjectData.value.id, JSON.parse(JSON.stringify(editSubjectData.value)))
    showEditSubjectModal.value = false
    await loadAll()
    toast.success('Materia actualizada.')
  } catch (e: any) {
    toast.error('Error al actualizar la materia: ' + String(e))
  } finally {
    savingEditSubject.value = false
  }
}

function openEditStatus(status: any) {
  if (!canEditStatus(status.name)) return
  editStatusData.value = { ...status }
  showEditStatusModal.value = true
}

async function updateStatus() {
  savingEditStatus.value = true
  try {
    await window.electronAPI.updateStatus(editStatusData.value.id, JSON.parse(JSON.stringify(editStatusData.value)))
    showEditStatusModal.value = false
    await loadAll()
    toast.success('Estatus actualizado.')
  } catch (e: any) {
    toast.error('Error al actualizar el estatus: ' + String(e))
  } finally {
    savingEditStatus.value = false
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Configuración</h2>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs-grid">
        <button class="tab-btn" :class="{ active: activeTab === 'school' }" @click="activeTab = 'school'">🏫 Escuela</button>
        <button class="tab-btn" :class="{ active: activeTab === 'cycles' }" @click="activeTab = 'cycles'">📅 Ciclos</button>
        <button class="tab-btn" :class="{ active: activeTab === 'trimesters' }" @click="activeTab = 'trimesters'; loadTrimesters()">⏱️ Trimestres</button>
        <button class="tab-btn" :class="{ active: activeTab === 'subjects' }" @click="activeTab = 'subjects'">📚 Materias</button>
        <button class="tab-btn" :class="{ active: activeTab === 'statuses' }" @click="activeTab = 'statuses'">🏷️ Estatus</button>
        <button class="tab-btn" :class="{ active: activeTab === 'incident_types' }" @click="activeTab = 'incident_types'">⚠️ Tipos de Incidente</button>
        <button class="tab-btn" :class="{ active: activeTab === 'evaluations' }" @click="activeTab = 'evaluations'">📝 Eval. Formativa</button>
        <button class="tab-btn" :class="{ active: activeTab === 'activities' }" @click="activeTab = 'activities'">📋 Actividades</button>
        <button class="tab-btn" :class="{ active: activeTab === 'grading' }" @click="activeTab = 'grading'">📊 Calificaciones</button>
        <button class="tab-btn" :class="{ active: activeTab === 'indicators' }" @click="activeTab = 'indicators'">🚦 Semáforo</button>
        <button class="tab-btn" :class="{ active: activeTab === 'database' }" @click="activeTab = 'database'">💾 Base de Datos</button>
        <button class="tab-btn" :class="{ active: activeTab === 'sync' }" @click="activeTab = 'sync'">☁️ Sincronización</button>
        <button class="tab-btn" :class="{ active: activeTab === 'ia' }" @click="activeTab = 'ia'">🤖 IA</button>
      </div>
    </div>

    <!-- Escuela -->
    <div v-if="activeTab === 'school'" class="card">
      <h3 style="margin-bottom: 20px;">Datos de la Escuela</h3>
      <div class="grid-2" style="gap: 16px;">
        <div class="form-group">
          <label class="form-label">Nombre de la Escuela</label>
          <input v-model="school.name" type="text" class="form-input" placeholder="Nombre oficial" />
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del Director(a)</label>
          <input v-model="school.principal_name" type="text" class="form-input" placeholder="Nombre completo" />
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input v-model="school.address" type="text" class="form-input" placeholder="Calle y número" />
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input v-model="school.phone" type="tel" class="form-input" placeholder="Teléfono" />
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input v-model="school.email" type="email" class="form-input" placeholder="correo@escuela.edu" />
        </div>
      </div>
      <div class="grid-2" style="gap: 16px; margin-top: 16px;">
        <div class="form-group">
          <label class="form-label">Logo de la Escuela</label>
          <input type="file" accept="image/*" class="form-input" style="padding: 8px;"
            @change="e => handleLogoUpload(e, 'logo')" />
          <div v-if="school.logo" style="margin-top: 8px;">
            <img :src="`data:${school.logo_mime};base64,${school.logo}`" style="height: 60px; border-radius: 8px; border: 1px solid var(--border);" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Logo del Estado / SEP</label>
          <input type="file" accept="image/*" class="form-input" style="padding: 8px;"
            @change="e => handleLogoUpload(e, 'state_logo')" />
          <div v-if="school.state_logo" style="margin-top: 8px;">
            <img :src="`data:${school.state_logo_mime};base64,${school.state_logo}`" style="height: 60px; border-radius: 8px; border: 1px solid var(--border);" />
          </div>
        </div>
      </div>
      <div class="modal-footer" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
        <button class="btn btn-primary" @click="saveSchool" :disabled="savingSchool">
          <span v-if="savingSchool" class="spinner"></span>
          <span v-else>💾 Guardar</span>
        </button>
      </div>
    </div>

    <!-- Ciclos Escolares -->
    <div v-if="activeTab === 'cycles'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Ciclos Escolares</h3>
        <button class="btn btn-primary" @click="showCycleModal = true">+ Nuevo Ciclo</button>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="data-table" v-if="cycles.length > 0">
          <thead><tr><th>Nombre</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr v-for="cycle in cycles" :key="cycle.id">
              <td style="font-weight: 500;">{{ cycle.name }}</td>
              <td>{{ cycle.start_date || '—' }}</td>
              <td>{{ cycle.end_date || '—' }}</td>
              <td><span class="badge" :class="cycle.is_active ? 'badge-success' : 'badge-neutral'">{{ cycle.is_active ? 'Activo' : 'Inactivo' }}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" @click="openEditCycle(cycle)">✏️</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteCycle(cycle.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state"><div class="empty-state-icon">📅</div><h3>No hay ciclos</h3><p>Crea tu primer ciclo escolar.</p></div>
      </div>
    </div>

    <!-- Trimestres -->
    <div v-if="activeTab === 'trimesters'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Fechas de Trimestres</h3>
      </div>
      <div class="card" style="margin-bottom: 16px;">
        <div class="form-group" style="max-width: 300px;">
          <label class="form-label">Seleccionar Ciclo Escolar</label>
          <select class="form-select" v-model="trimestersCycleId" @change="loadTrimesters">
            <option v-for="c in cycles" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <div class="grid-3" v-if="trimestersCycleId && trimestersData.length > 0">
        <div v-for="t in trimestersData" :key="t.trimester_number" class="card" style="gap: 16px;">
          <h4 style="margin-bottom: 12px; color: var(--color-primary);">Trimestre {{ t.trimester_number }}</h4>
          <div class="form-group">
            <label class="form-label">Fecha Inicio</label>
            <input type="date" class="form-input" v-model="t.start_date" />
          </div>
          <div class="form-group" style="margin-top: 12px;">
            <label class="form-label">Fecha Fin</label>
            <input type="date" class="form-input" v-model="t.end_date" />
          </div>
        </div>
      </div>
      <div style="margin-top: 24px;" v-if="trimestersCycleId">
        <button class="btn btn-primary" @click="saveTrimesters" :disabled="savingTrimesters">
          <span v-if="savingTrimesters" class="spinner"></span>
          <span v-else>💾 Guardar Fechas</span>
        </button>
      </div>
    </div>

    <!-- Evaluación Formativa -->
    <div v-if="activeTab === 'evaluations'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Elementos de Evaluación Formativa</h3>
        <button class="btn btn-primary" @click="showEvalModal = true">+ Nuevo Elemento</button>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="data-table" v-if="groupedEvalElements.length > 0">
          <thead><tr>
            <th @click="setEvalSort('name')" style="cursor:pointer">Nombre {{ evalSortKey === 'name' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('groupsStr')" style="cursor:pointer">Grupo/Grado {{ evalSortKey === 'groupsStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('subjectsStr')" style="cursor:pointer">Materia {{ evalSortKey === 'subjectsStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('trimestersStr')" style="cursor:pointer">Trimestre {{ evalSortKey === 'trimestersStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th>Puntaje</th>
            <th>Extra</th>
          </tr></thead>
          <tbody>
            <tr v-for="e in groupedEvalElements" :key="e.name">
              <td style="font-weight: 500;">{{ e.name }}</td>
              <td style="font-size: 13px">{{ e.groupsStr }}</td>
              <td style="font-size: 13px">{{ e.subjectsStr }}</td>
              <td style="font-size: 13px">{{ e.trimestersStr }}</td>
              <td>{{ e.percentage }}</td>
              <td><span class="badge" :class="e.is_extra ? 'badge-primary' : 'badge-neutral'">{{ e.is_extra ? 'Sí' : 'No' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditEval(e)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteEvalElement(e.name)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state"><div class="empty-state-icon">📝</div><h3>No hay elementos</h3><p>Crea tu primer elemento.</p></div>
      </div>
    </div>

    <!-- Actividades -->
    <div v-if="activeTab === 'activities'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Actividades</h3>
        <button class="btn btn-primary" @click="showActivityModal = true">+ Nueva Actividad</button>
      </div>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="data-table" v-if="groupedActivities.length > 0">
          <thead><tr>
            <th @click="setActSort('name')" style="cursor:pointer">Nombre {{ actSortKey === 'name' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('elementsStr')" style="cursor:pointer">Elemento {{ actSortKey === 'elementsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('groupsStr')" style="cursor:pointer">Grupo/Grado {{ actSortKey === 'groupsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('subjectsStr')" style="cursor:pointer">Materia {{ actSortKey === 'subjectsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('trimestersStr')" style="cursor:pointer">Trimestre {{ actSortKey === 'trimestersStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="a in groupedActivities" :key="a.name">
              <td style="font-weight: 500;">{{ a.name }}</td>
              <td style="font-size: 13px">{{ a.elementsStr }}</td>
              <td style="font-size: 13px">{{ a.groupsStr }}</td>
              <td style="font-size: 13px">{{ a.subjectsStr }}</td>
              <td style="font-size: 13px">{{ a.trimestersStr }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditActivity(a)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteActivityElement(a.name)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state"><div class="empty-state-icon">📋</div><h3>No hay actividades</h3><p>Crea tu primera actividad.</p></div>
      </div>
    </div>

    <!-- Materias -->
    <div v-if="activeTab === 'subjects'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Materias / Asignaturas</h3>
        <button class="btn btn-primary" @click="showSubjectModal = true">+ Nueva Materia</button>
      </div>
      <div class="grid-3">
        <div v-for="s in subjects" :key="s.id" class="card" style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 16px; height: 16px; border-radius: 50%;" :style="{ background: s.color }"></div>
          <span style="flex: 1; font-weight: 500;">{{ s.name }}</span>
          <button class="btn btn-ghost btn-sm" @click="openEditSubject(s)">✏️</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteSubject(s.id)">🗑️</button>
          </div>
          <div style="font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 8px;">
            <span v-if="s.assigned_groups_str">Asignado a: {{ s.assigned_groups_str }}</span>
            <span v-else>Agrega una asignación de grupo</span>
          </div>
        </div>
        <div v-if="subjects.length === 0" class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">📚</div><h3>No hay materias</h3></div>
      </div>
    </div>

    <!-- Estatus de alumnos -->
    <div v-if="activeTab === 'statuses'">
      <div class="flex justify-between items-center" style="margin-bottom: 16px;">
        <h3>Estatus de Alumnos</h3>
        <button class="btn btn-primary" @click="showStatusModal = true">+ Nuevo Estatus</button>
      </div>
      <div class="grid-3">
        <div v-for="s in statuses" :key="s.id" class="card" style="display: flex; align-items: center; gap: 12px; padding: 16px;">
          <div style="width: 16px; height: 16px; border-radius: 50%;" :style="{ background: s.color }"></div>
          <span style="flex: 1; font-weight: 500;">{{ s.name }}</span>
          <span v-if="s.is_default" class="badge badge-primary" style="font-size: 10px;">Default</span>
          <div v-if="canEditStatus(s.name)" class="flex gap-1">
            <button class="btn btn-ghost btn-sm" @click="openEditStatus(s)">✏️</button>
            <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteStatus(s.id)">🗑️</button>
          </div>
          <div v-else class="text-muted" style="font-size: 12px; margin-right: 8px;">
            Sistema
          </div>
        </div>
      </div>
    </div>

    <!-- Tipos de Incidente -->
    <div v-if="activeTab === 'incident_types'">
      <div class="flex justify-between items-center" style="margin-bottom: 20px;">
        <h2>Tipos de Incidente</h2>
        <button class="btn btn-primary" @click="showIncidentTypeModal = true">+ Nuevo Tipo</button>
      </div>
      <div class="card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Tipo</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in incidentTypes" :key="t.id">
              <td class="text-muted">#{{ t.id }}</td>
              <td><strong>{{ t.name }}</strong></td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" @click="openEditIncidentType(t)">Editar</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteIncidentType(t.id)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="incidentTypes.length === 0">
              <td colspan="3" class="text-center text-muted" style="padding: 20px;">No hay tipos de incidente registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Configuración de calificaciones -->
    <div v-if="activeTab === 'grading'" class="card">
      <h3 style="margin-bottom: 20px;">Configuración de Calificaciones</h3>
      <div class="grid-3" style="gap: 16px;">
        <div class="form-group">
          <label class="form-label">Calificación Máxima</label>
          <input v-model.number="gradingConfig.setting_max_score" type="number" min="1" max="100" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Calificación Mínima para Pasar</label>
          <input v-model.number="gradingConfig.setting_min_pass" type="number" min="0" max="100" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Número de Periods (Trimestres)</label>
          <select v-model.number="gradingConfig.setting_periods" class="form-select">
            <option :value="2">2 Períodos</option>
            <option :value="3">3 Trimestres</option>
            <option :value="4">4 Bimestres</option>
          </select>
        </div>
      </div>
      <div style="margin-top: 24px;">
        <button class="btn btn-primary" @click="saveGradingConfig">💾 Guardar</button>
      </div>
    </div>

    <!-- Semáforo de calificaciones -->
    <div v-if="activeTab === 'indicators'" class="card">
      <h3 style="margin-bottom: 20px;">Semáforo de Calificaciones</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div v-for="(ind, idx) in indicators" :key="ind.id || idx" style="display: flex; align-items: center; gap: 12px;">
          <input type="color" v-model="ind.color" style="width: 40px; height: 36px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer;" />
          <input v-model="ind.label" type="text" class="form-input" style="width: 160px;" placeholder="Etiqueta" />
          <span class="text-muted" style="font-size: 13px;">de</span>
          <input v-model.number="ind.min_value" type="number" min="0" max="10" class="form-input" style="width: 80px;" />
          <span class="text-muted" style="font-size: 13px;">a</span>
          <input v-model.number="ind.max_value" type="number" min="0" max="10" class="form-input" style="width: 80px;" />
          <span class="badge" :style="{ background: ind.color + '30', color: ind.color }">Vista previa</span>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <button class="btn btn-primary" @click="saveIndicators" :disabled="savingIndicators">
          <span v-if="savingIndicators" class="spinner"></span>
          <span v-else>💾 Guardar Semáforo</span>
        </button>
      </div>
    </div>

    <!-- Base de Datos -->
    <div v-if="activeTab === 'database'" class="card">
      <h3 style="margin-bottom: 20px;">Gestión de Base de Datos</h3>
      <div v-if="dbInfo" class="grid-3" style="gap: 16px; margin-bottom: 24px;">
        <div class="stat-card">
          <div style="font-size: 24px;">💾</div>
          <div class="stat-card-value">{{ formatBytes(dbInfo.size) }}</div>
          <div class="stat-card-label">Tamaño</div>
        </div>
        <div class="stat-card" style="grid-column: 2 / -1;">
          <div class="stat-card-label">Ubicación actual</div>
          <div style="font-size: 12px; font-family: monospace; word-break: break-all; margin-top: 4px; color: var(--text-muted);">{{ dbInfo.path }}</div>
        </div>
      </div>

      <!-- Backup / Importar -->
      <div class="flex gap-4">
        <button class="btn btn-secondary" @click="exportDB">📤 Exportar Backup</button>
        <button class="btn btn-secondary" @click="importDB" style="color: var(--color-warning);">📥 Importar DB</button>
      </div>
      <div style="margin-top: 12px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: var(--radius); padding: 12px; font-size: 13px; color: #fbbf24;">
        ⚠️ Al importar una base de datos, se reemplazarán TODOS los datos actuales. Haz un backup antes de importar.
      </div>

      <!-- Cambiar ruta de BD -->
      <div style="margin-top: 28px; border-top: 1px solid var(--border); padding-top: 24px;">
        <h4 style="margin-bottom: 12px;">📂 Cambiar Ruta de Almacenamiento</h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Puedes mover la base de datos a otra ubicación (ej. un disco externo o carpeta de red). La aplicación copiará los datos actuales antes de cambiar.
        </p>
        <div class="flex gap-3">
          <button class="btn btn-primary" @click="changeDbPath" :disabled="changingDbPath">
            <span v-if="changingDbPath" class="spinner"></span>
            <span v-else>📂 Cambiar Ubicación...</span>
          </button>
          <button class="btn btn-ghost" @click="resetDbPath" style="color: var(--color-warning);" title="Restablece al directorio predeterminado">
            🔄 Restablecer Predeterminada
          </button>
        </div>
      </div>

      <!-- Auto Respaldo DB -->
      <div style="margin-top: 28px; border-top: 1px solid var(--border); padding-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
           <h4>🛡️ Auto-Respaldo Base de Datos</h4>
           <label class="toggle-switch">
             <input type="checkbox" v-model="autoBackupDb" @change="toggleAutoBackupDb" />
             <span class="slider round"></span>
           </label>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Guarda automáticamente un respaldo de la base de datos en una ubicación segura cada vez que hay cambios.
        </p>
        <div class="form-group" style="margin-bottom: 16px;" v-if="autoBackupDb">
          <label class="form-label">Carpeta de Guardado</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" v-model="autoBackupDbPath" readonly class="form-input" placeholder="Ninguna carpeta seleccionada" />
            <button class="btn btn-secondary" @click="selectAutoBackupDbPath">Examinar</button>
          </div>
        </div>
        <div class="flex gap-4 items-center">
            <button class="btn btn-secondary" @click="manualBackupDb">
               📤 Realizar Respaldo
            </button>
            <div v-if="lastBackupDbDate" style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
               ✅ Último respaldo: {{ lastBackupDbDate }}
            </div>
        </div>
      </div>

      <!-- Auto Respaldo Perfil -->
      <div style="margin-top: 28px; border-top: 1px solid var(--border); padding-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
           <h4>👤 Auto-Respaldo Perfil de Usuario</h4>
           <label class="toggle-switch">
             <input type="checkbox" v-model="autoBackupProfile" @change="toggleAutoBackupProfile" />
             <span class="slider round"></span>
           </label>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Exporta todos tus grupos, alumnos, evaluaciones y asistencias de manera transparente.
        </p>
        <div class="form-group" style="margin-bottom: 16px;" v-if="autoBackupProfile">
          <label class="form-label">Carpeta de Guardado</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" v-model="autoBackupProfilePath" readonly class="form-input" placeholder="Ninguna carpeta seleccionada" />
            <button class="btn btn-secondary" @click="selectAutoBackupProfilePath">Examinar</button>
          </div>
        </div>
        <div class="flex gap-4 items-center">
            <button class="btn btn-secondary" @click="manualBackupProfile">
               📤 Respaldar Mi Perfil
            </button>
            <div v-if="lastBackupProfileDate" style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
               ✅ Último respaldo: {{ lastBackupProfileDate }}
            </div>
        </div>
        <div style="margin-top: 16px;">
          <button class="btn btn-secondary" @click="importProfile" :disabled="importingProfile" style="color: var(--color-primary);">
            <span v-if="importingProfile" class="spinner"></span>
            <span v-else>📥 Importar Perfil Manualmente</span>
          </button>
        </div>
      </div>

    </div>

    <!-- Sincronización Multi-Dispositivo -->
    <div v-if="activeTab === 'sync'" style="display: flex; align-items: center; justify-content: center; min-height: 480px; padding: 20px;">
      
      <div v-if="syncConfig.provider === 'none'" style="background: #212121; width: 100%; max-width: 440px; border-radius: 12px; padding: 36px 40px; color: #fff; font-family: var(--font-sans); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
        <div style="display: flex; justify-content: center; margin-bottom: 24px;">
           <h2 style="font-size: 26px; font-weight: 700; margin: 0; color: #fff;">Iniciar sesión o registrarse</h2>
        </div>
        <p style="text-align: center; color: #ececec; font-size: 15px; margin-bottom: 32px; font-weight: 400; line-height: 1.5;">
          Obtendrás respuestas más inteligentes, podrás cargar archivos e imágenes, y más.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="social-btn2" @click="simulateLogin('firebase')">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
          <button class="social-btn2" @click="simulateLogin('cloudkit')">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16z"/>
              <path d="M16.182 13.918c-.023-1.638 1.488-2.31 1.558-2.348-1.55-2.128-3.033-2.355-3.57-2.42-1.94-.183-3.66 1.053-4.66 1.053-1.025 0-2.38-1.01-3.785-.98-1.83.025-3.518 1.04-4.453 2.65-1.898 3.238-.485 8.01 1.353 10.61 1.34 1.935 2.915 4.108 5.065 4.025 1.928-.08 2.508-1.18 4.793-1.18 2.27 0 2.83 1.18 4.885 1.14 2.1-.04 3.465-2.023 4.79-3.92.935-1.288 1.838-3.4 1.905-3.468-.043-.015-3.858-1.445-3.88-4.162zM14.075 5.75c1.013-1.145 1.63-2.67 1.48-4.22-1.433.053-3.085.83-4.113 1.968-.865.945-1.573 2.503-1.4 4.01 1.545.105 3.018-.625 4.033-1.758z"/>
            </svg>
            Continuar con Apple
          </button>
          <button class="social-btn2" @click="simulateLogin('msgraph')">
            <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
            Continuar con el teléfono
          </button>
          <button class="social-btn2" @click="simulateLogin('qwen')" style="background: #6366f1; border-color: #4f46e5;">
            <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
              <path d="M512 192c-176.7 0-320 143.3-320 320s143.3 320 320 320 320-143.3 320-320-143.3-320-320-320zm0 576c-141.4 0-256-114.6-256-256s114.6-256 256-256 256 114.6 256 256-114.6 256-256 256z"/>
              <path d="M512 320c-106 0-192 86-192 192s86 192 192 192 192-86 192-192-86-192-192-192zm0 320c-70.7 0-128-57.3-128-128s57.3-128 128-128 128 57.3 128 128-57.3 128-128 128z"/>
            </svg>
            Continuar con Qwen
          </button>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; margin: 24px 0; color: #a1a1aa; font-size: 14px;">
          <div style="flex: 1; height: 1px; background: #3f3f46;"></div>
          <span style="padding: 0 16px; font-weight: 500;">o</span>
          <div style="flex: 1; height: 1px; background: #3f3f46;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <input type="email" v-model="syncConfig.email" class="auth-input2" placeholder="Dirección de correo electrónico" />
          <input type="password" v-model="syncConfig.password" class="auth-input2" placeholder="Contraseña" v-if="syncConfig.email.trim().length > 0" />
          
          <button class="btn-continuar" @click="simulateLogin('firebase')" :disabled="savingSync">
             <span v-if="savingSync" class="spinner" style="border-top-color: #000; width: 22px; height: 22px;"></span>
             <span v-else>Continuar</span>
          </button>
        </div>
      </div>

      <div v-else class="card" style="width: 100%; max-width: 440px; text-align: center; padding: 48px 32px; background: #212121; border-radius: 12px; color: #fff; border: 1px solid #3f3f46;">
         <p style="font-size: 18px; font-weight: 600; margin-bottom: 24px;">
           <span style="color: #10a37f; font-size: 28px; vertical-align: middle;">✓</span> Sesión iniciada
         </p>
         <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 32px;">
           Estás conectado exitosamente con <strong>{{ syncProviderName }}</strong>.
         </p>
         <div style="display: flex; flex-direction: column; gap: 12px;">
           <button class="social-connected-btn" @click="forceSyncPush" :disabled="savingSync">
             ⬆️ Subir Datos (Respaldar)
           </button>
           <button class="social-connected-btn" @click="forceSyncPull" :disabled="savingSync">
             ⬇️ Descargar Datos (Sincronizar)
           </button>
           <button class="social-connected-danger-btn" @click="disconnectSync">
             Cerrar sesión
           </button>
         </div>
      </div>
    </div>
    <!-- IA -->
    <div v-if="activeTab === 'ia'" class="fade-in">
      <div class="card">
        <h3 style="margin-bottom: 20px;">Planes de IA y Modelos</h3>
        <p class="text-muted" style="margin-bottom: 24px;">Configura los modelos de Inteligencia Artificial que Antigravity utilizará para asistirte.</p>
        
        <div class="grid-2" style="gap: 24px;">
          <div class="form-group">
            <label class="form-label">Modelo de IA Predeterminado</label>
            <select v-model="aiConfig.model" class="form-select">
              <optgroup label="Modelos Disponibles">
                <option value="gemini-3.1-pro-high">Gemini 3.1 Pro (High) ⚠️ New</option>
                <option value="gemini-3.1-pro-low">Gemini 3.1 Pro (Low) ⚠️ New</option>
                <option value="gemini-3-flash">Gemini 3 Flash</option>
                <option value="claude-sonnet-4.6">Claude Sonnet 4.6 (Thinking)</option>
                <option value="claude-opus-4.6">Claude Opus 4.6 (Thinking)</option>
                <option value="gpt-oss-120b">GPT-OSS 120B (Medium)</option>
                <option value="qwen-72b">Qwen 2.5 72B (Antigravity Edition)</option>
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">API Key / Token de Qwen</label>
            <div style="display: flex; gap: 8px;">
               <input v-model="aiConfig.qwenKey" type="password" class="form-input" placeholder="Ingresa tu token..." />
               <button class="btn btn-primary" @click="saveAiConfig">Guardar</button>
            </div>
          </div>
        </div>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);">
          <h4 style="margin-bottom: 16px;">Planes Activos</h4>
          <div class="grid-3" style="gap: 16px;">
            <div class="card" style="background: rgba(99, 102, 241, 0.05); border: 1px solid var(--color-primary); padding: 16px;">
               <div style="font-weight: bold; font-size: 15px;">Plan Antigravity</div>
               <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Acceso premium a Qwen y Gemini</div>
               <div class="badge badge-success" style="margin-top: 12px;">ACTIVO</div>
            </div>
            <div class="card" style="padding: 16px; opacity: 0.7;">
               <div style="font-weight: bold; font-size: 15px;">Plan Básico</div>
               <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Solo Gemini Flash</div>
               <button class="btn btn-sm btn-ghost" style="margin-top: 12px;">Mejorar</button>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Modal: Nuevo Ciclo -->
    <div v-if="showCycleModal" class="modal-overlay" @click.self="showCycleModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nuevo Ciclo Escolar</h2><button class="btn btn-ghost btn-icon" @click="showCycleModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre (Ej: 2025-2026)</label><input v-model="newCycle.name" type="text" class="form-input" placeholder="2025-2026" /></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Inicio</label><input v-model="newCycle.start_date" type="date" class="form-input" /></div>
            <div class="form-group"><label class="form-label">Fin</label><input v-model="newCycle.end_date" type="date" class="form-input" /></div>
          </div>
          <label class="flex items-center gap-2" style="cursor: pointer; font-size: 14px;"><input type="checkbox" v-model="newCycle.is_active" /> Marcar como ciclo activo</label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCycleModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createCycle" :disabled="savingCycle"><span v-if="savingCycle" class="spinner"></span><span v-else>Crear</span></button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Ciclo -->
    <div v-if="showEditCycleModal" class="modal-overlay" @click.self="showEditCycleModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Ciclo Escolar</h2><button class="btn btn-ghost btn-icon" @click="showEditCycleModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre</label><input v-model="editCycleData.name" type="text" class="form-input" /></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Inicio</label><input v-model="editCycleData.start_date" type="date" class="form-input" /></div>
            <div class="form-group"><label class="form-label">Fin</label><input v-model="editCycleData.end_date" type="date" class="form-input" /></div>
          </div>
          <label class="flex items-center gap-2" style="cursor: pointer; font-size: 14px;"><input type="checkbox" v-model="editCycleData.is_active" /> Marcar como ciclo activo</label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditCycleModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateCycle" :disabled="savingEditCycle"><span v-if="savingEditCycle" class="spinner"></span><span v-else>Guardar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal: Nueva Materia -->
    <div v-if="showSubjectModal" class="modal-overlay" @click.self="showSubjectModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nueva Materia</h2><button class="btn btn-ghost btn-icon" @click="showSubjectModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre de la Materia</label><input v-model="newSubject.name" type="text" class="form-input" placeholder="Ej: Matemáticas" autofocus /></div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-palette-grid">
              <button v-for="c in presetColors" :key="c" :style="{ background: c }" class="color-swatch" :class="{ selected: newSubject.color === c }" @click="newSubject.color = c"></button>
            </div>
            <input v-model="newSubject.color" type="color" class="form-input" style="height: 44px; margin-top: 8px;" />
          </div>
          <div class="form-group">
            <label class="form-label">Grupos Asignados <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list" style="max-height: 150px; overflow-y: auto;">
              <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                <input type="checkbox" :value="g.id" v-model="newSubject.group_ids" />
                {{ g.grade }}° {{ g.name }} ({{ g.cycle }})
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSubjectModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createSubject">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Materia -->
    <div v-if="showEditSubjectModal" class="modal-overlay" @click.self="showEditSubjectModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Materia</h2><button class="btn btn-ghost btn-icon" @click="showEditSubjectModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre de la Materia</label><input v-model="editSubjectData.name" type="text" class="form-input" autofocus /></div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-palette-grid">
              <button v-for="c in presetColors" :key="c" :style="{ background: c }" class="color-swatch" :class="{ selected: editSubjectData.color === c }" @click="editSubjectData.color = c"></button>
            </div>
            <input v-model="editSubjectData.color" type="color" class="form-input" style="height: 44px; margin-top: 8px;" />
          </div>
          <div class="form-group">
            <label class="form-label">Grupos Asignados <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list" style="max-height: 150px; overflow-y: auto;">
              <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                <input type="checkbox" :value="g.id" v-model="editSubjectData.group_ids" />
                {{ g.grade }}° {{ g.name }} ({{ g.cycle }})
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditSubjectModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateSubject" :disabled="savingEditSubject"><span v-if="savingEditSubject" class="spinner"></span><span v-else>Guardar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Estatus -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nuevo Estatus</h2><button class="btn btn-ghost btn-icon" @click="showStatusModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre del Estatus</label><input v-model="newStatus.name" type="text" class="form-input" placeholder="Ej: Irregular" autofocus /></div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-palette-grid">
              <button v-for="c in presetColors" :key="c" :style="{ background: c }" class="color-swatch" :class="{ selected: newStatus.color === c }" @click="newStatus.color = c"></button>
            </div>
            <input v-model="newStatus.color" type="color" class="form-input" style="height: 44px; margin-top: 8px;" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showStatusModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createStatus">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Estatus -->
    <div v-if="showEditStatusModal" class="modal-overlay" @click.self="showEditStatusModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Estatus</h2><button class="btn btn-ghost btn-icon" @click="showEditStatusModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre del Estatus</label><input v-model="editStatusData.name" type="text" class="form-input" autofocus /></div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-palette-grid">
              <button v-for="c in presetColors" :key="c" :style="{ background: c }" class="color-swatch" :class="{ selected: editStatusData.color === c }" @click="editStatusData.color = c"></button>
            </div>
            <input v-model="editStatusData.color" type="color" class="form-input" style="height: 44px; margin-top: 8px;" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditStatusModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateStatus" :disabled="savingEditStatus"><span v-if="savingEditStatus" class="spinner"></span><span v-else>Guardar</span></button>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Eval -->
    <div v-if="showEvalModal" class="modal-overlay" @click.self="showEvalModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nuevo Elemento de Evaluación</h2><button class="btn btn-ghost btn-icon" @click="showEvalModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre del Elemento</label><input v-model="newEval.name" type="text" class="form-input" /></div>
          
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Grupos <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="g.id" v-model="newEval.group_ids" />
                  {{ g.grade }}° {{ g.name }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Materia <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="s in uniqueSubjectNames" :key="s" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="s" v-model="newEval.subject_names" />
                  {{ s }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="1" v-model="newEval.period_ids" /> Trimestre 1</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="2" v-model="newEval.period_ids" /> Trimestre 2</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="3" v-model="newEval.period_ids" /> Trimestre 3</label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Puntaje</label>
              <input v-model.number="newEval.percentage" type="number" step="0.1" class="form-input hide-arrows" :disabled="newEval.is_extra" />
            </div>
          </div>
          
          <label class="flex items-center gap-2" style="cursor: pointer; font-size: 14px;">
            <input type="checkbox" v-model="newEval.is_extra" @change="() => { if(newEval.is_extra) newEval.percentage = 0 }" /> Son puntos extra
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEvalModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createEvaluationElement" :disabled="savingEval || !newEval.subject_names.length || !newEval.name">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Eval -->
    <div v-if="showEditEvalModal" class="modal-overlay" @click.self="showEditEvalModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Elemento de Evaluación</h2><button class="btn btn-ghost btn-icon" @click="showEditEvalModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre del Elemento</label><input v-model="editEval.name" type="text" class="form-input" /></div>
          
          <div class="form-group">
            <label class="form-label">Puntaje</label>
            <input v-model.number="editEval.percentage" type="number" step="0.1" class="form-input hide-arrows" :disabled="editEval.is_extra" />
          </div>
          
          <label class="flex items-center gap-2" style="cursor: pointer; font-size: 14px;">
            <input type="checkbox" v-model="editEval.is_extra" @change="() => { if(editEval.is_extra) editEval.percentage = 0 }" /> Son puntos extra
          </label>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Grupos <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="g.id" v-model="editEval.group_ids" />
                  {{ g.grade }}° {{ g.name }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Materia <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="s in uniqueSubjectNames" :key="s" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="s" v-model="editEval.subject_names" />
                  {{ s }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="1" v-model="editEval.period_ids" /> Trimestre 1</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="2" v-model="editEval.period_ids" /> Trimestre 2</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="3" v-model="editEval.period_ids" /> Trimestre 3</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditEvalModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateEvalElement" :disabled="savingEval || !editEval.name">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Nueva Actividad -->
    <div v-if="showActivityModal" class="modal-overlay" @click.self="showActivityModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nueva Actividad</h2><button class="btn btn-ghost btn-icon" @click="showActivityModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre de la Actividad</label><input v-model="newActivity.name" type="text" class="form-input" /></div>
          
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Grupos <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="g.id" v-model="newActivity.group_ids" />
                  {{ g.grade }}° {{ g.name }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Materia <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="s in uniqueSubjectNames" :key="s" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="s" v-model="newActivity.subject_names" />
                  {{ s }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="1" v-model="newActivity.period_ids" /> Trimestre 1</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="2" v-model="newActivity.period_ids" /> Trimestre 2</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="3" v-model="newActivity.period_ids" /> Trimestre 3</label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Elemento de Evaluación (Rubro)</label>
              <select v-model="newActivity.rubric_name" class="form-select">
                <option value="">Seleccionar Elemento...</option>
                <option v-for="r in uniqueRubricNames" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showActivityModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createActivityElement" :disabled="savingActivity || !newActivity.rubric_name || !newActivity.name || newActivity.group_ids.length === 0">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Actividad -->
    <div v-if="showEditActivityModal" class="modal-overlay" @click.self="showEditActivityModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Actividad</h2><button class="btn btn-ghost btn-icon" @click="showEditActivityModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre de la Actividad</label><input v-model="editActivity.name" type="text" class="form-input" /></div>
          
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Grupos <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="g in formGroups" :key="g.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="g.id" v-model="editActivity.group_ids" />
                  {{ g.grade }}° {{ g.name }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Materia <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label v-for="s in uniqueSubjectNames" :key="s" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                  <input type="checkbox" :value="s" v-model="editActivity.subject_names" />
                  {{ s }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
              <div class="checkbox-list">
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="1" v-model="editActivity.period_ids" /> Trimestre 1</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="2" v-model="editActivity.period_ids" /> Trimestre 2</label>
                <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="3" v-model="editActivity.period_ids" /> Trimestre 3</label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Elemento de Evaluación (Rubro)</label>
              <select v-model="editActivity.rubric_name" class="form-select">
                <option value="">Seleccionar Elemento...</option>
                <option v-for="r in uniqueRubricNames" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditActivityModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateActivityElement" :disabled="savingActivity || !editActivity.name">Guardar</button>
        </div>
      </div>
    </div>
    <!-- Modal: Crear Tipo de Incidente -->
    <div v-if="showIncidentTypeModal" class="modal-overlay" @click.self="showIncidentTypeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nuevo Tipo de Incidente</h2>
          <button class="btn btn-ghost btn-icon" @click="showIncidentTypeModal = false">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Nombre del Tipo</label>
            <input v-model="newIncidentType.name" type="text" class="form-input" placeholder="Ej: Indisciplina, Retardo..." @keyup.enter="createIncidentType" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showIncidentTypeModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createIncidentType">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Tipo de Incidente -->
    <div v-if="showEditIncidentTypeModal" class="modal-overlay" @click.self="showEditIncidentTypeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Tipo de Incidente</h2>
          <button class="btn btn-ghost btn-icon" @click="showEditIncidentTypeModal = false">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Nombre del Tipo</label>
            <input v-model="editIncidentTypeData.name" type="text" class="form-input" @keyup.enter="updateIncidentType" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditIncidentTypeModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateIncidentType" :disabled="savingEditIncidentType">
            <span v-if="savingEditIncidentType" class="spinner"></span>
            <span v-else>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  padding: 0;
}
.color-swatch:hover {
  transform: scale(1.1);
}
.color-swatch.selected {
  border-color: var(--color-primary);
  transform: scale(1.1);
  box-shadow: 0 0 0 2px var(--bg-card);
}
.form-input[type="number"]::-webkit-outer-spin-button,
.form-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
.form-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Nuevos Estilos para Tabs en 2 filas */
.tabs-container {
  margin-bottom: 24px;
}
.tabs-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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

.auth-modal {
  max-width: 440px !important;
  border-radius: 20px !important;
  padding: 36px 32px !important;
}

.auth-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  font-size: 15px;
  transition: all 0.2s;
  color: var(--text-primary);
}

.auth-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.btn-pill {
  width: 100%;
  border-radius: 30px !important;
  padding: 14px 0 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 24px;
  border-radius: 30px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.social-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-muted);
}

.social-btn.active {
  border-color: var(--color-primary);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.social-btn2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 52px;
  border-radius: 999px;
  border: 1px solid #52525b;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.social-btn2:hover {
  background: #27272a;
}
.auth-input2 {
  height: 52px;
  border-radius: 8px;
  border: 1px solid #71717a;
  background: transparent;
  color: #fff;
  padding: 0 20px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.auth-input2:focus {
  border-color: #10a37f;
}
.btn-continuar {
  height: 52px;
  border-radius: 999px;
  background: #fff;
  color: #000;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-continuar:hover {
  opacity: 0.9;
}
.social-connected-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #52525b;
  background: transparent;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.social-connected-btn:hover {
  background: #27272a;
}
.social-connected-danger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: 8px;
  border: transparent;
  background: transparent;
  color: #ef4444;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 16px;
}
.social-connected-danger-btn:hover {
  background: #27272a;
}
</style>
