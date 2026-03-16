<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const studentId = computed(() => Number(route.params.studentId))
const data = ref<any>(null)
const loading = ref(true)
const activePeriod = ref(1)
const activeSubjectId = ref<number | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await window.electronAPI.getStudentGradesDetail(studentId.value)
    if (data.value?.subjects?.length) {
      activeSubjectId.value = data.value.subjects[0].id
    }
  } catch (e) {
    console.error('Error cargando detalle del alumno:', e)
  }
  loading.value = false
})

const activeSubject = computed(() => {
  if (!data.value?.subjects) return null
  return data.value.subjects.find((s: any) => s.id === activeSubjectId.value) || data.value.subjects[0]
})

const activePeriodData = computed(() => {
  if (!activeSubject.value) return null
  return activeSubject.value.periods.find((p: any) => p.period === activePeriod.value)
})

function getScoreColor(score: number, min: number) {
  if (score >= min + 2) return '#10b981'
  if (score >= min) return '#f59e0b'
  return '#ef4444'
}

function getBar(score: number, max: number): number {
  return Math.min(100, Math.round((score / max) * 100))
}
</script>

<template>
  <div class="fade-in" style="max-width: 1100px; margin: 0 auto;">
    <!-- Header -->
    <div class="page-header" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="btn btn-ghost btn-sm" @click="router.go(-1)" style="padding: 6px 12px;">
          ← Regresar
        </button>
        <div>
          <h2 style="font-size: 1.4rem; margin: 0;">Expediente del Alumno</h2>
          <p class="text-muted" style="font-size: 12px; margin: 0;">
            Calificaciones registradas en base de datos
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty-state">
      <div class="spinner" style="width: 40px; height: 40px; border-width: 3px;"></div>
      <p style="margin-top: 12px;">Cargando expediente...</p>
    </div>

    <template v-else-if="data">
      <!-- Tarjeta de perfil del alumno -->
      <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--color-primary);">
        <div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">
          <!-- Avatar -->
          <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; flex-shrink: 0;">
            {{ data.student.paternal_surname?.[0] || '?' }}
          </div>

          <!-- Datos básicos -->
          <div style="flex: 1; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;">
              <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0;">{{ data.student.name }}</h3>
              <span
                class="badge"
                :style="{ backgroundColor: data.student.status_color || '#6b7280', color: '#fff', fontSize: '11px' }"
              >
                {{ data.student.status_name || 'Activo' }}
              </span>
            </div>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 8px;">
              <span class="text-muted" style="font-size: 13px;">
                📚 <strong>{{ data.student.group_grade }}°</strong> {{ data.student.group_name }}
              </span>
              <span class="text-muted" style="font-size: 13px;" v-if="data.student.group_cycle">
                📅 Ciclo: <strong>{{ data.student.group_cycle }}</strong>
              </span>
              <span class="text-muted" style="font-size: 13px;" v-if="data.student.group_shift">
                🕐 Turno: <strong>{{ data.student.group_shift }}</strong>
              </span>
              <span class="text-muted" style="font-size: 13px;" v-if="data.student.curp">
                🪪 CURP: <strong>{{ data.student.curp }}</strong>
              </span>
            </div>
          </div>

          <!-- Mini stats -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="background: var(--bg-elevated); border-radius: 10px; padding: 10px 16px; text-align: center; min-width: 80px;">
              <div style="font-size: 20px; font-weight: 800; color: var(--color-primary);">{{ data.attendance.pct }}%</div>
              <div class="text-muted" style="font-size: 10px; margin-top: 2px;">Asistencia</div>
            </div>
            <div style="background: var(--bg-elevated); border-radius: 10px; padding: 10px 16px; text-align: center; min-width: 80px;">
              <div style="font-size: 20px; font-weight: 800; color: #10b981;">{{ data.behavior.pct }}%</div>
              <div class="text-muted" style="font-size: 10px; margin-top: 2px;">Conducta</div>
            </div>
            <div style="background: var(--bg-elevated); border-radius: 10px; padding: 10px 16px; text-align: center; min-width: 80px;">
              <div style="font-size: 20px; font-weight: 800; color: var(--color-warning);">{{ data.attendance.absent }}</div>
              <div class="text-muted" style="font-size: 10px; margin-top: 2px;">Faltas</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de calificaciones por materia -->
      <div class="card" style="margin-bottom: 20px; padding: 0; overflow: hidden;">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--bg-elevated);">
          <h4 style="margin: 0; font-size: 14px; font-weight: 700;">📊 Resumen General por Materia</h4>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table" style="font-size: 13px;">
            <thead>
              <tr>
                <th>Materia</th>
                <th style="text-align: center; min-width: 80px;">T1</th>
                <th style="text-align: center; min-width: 80px;">T2</th>
                <th style="text-align: center; min-width: 80px;">T3</th>
                <th style="text-align: center; min-width: 90px; background: rgba(99,102,241,0.1); color: var(--color-primary);">General</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="subj in data.subjects"
                :key="subj.id"
                @click="activeSubjectId = subj.id; activePeriod = 1"
                style="cursor: pointer;"
                :style="activeSubjectId === subj.id ? { background: 'rgba(99,102,241,0.08)' } : {}"
              >
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div v-if="subj.color" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: subj.color, flexShrink: 0 }"></div>
                    <span style="font-weight: 600;">{{ subj.name }}</span>
                  </div>
                </td>
                <td style="text-align: center;">
                  <span
                    :style="{ color: getScoreColor(subj.periods[0]?.grade, data.grading_config.setting_min_pass), fontWeight: 700 }"
                  >
                    {{ subj.periods[0]?.grade?.toFixed(1) ?? '-' }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <span
                    :style="{ color: getScoreColor(subj.periods[1]?.grade, data.grading_config.setting_min_pass), fontWeight: 700 }"
                  >
                    {{ subj.periods[1]?.grade?.toFixed(1) ?? '-' }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <span
                    :style="{ color: getScoreColor(subj.periods[2]?.grade, data.grading_config.setting_min_pass), fontWeight: 700 }"
                  >
                    {{ subj.periods[2]?.grade?.toFixed(1) ?? '-' }}
                  </span>
                </td>
                <td style="text-align: center; background: rgba(99,102,241,0.05);">
                  <span
                    :style="{ color: getScoreColor(subj.general, data.grading_config.setting_min_pass), fontWeight: 800, fontSize: '15px' }"
                  >
                    {{ subj.general?.toFixed(1) ?? '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detalle por materia seleccionada -->
      <div v-if="activeSubject" class="card" style="padding: 0; overflow: hidden;">
        <!-- Encabezado materia + selector de periodo -->
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--bg-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 14px; font-weight: 700;">
              📋 Detalle — {{ activeSubject.name }}
            </h4>
            <p class="text-muted" style="font-size: 11px; margin: 2px 0 0;">
              Haz clic en una materia arriba para cambiar
            </p>
          </div>
          <!-- Tabs de trimestre -->
          <div style="display: flex; gap: 6px;">
            <button
              v-for="p in [1,2,3]"
              :key="p"
              class="btn btn-sm"
              :class="activePeriod === p ? 'btn-primary' : 'btn-ghost'"
              @click="activePeriod = p"
            >
              T{{ p }}
            </button>
          </div>
        </div>

        <div style="padding: 18px;">
          <!-- Sin rúbricas -->
          <div v-if="!activePeriodData?.rubrics?.length" class="empty-state" style="padding: 32px;">
            <div class="empty-state-icon">📭</div>
            <p>Sin actividades registradas en este trimestre.</p>
          </div>

          <!-- Rúbricas -->
          <div v-else style="display: flex; flex-direction: column; gap: 20px;">
            <div
              v-for="rubric in activePeriodData.rubrics"
              :key="rubric.id"
              style="border: 1px solid var(--border); border-radius: 10px; overflow: hidden;"
            >
              <!-- Header rúbrica -->
              <div
                style="padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); border-bottom: 1px solid var(--border);"
              >
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span
                    v-if="rubric.is_extra"
                    style="background: var(--color-primary); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700;"
                  >
                    EXTRA
                  </span>
                  <span style="font-weight: 700; font-size: 14px;">{{ rubric.name }}</span>
                  <span class="text-muted" style="font-size: 11px;" v-if="!rubric.is_extra">({{ rubric.percentage }}%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="text-align: right;">
                    <div class="text-muted" style="font-size: 10px;">Promedio</div>
                    <div style="font-weight: 800; font-size: 16px;"
                      :style="{ color: getScoreColor(rubric.avg, data.grading_config.setting_min_pass) }"
                    >
                      {{ rubric.avg.toFixed(1) }}
                    </div>
                  </div>
                  <div style="text-align: right;" v-if="!rubric.is_extra">
                    <div class="text-muted" style="font-size: 10px;">Puntos</div>
                    <div style="font-weight: 800; font-size: 16px; color: var(--color-warning);">
                      {{ rubric.puntaje.toFixed(1) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actividades -->
              <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;">
                <div
                  v-for="act in rubric.activities"
                  :key="act.id"
                  style="display: flex; align-items: center; gap: 12px;"
                >
                  <!-- Nombre actividad -->
                  <div style="flex: 1; font-size: 13px; color: var(--text-secondary); min-width: 120px;">
                    {{ act.name }}
                  </div>
                  <!-- Barra de progreso -->
                  <div style="flex: 2; height: 8px; background: var(--bg-elevated); border-radius: 4px; overflow: hidden; min-width: 80px;">
                    <div
                      :style="{
                        width: getBar(act.score, data.grading_config.setting_max_score) + '%',
                        height: '100%',
                        borderRadius: '4px',
                        background: getScoreColor(act.score, data.grading_config.setting_min_pass),
                        transition: 'width 0.4s ease'
                      }"
                    ></div>
                  </div>
                  <!-- Score -->
                  <div
                    style="width: 36px; text-align: right; font-weight: 700; font-size: 14px;"
                    :style="{ color: getScoreColor(act.score, data.grading_config.setting_min_pass) }"
                  >
                    {{ act.score.toFixed(1) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Total del trimestre -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px; padding: 12px 16px; background: var(--bg-elevated); border-radius: 10px; border: 1px solid var(--border);">
              <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">
                Calificación Trimestre {{ activePeriod }}:
              </span>
              <span
                style="font-size: 28px; font-weight: 900;"
                :style="{ color: getScoreColor(activePeriodData.grade, data.grading_config.setting_min_pass) }"
              >
                {{ activePeriodData.grade.toFixed(1) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Sin datos -->
    <div v-else class="empty-state">
      <div class="empty-state-icon">❌</div>
      <p>No se encontró información de este alumno.</p>
      <button class="btn btn-primary" @click="router.go(-1)">← Regresar</button>
    </div>
  </div>
</template>

<style scoped>
.data-table tbody tr:hover {
  background: rgba(99, 102, 241, 0.06);
}
</style>
