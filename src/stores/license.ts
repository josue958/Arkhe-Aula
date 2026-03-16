import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface License {
  id: number
  plan_type: 'free' | 'basic' | 'premium' | 'enterprise'
  max_groups: number
  max_students: number
  has_reports: number
  has_advanced_evaluation: number
  has_cloud_sync: number
  has_support: number
}

export const useLicenseStore = defineStore('license', () => {
  const license = ref<License | null>(null)
  const groupsCount = ref(0)
  const studentsCount = ref(0)
  const loaded = ref(false)

  const isFree = computed(() => license.value?.plan_type === 'free')
  const isBasic = computed(() => license.value?.plan_type === 'basic')
  const isPremium = computed(() => license.value?.plan_type === 'premium' || license.value?.plan_type === 'enterprise')

  const canAddGroup = computed(() => {
    if (!license.value) return true
    return groupsCount.value < license.value.max_groups
  })

  const canAddStudent = computed(() => {
    if (!license.value) return true
    return studentsCount.value < license.value.max_students
  })

  const groupsRemaining = computed(() => {
    if (!license.value) return 999
    return Math.max(0, license.value.max_groups - groupsCount.value)
  })

  const studentsRemaining = computed(() => {
    if (!license.value) return 999
    return Math.max(0, license.value.max_students - studentsCount.value)
  })

  const hasReports = computed(() => !!license.value?.has_reports)
  const hasAdvancedEvaluation = computed(() => !!license.value?.has_advanced_evaluation)
  const hasCloudSync = computed(() => !!license.value?.has_cloud_sync)
  const hasSupport = computed(() => !!license.value?.has_support)

  const planName = computed(() => {
    switch (license.value?.plan_type) {
      case 'free': return 'Arkhe Aula Free'
      case 'basic': return 'Arkhe Aula Básico'
      case 'premium': return 'Arkhe Aula Premium'
      case 'enterprise': return 'Arkhe Aula Enterprise'
      default: return 'Arkhe Aula'
    }
  })

  async function loadLicense() {
    try {
      license.value = await window.electronAPI.getLicense()
      loaded.value = true
    } catch (e) {
      console.error('Error loading license:', e)
    }
  }

  async function loadCounts() {
    try {
      const groups = await window.electronAPI.getGroups({})
      const students = await window.electronAPI.getStudents()
      groupsCount.value = groups.filter((g: any) => !g.archived_at).length
      studentsCount.value = students.filter((s: any) => !s.dropped_at).length
    } catch (e) {
      console.error('Error loading counts:', e)
    }
  }

  async function checkLimit(type: 'groups' | 'students'): Promise<{ allowed: boolean; limit?: number; message?: string }> {
    if (!license.value) return { allowed: true }

    if (type === 'groups') {
      if (groupsCount.value >= license.value.max_groups) {
        return { 
          allowed: false, 
          limit: license.value.max_groups,
          message: `Has alcanzado el límite de ${license.value.max_groups} grupos. ¡Actualiza tu plan para crear más!`
        }
      }
    } else if (type === 'students') {
      if (studentsCount.value >= license.value.max_students) {
        return { 
          allowed: false, 
          limit: license.value.max_students,
          message: `Has alcanzado el límite de ${license.value.max_students} alumnos. ¡Actualiza tu plan para agregar más!`
        }
      }
    }
    return { allowed: true }
  }

  return {
    license,
    groupsCount,
    studentsCount,
    loaded,
    isFree,
    isBasic,
    isPremium,
    canAddGroup,
    canAddStudent,
    groupsRemaining,
    studentsRemaining,
    hasReports,
    hasAdvancedEvaluation,
    hasCloudSync,
    hasSupport,
    planName,
    loadLicense,
    loadCounts,
    checkLimit
  }
})