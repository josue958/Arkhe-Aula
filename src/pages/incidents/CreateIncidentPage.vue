<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

const today = new Date().toISOString().slice(0, 10)
const nowStr = new Date().toTimeString().slice(0, 5)

const form = ref({
  incident_date: today,
  school_name: '',
  teacher_name: authStore.user?.name || '',
  group_id: null as number | null,
  student_id: null as number | null,
  incident_type_id: null as number | null,
  description: '',
  notified_authorities: {
    director: false,
    subdirector: false,
    coordinador: false,
    prefecto: false,
    trabajo_social: false
  },
  tutor_contacted: false,
  contact_method: '',
  contact_datetime: `${today}T${nowStr}`
})

const groups = ref<any[]>([])
const students = ref<any[]>([])
const incidentTypes = ref<any[]>([])

onMounted(async () => {
  try {
    const school = await window.electronAPI.getSchool()
    if (school) form.value.school_name = school.name
    groups.value = await window.electronAPI.getGroups({})
    incidentTypes.value = await window.electronAPI.getIncidentTypes()
  } catch (err) {
    console.error(err)
    toast.error('Error cargando catálogos iniciales')
  }
})

async function onGroupChange() {
  form.value.student_id = null
  if (form.value.group_id) {
    try {
      students.value = await window.electronAPI.getStudents(form.value.group_id)
    } catch (e) {
      toast.error('Error al cargar alumnos')
    }
  } else {
    students.value = []
  }
}

async function saveIncident() {
  if (!form.value.student_id || !form.value.incident_type_id || !form.value.incident_date) {
    toast.error('Por favor completa los campos requeridos (Alumno, Tipo y Fecha)')
    return
  }

  try {
    const res = await window.electronAPI.createIncident({
      ...form.value
    })
    
    if (res.success) {
      toast.success('Incidente creado correctamente')
      router.push('/incidents')
    } else {
      toast.error(res.message || 'Error al guardar el incidente')
    }
  } catch (err) {
    console.error(err)
    toast.error('Error al guardar el incidente')
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Crear Incidente</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">Registrar un nuevo incidente disciplinario</p>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" @click="router.push('/incidents')">Cancelar</button>
        <button class="btn btn-primary" @click="saveIncident">💾 Guardar Incidente</button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 class="card-title">Datos Generales</h3>
      <div class="grid-3" style="gap: 16px;">
        <div class="form-group">
          <label class="form-label">Fecha del Incidente *</label>
          <input type="date" v-model="form.incident_date" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">Nombre de Escuela</label>
          <input type="text" v-model="form.school_name" class="form-input" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Docente</label>
          <input type="text" v-model="form.teacher_name" class="form-input" disabled />
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 class="card-title">Alumno Involucrado</h3>
      <div class="grid-2" style="gap: 16px;">
        <div class="form-group">
          <label class="form-label">Seleccione el Grupo *</label>
          <select v-model="form.group_id" @change="onGroupChange" class="form-select" required>
            <option :value="null">Seleccionar Grupo</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">
              {{ g.grade }}° {{ g.name }} ({{ g.cycle }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Seleccione al Alumno *</label>
          <select v-model="form.student_id" class="form-select" :disabled="!form.group_id" required>
            <option :value="null">Seleccionar Alumno</option>
            <option v-for="s in students" :key="s.id" :value="s.id">
              {{ s.paternal_surname }} {{ s.maternal_surname }} {{ s.first_name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 class="card-title">Detalle del Incidente</h3>
      <div class="form-group mb-4">
        <label class="form-label">Tipo de Incidente *</label>
        <select v-model="form.incident_type_id" class="form-select" required>
          <option :value="null">Seleccionar Tipo</option>
          <option v-for="t in incidentTypes" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Redacción del Incidente</label>
        <textarea v-model="form.description" class="form-input" rows="4" placeholder="Describe lo que sucedió..." style="resize: vertical;"></textarea>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 class="card-title">Notificaciones y Contacto</h3>
      <div class="grid-2" style="gap: 24px;">
        <div>
          <label class="form-label" style="margin-bottom: 12px; display: block;">Autoridades Notificadas</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" v-model="form.notified_authorities.director" /> Director</label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" v-model="form.notified_authorities.subdirector" /> Subdirector</label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" v-model="form.notified_authorities.coordinador" /> Coordinador</label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" v-model="form.notified_authorities.prefecto" /> Prefecto</label>
            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" v-model="form.notified_authorities.trabajo_social" /> Trabajo Social</label>
          </div>
        </div>

        <div>
          <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <input type="checkbox" v-model="form.tutor_contacted" /> 
            <strong>Se contactó al Tutor</strong>
          </label>
          
          <div v-if="form.tutor_contacted" class="fade-in">
            <div class="form-group mb-4">
              <label class="form-label">Medio de Contacto</label>
              <select v-model="form.contact_method" class="form-select">
                <option value="">Seleccionar...</option>
                <option value="Llamada P.F.">Llamada a Padre de Familia</option>
                <option value="Cita Escolar">Cita en la Escuela</option>
                <option value="Recado Escrito">Recado Escrito</option>
                <option value="Mensaje">Mensaje (WhatsApp/SMS)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha y Hora de Contacto</label>
              <input type="datetime-local" v-model="form.contact_datetime" class="form-input" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón guardar al final -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
      <button class="btn btn-primary" style="padding: 12px 24px; font-size: 16px;" @click="saveIncident">
        💾 Guardar Incidente
      </button>
    </div>
  </div>
</template>
