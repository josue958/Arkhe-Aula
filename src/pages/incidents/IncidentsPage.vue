<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast = useToastStore()
const incidents = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadIncidents()
})

async function loadIncidents() {
  loading.value = true
  try {
    incidents.value = await window.electronAPI.getIncidents()
  } catch (err) {
    toast.error('Error al cargar incidentes')
    console.error(err)
  }
  loading.value = false
}

function goToCreate() {
  router.push('/incidents/create')
}

async function exportIncident(incident: any) {
  // Lógica para exportar el incidente
  toast.success('Función de exportar incidente en desarrollo.')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Incidentes</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">Historial de reportes e incidentes</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="goToCreate">➕ Nuevo Incidente</button>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow-x: auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha del Incidente</th>
            <th>Grado</th>
            <th>Grupo</th>
            <th>Nombre del Alumno</th>
            <th>Resumen Incidente</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" style="text-align: center; padding: 24px;">Cargando incidentes...</td>
          </tr>
          <tr v-else-if="incidents.length === 0">
            <td colspan="6" style="text-align: center; padding: 24px;" class="text-muted">No hay incidentes registrados.</td>
          </tr>
          <tr v-for="inc in incidents" :key="inc.id" v-else>
            <td>{{ inc.incident_date }}</td>
            <td>{{ inc.grade }}°</td>
            <td>{{ inc.group_name }}</td>
            <td style="font-weight: 500;">{{ inc.paternal_surname }} {{ inc.maternal_surname }} {{ inc.first_name }}</td>
            <td>{{ inc.description }}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" @click="exportIncident(inc)">📄 Exportar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
