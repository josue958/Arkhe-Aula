<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { useUnsavedStore } from '@/stores/unsaved'

const props = defineProps<{ groupId: string }>()
const router = useRouter()
const toast = useToastStore()

const date = ref(new Date().toISOString().slice(0, 10))
const students = ref<any[]>([])
const group = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)
const unsavedStore = useUnsavedStore()

// Estado de asistencia para cada alumno
const attendanceMap = ref<Record<number, 'present' | 'absent' | 'late'>>({})

onMounted(async () => {
  group.value = await window.electronAPI.getGroup(Number(props.groupId))
  await loadAttendance()
})

watch(date, async () => {
  await loadAttendance()
})

async function loadAttendance() {
  loading.value = true
  try {
    const studentsData = await window.electronAPI.getAttendanceForDate(Number(props.groupId), date.value)
    students.value = studentsData
    // Inicializar mapa
    const map: Record<number, 'present' | 'absent' | 'late'> = {}
    studentsData.forEach((s: any) => {
      map[s.id] = s.attendance_status || 'present'
    })
    attendanceMap.value = map
    hasChanges.value = false
    unsavedStore.setDirty(false)
  } catch (e) {
    toast.error('Error al cargar la asistencia.')
  }
  loading.value = false
}

function setStatus(studentId: number, status: 'present' | 'absent' | 'late') {
  attendanceMap.value[studentId] = status
}

watch(attendanceMap, () => {
  hasChanges.value = true
  unsavedStore.setDirty(true)
}, { deep: true })

function markAll(status: 'present' | 'absent') {
  students.value.forEach(s => {
    attendanceMap.value[s.id] = status
  })
}

async function saveAttendance() {
  saving.value = true
  try {
    const attendances = students.value.map(s => ({
      student_id: s.id,
      status: attendanceMap.value[s.id] || 'present',
    }))

    await window.electronAPI.saveAttendance({
      group_id: Number(props.groupId),
      date: date.value,
      attendances,
    })

    toast.success('Asistencia guardada correctamente.')
    hasChanges.value = false
    unsavedStore.setDirty(false)
  } catch (e) {
    toast.error('Error al guardar la asistencia.')
  }
  saving.value = false
}

async function deleteAttendance() {
  if (!confirm('¿Estás seguro de que deseas eliminar este pase de lista? Se borrarán todos los registros de este grupo en la fecha seleccionada.')) return;
  saving.value = true;
  try {
    const res = await window.electronAPI.deleteAttendanceForDate(Number(props.groupId), date.value);
    if (res && res.success) {
      toast.success('Pase de lista eliminado correctamente.');
      await loadAttendance();
    } else {
      toast.error('Error al eliminar: ' + (res?.message || ''));
    }
  } catch (e) {
    toast.error('Error al eliminar el pase de lista.');
  }
  saving.value = false;
}

const presentCount = () => Object.values(attendanceMap.value).filter(s => s === 'present').length
const absentCount = () => Object.values(attendanceMap.value).filter(s => s === 'absent').length
const lateCount = () => Object.values(attendanceMap.value).filter(s => s === 'late').length
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Tomar Asistencia</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;" v-if="group">
          {{ group.grade }}° {{ group.name }} • {{ group.cycle }}
        </p>
      </div>
      <div class="actions">
        <input v-model="date" type="date" class="form-input" style="width: 170px;" />
        <button class="btn btn-secondary" @click="router.push('/attendance')">← Volver</button>
        <button class="btn btn-primary" @click="saveAttendance" :disabled="saving || !hasChanges">
          <span v-if="saving" class="spinner"></span>
          <span v-else>💾 Guardar</span>
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="flex gap-4" style="margin-bottom: 20px;">
      <div class="summary-badge badge-success">✓ Presentes: {{ presentCount() }}</div>
      <div class="summary-badge badge-danger">✕ Ausentes: {{ absentCount() }}</div>
      <div class="summary-badge badge-warning">⏱ Retardos: {{ lateCount() }}</div>
      <div class="flex gap-2" style="margin-left: auto;">
        <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteAttendance">🗑 Eliminar este pase</button>
        <button class="btn btn-secondary btn-sm" @click="markAll('present')">Marcar todos presentes</button>
        <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="markAll('absent')">Marcar todos ausentes</button>
      </div>
    </div>

    <!-- Tabla de asistencia -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div v-if="loading" class="empty-state">
        <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
      </div>

      <table v-else-if="students.length > 0" class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Apellido Paterno</th>
            <th>Apellido Materno</th>
            <th>Nombre(s)</th>
            <th>Estatus Alumno</th>
            <th style="text-align: center; width: 300px;">Asistencia</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, idx) in students"
            :key="student.id"
            :class="{
              'row-absent': attendanceMap[student.id] === 'absent',
              'row-late': attendanceMap[student.id] === 'late',
              'row-present': attendanceMap[student.id] === 'present',
            }"
          >
            <td class="text-muted">{{ idx + 1 }}</td>
            <td style="font-weight: 500;">{{ student.paternal_surname }}</td>
            <td>{{ student.maternal_surname }}</td>
            <td>{{ student.first_name }}</td>
            <td>
              <span class="status-badge" :style="{ background: (student.status_color || '#6b7280') + '33', color: student.status_color || '#6b7280' }">
                {{ student.status_name }}
              </span>
            </td>
            <td>
              <div class="att-buttons">
                <button
                  class="att-btn"
                  :class="{ 'active-present': attendanceMap[student.id] === 'present' }"
                  @click="setStatus(student.id, 'present')"
                >
                  ✓ Presente
                </button>
                <button
                  class="att-btn"
                  :class="{ 'active-late': attendanceMap[student.id] === 'late' }"
                  @click="setStatus(student.id, 'late')"
                >
                  ⏱ Retardo
                </button>
                <button
                  class="att-btn"
                  :class="{ 'active-absent': attendanceMap[student.id] === 'absent' }"
                  @click="setStatus(student.id, 'absent')"
                >
                  ✕ Ausente
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <div class="empty-state-icon">👨‍🎓</div>
        <h3>No hay alumnos en este grupo</h3>
        <p>Agrega alumnos primero desde la sección de Grupos.</p>
      </div>
    </div>

    <!-- Botón guardar al final -->
    <div style="margin-top: 24px; display: flex; justify-content: flex-end; padding-bottom: 24px;">
      <button class="btn btn-primary" style="padding: 16px 28px; font-size: 16px; box-shadow: var(--shadow-lg);" @click="saveAttendance" :disabled="saving || !hasChanges">
        <span v-if="saving" class="spinner"></span>
        <span v-else>💾 Guardar Asistencia</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.summary-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.att-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.att-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  user-select: none;
  background: var(--bg-surface);
  color: var(--text-secondary);
}

.att-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.att-btn.active-present {
  background: rgba(34,197,94,0.15);
  color: #4ade80;
}

.att-btn.active-late {
  background: rgba(245,158,11,0.15);
  color: #fbbf24;
}

.att-btn.active-absent {
  background: rgba(239,68,68,0.15);
  color: #f87171;
}

.row-absent td { background: rgba(239,68,68,0.04); }
.row-late td { background: rgba(245,158,11,0.04); }
.row-present td { background: rgba(34,197,94,0.02); }
</style>
