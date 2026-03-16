import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  // Usamos hash history para que funcione como archivo local (dist/index.html)
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
        },
        // Grupos
        {
          path: 'groups',
          name: 'groups',
          component: () => import('@/pages/groups/GroupsPage.vue'),
        },
        // Alumnos
        {
          path: 'groups/:groupId/students',
          name: 'students',
          component: () => import('@/pages/students/StudentsPage.vue'),
          props: true,
        },
        {
          path: 'students/:studentId/grades',
          name: 'student.grades.detail',
          component: () => import('@/pages/students/StudentGradesDetailPage.vue'),
          props: true,
        },
        // Asistencia
        {
          path: 'attendance',
          name: 'attendance',
          component: () => import('@/pages/attendance/AttendancePage.vue'),
        },
        // Planeaciones
        {
          path: 'planning',
          name: 'planning',
          component: () => import('@/pages/planning/PlanningPage.vue'),
        },
        {
          path: 'attendance/:groupId/take',
          name: 'attendance.take',
          component: () => import('@/pages/attendance/TakeAttendancePage.vue'),
          props: true,
        },
        {
          path: 'attendance/report',
          name: 'attendance.report',
          component: () => import('@/pages/attendance/AttendanceReportPage.vue'),
        },
        // Conducta
        {
          path: 'behavior',
          name: 'behavior',
          component: () => import('@/pages/behavior/BehaviorGroupsPage.vue'),
        },
        {
          path: 'behavior/:groupId/track',
          name: 'behavior.track',
          component: () => import('@/pages/behavior/BehaviorTrackingPage.vue'),
          props: true,
        },
        // Incidentes
        {
          path: 'incidents',
          name: 'incidents',
          component: () => import('@/pages/incidents/IncidentsPage.vue'),
        },
        {
          path: 'incidents/create',
          name: 'incidents.create',
          component: () => import('@/pages/incidents/CreateIncidentPage.vue'),
        },
        // Evaluación
        {
          path: 'evaluation',
          name: 'evaluation',
          component: () => import('@/pages/evaluation/EvaluationPage.vue'),
        },
        {
          path: 'evaluation/:groupId/subjects',
          name: 'evaluation.subjects',
          component: () => import('@/pages/evaluation/SubjectsPage.vue'),
          props: true,
        },
        {
          path: 'evaluation/:groupId/subjects/:subjectId',
          name: 'evaluation.show',
          component: () => import('@/pages/evaluation/GradesPage.vue'),
          props: true,
        },
        // Equipos
        {
          path: 'teams',
          name: 'teams',
          component: () => import('@/pages/teams/TeamsPage.vue'),
        },
        // Actividades Intergrupales
        {
          path: 'intergroup-activities',
          name: 'intergroup-activities',
          component: () => import('@/pages/intergroup-activities/IntergroupActivitiesPage.vue'),
        },
        // Reportes
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/pages/reports/ReportsPage.vue'),
        },
        // Configuración
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/SettingsPage.vue'),
        },
        // Admin
        {
          path: 'admin',
          name: 'admin',
          component: () => import('@/pages/admin/AdminPage.vue'),
          meta: { requiresAdmin: true },
        },
        // Perfil
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/pages/ProfilePage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Guard de navegación
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Verificar cambios sin guardar
  // Importado dinámicamente para evitar ciclos
  const { useUnsavedStore } = await import('@/stores/unsaved')
  const unsavedStore = useUnsavedStore()

  if (unsavedStore.isDirty) {
    const confirmSave = window.confirm('¿Deseas guardar los cambios?')
    if (confirmSave) {
      if (typeof unsavedStore.save === 'function') {
        try {
          await unsavedStore.save()
        } catch (e) {
          // ignora y prosigue
        }
      }
    }
    // Si era Cancelar (false) solo limpia dirty y continúa; no hace save()
    unsavedStore.setDirty(false)
  }

  // Verificar sesión si no se ha cargado
  if (!authStore.checked) {
    await authStore.checkSession()
  }

  if (to.meta.requiresAuth === false) {
    // Rutas públicas: si ya está autenticado, redirigir al dashboard
    if (authStore.isAuthenticated) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
    return
  }

  // Rutas protegidas
  if (!authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Rutas solo para admin
  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
