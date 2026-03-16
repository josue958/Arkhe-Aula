const { contextBridge, ipcRenderer } = require('electron');

// ───────────────────────────────────────────────
// API segura expuesta al renderer (Vue)
// NUNCA exponer ipcRenderer directamente
// ───────────────────────────────────────────────


contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),

  // Diálogos del sistema
  openFileDialog: (options) => ipcRenderer.invoke('dialog-open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog-save-file', options),
  copyFile: (src, dest) => ipcRenderer.invoke('copy-file', { src, dest }),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // Escuchar eventos del menú
  onMenuEvent: (callback) => {
    const events = ['menu-new-group', 'menu-attendance', 'menu-grades', 'show-about', 'export-database', 'import-database', 'tablet-connected'];
    events.forEach(event => {
      ipcRenderer.on(event, (_, ...args) => callback(event, ...args));
    });
  },
  removeAllListeners: (event) => ipcRenderer.removeAllListeners(event),

  // ── AUTENTICACIÓN ──────────────────────────
  login: (data) => ipcRenderer.invoke('auth-login', data),
  logout: () => ipcRenderer.invoke('auth-logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth-current-user'),
  changePassword: (data) => ipcRenderer.invoke('auth-change-password', data),
  resetPassword: (data) => ipcRenderer.invoke('auth-reset-password', data),
  createUser: (data) => ipcRenderer.invoke('auth-create-user', data),
  getUsers: () => ipcRenderer.invoke('auth-get-users'),
  updateUser: (id, data) => ipcRenderer.invoke('auth-update-user', { id, data }),
  deleteUser: (id) => ipcRenderer.invoke('auth-delete-user', id),
  openAdminReadme: () => ipcRenderer.invoke('auth-open-admin-readme'),

  // ── ESCUELA ────────────────────────────────
  getSchool: () => ipcRenderer.invoke('school-get'),
  saveSchool: (data) => ipcRenderer.invoke('school-save', data),

  // ── LICENCIAS Y SUSCRIPCIONES ─────────────
  getLicense: () => ipcRenderer.invoke('license-get'),
  getLicenseLimits: () => ipcRenderer.invoke('license-get-limits'),
  checkLicenseLimits: (type, currentCount) => ipcRenderer.invoke('license-check-limits', { type, currentCount }),
  activateLicense: (licenseKey, planType) => ipcRenderer.invoke('license-activate', { licenseKey, planType }),

  // ── CICLOS ESCOLARES ──────────────────────
  getCycles: () => ipcRenderer.invoke('cycles-get-all'),
  createCycle: (data) => ipcRenderer.invoke('cycles-create', data),
  updateCycle: (id, data) => ipcRenderer.invoke('cycles-update', { id, data }),
  deleteCycle: (id) => ipcRenderer.invoke('cycles-delete', id),

  // ── GRUPOS ────────────────────────────────
  getGroups: (filters) => ipcRenderer.invoke('groups-get-all', filters),
  getGroup: (id) => ipcRenderer.invoke('groups-get-one', id),
  createGroup: (data) => ipcRenderer.invoke('groups-create', data),
  updateGroup: (id, data) => ipcRenderer.invoke('groups-update', { id, data }),
  deleteGroup: (id) => ipcRenderer.invoke('groups-delete', id),
  archiveGroup: (id) => ipcRenderer.invoke('groups-archive', id),
  restoreGroup: (id) => ipcRenderer.invoke('groups-restore', id),
  migrateGroup: (id, data) => ipcRenderer.invoke('groups-migrate', { id, data }),

  // ── PERÍODOS DE GRUPO ─────────────────────
  getGroupPeriods: (groupId) => ipcRenderer.invoke('group-periods-get', groupId),
  saveGroupPeriod: (data) => ipcRenderer.invoke('group-periods-save', data),
  deleteGroupPeriod: (id) => ipcRenderer.invoke('group-periods-delete', id),

  // ── ALUMNOS ───────────────────────────────
  getStudents: (groupId) => ipcRenderer.invoke('students-get-all', groupId),
  getStudent: (id) => ipcRenderer.invoke('students-get-one', id),
  createStudent: (data) => ipcRenderer.invoke('students-create', data),
  updateStudent: (id, data) => ipcRenderer.invoke('students-update', { id, data }),
  deleteStudent: (id) => ipcRenderer.invoke('students-delete', id),
  bulkDeleteStudents: (ids) => ipcRenderer.invoke('students-bulk-delete', ids),
  bulkUpdateStudentStatus: (ids, statusId) => ipcRenderer.invoke('students-bulk-status', { ids, statusId }),
  bulkUpdateStudentEnrolledAt: (ids, enrolled_at) => ipcRenderer.invoke('students-bulk-enrolled_at', { ids, enrolled_at }),
  importStudentsFromExcel: (data) => ipcRenderer.invoke('students-import', data),

  // ── ESTATUS DE ALUMNOS ─────────────────────
  getStatuses: () => ipcRenderer.invoke('statuses-get-all'),
  createStatus: (data) => ipcRenderer.invoke('statuses-create', data),
  updateStatus: (id, data) => ipcRenderer.invoke('statuses-update', { id, data }),
  deleteStatus: (id) => ipcRenderer.invoke('statuses-delete', id),

  // ── MATERIAS ──────────────────────────────
  getSubjectTemplates: () => ipcRenderer.invoke('subject-templates-get'),
  createSubjectTemplate: (data) => ipcRenderer.invoke('subject-templates-create', data),
  updateSubjectTemplate: (id, data) => ipcRenderer.invoke('subject-templates-update', { id, data }),
  deleteSubjectTemplate: (id) => ipcRenderer.invoke('subject-templates-delete', id),
  assignSubjectTemplate: (groupId, templateId) => ipcRenderer.invoke('subject-templates-assign', { groupId, templateId }),

  // ── EVALUACIÓN ────────────────────────────
  getEvaluationData: (groupId, subjectId) => ipcRenderer.invoke('evaluation-get-data', { groupId, subjectId }),
  getGroupSubjects: (groupId) => ipcRenderer.invoke('evaluation-get-subjects', groupId),
  saveGrades: (data) => ipcRenderer.invoke('evaluation-save-grades', data),
  saveGradesSettings: (data) => ipcRenderer.invoke('evaluation-save-settings', data),
  createRubric: (data) => ipcRenderer.invoke('evaluation-create-rubric', data),
  updateRubric: (id, data) => ipcRenderer.invoke('evaluation-update-rubric', { id, data }),
  updateRubricFull: (payload) => ipcRenderer.invoke('evaluation-update-rubric-full', payload),
  deleteRubric: (id) => ipcRenderer.invoke('evaluation-delete-rubric', id),
  createActivity: (data) => ipcRenderer.invoke('evaluation-create-activity', data),
  updateActivity: (id, data) => ipcRenderer.invoke('evaluation-update-activity', { id, data }),
  updateActivityFull: (payload) => ipcRenderer.invoke('evaluation-update-activity-full', payload),
  deleteActivity: (id) => ipcRenderer.invoke('evaluation-delete-activity', id),
  moveRubric: (payload) => ipcRenderer.invoke('evaluation-move-rubric', payload),
  moveActivity: (payload) => ipcRenderer.invoke('evaluation-move-activity', payload),
  exportEvaluation: (groupId, subjectId) => ipcRenderer.invoke('evaluation-export', { groupId, subjectId }),

  // ── PLANTILLAS DE EVALUACIÓN ──────────────
  getEvaluationTemplates: () => ipcRenderer.invoke('eval-templates-get'),
  createEvaluationTemplate: (data) => ipcRenderer.invoke('eval-templates-create', data),
  updateEvaluationTemplate: (id, data) => ipcRenderer.invoke('eval-templates-update', { id, data }),
  deleteEvaluationTemplate: (id) => ipcRenderer.invoke('eval-templates-delete', id),
  assignEvaluationTemplate: (groupId, templateId) => ipcRenderer.invoke('eval-templates-assign', { groupId, templateId }),

  // ── ASISTENCIA ────────────────────────────
  getAttendanceGroups: () => ipcRenderer.invoke('attendance-get-groups'),
  getAttendanceForDate: (groupId, date) => ipcRenderer.invoke('attendance-get-for-date', { groupId, date }),
  saveAttendance: (data) => ipcRenderer.invoke('attendance-save', data),
  deleteAttendanceForDate: (groupId, date) => ipcRenderer.invoke('delete-attendance-for-date', { groupId, date }),
  getAttendanceReport: (filters) => ipcRenderer.invoke('attendance-report', filters),
  exportAttendanceReport: (data) => ipcRenderer.invoke('attendance-export', data),
  updateAttendance: (id, data) => ipcRenderer.invoke('attendance-update', { id, data }),

  // ── REPORTES ──────────────────────────────
  getReportData: (filters) => ipcRenderer.invoke('reports-get-data', filters),
  getStatistics: (filters) => ipcRenderer.invoke('reports-statistics', filters),
  exportReport: (data) => ipcRenderer.invoke('reports-export', data),
  getEvaluationStatistics: (filters) => ipcRenderer.invoke('reports-eval-stats', filters),
  getReportsData: (groupId, filters) => ipcRenderer.invoke('reports-get-evaluation', { groupId, filters }),
  getAttendanceReportData: (groupId, filters) => ipcRenderer.invoke('reports-get-attendance', { groupId, filters }),
  getReportsAttendanceAlerts: (data) => ipcRenderer.invoke('reports-attendance-alerts', data),
  getReportsFailingStudents: (data) => ipcRenderer.invoke('reports-failing-students', data),

  // ── SETTINGS TABS ─────────────────────────
  getTrimesters: (cycleId) => ipcRenderer.invoke('settings-get-trimesters', cycleId),
  saveTrimesters: (data) => ipcRenderer.invoke('settings-save-trimesters', data),
  getSettingsEvaluationElements: () => ipcRenderer.invoke('settings-get-rubrics'),
  getSettingsActivities: () => ipcRenderer.invoke('settings-get-activities'),
  getSettingsSubjectsForGroup: (groupId) => ipcRenderer.invoke('settings-get-subjects-for-group', groupId),
  getSettingsRubricsForSubject: (data) => ipcRenderer.invoke('settings-get-rubrics-for-subject', data),

  // ── CONFIGURACIÓN ─────────────────────────
  getIndicators: () => ipcRenderer.invoke('config-get-indicators'),
  updateIndicators: (data) => ipcRenderer.invoke('config-update-indicators', data),
  getGradingConfig: () => ipcRenderer.invoke('config-get-grading'),
  updateGradingConfig: (data) => ipcRenderer.invoke('config-update-grading', data),

  // ── BASE DE DATOS ─────────────────────────
  exportDatabase: (destPath) => ipcRenderer.invoke('db-export', destPath),
  importDatabase: (srcPath) => ipcRenderer.invoke('db-import', srcPath),
  getDatabaseInfo: () => ipcRenderer.invoke('db-info'),
  changeDatabasePath: (newPath) => ipcRenderer.invoke('db-change-path', newPath),
  resetDatabasePath: () => ipcRenderer.invoke('db-reset-path'),
  // Vista de la Base (Admin Explorer)
  dbExplorerTables: () => ipcRenderer.invoke('db-explorer-tables'),
  dbExplorerColumns: (tableName) => ipcRenderer.invoke('db-explorer-columns', tableName),
  dbExplorerRecords: (data) => ipcRenderer.invoke('db-explorer-records', data),

  // ── PERFIL DE USUARIO ─────────────────────
  exportUserProfile: (destPath) => ipcRenderer.invoke('profile-export', { destPath }),
  importUserProfile: (srcPath) => ipcRenderer.invoke('profile-import', { srcPath }),

  // ── DASHBOARD ───────────────────────────────
  dashboardStudentSearch: (query) => ipcRenderer.invoke('dashboard-student-search', query),
  getStudentGradesDetail: (studentId) => ipcRenderer.invoke('student-grades-detail', studentId),

  // ── EQUIPOS ───────────────────────────────
  getAllConfiguredTeams: () => ipcRenderer.invoke('teams-get-all-configured'),
  getTeamsByActivity: (data) => ipcRenderer.invoke('teams-get-by-activity', data),
  saveTeams: (data) => ipcRenderer.invoke('teams-save', data),
  deleteTeamsByActivity: (data) => ipcRenderer.invoke('teams-delete-by-activity', data),

  // ── ACTIVIDADES INTERGRUPALES ─────────────────────
  getAllIntergroupActivities: () => ipcRenderer.invoke('intergroup-get-all'),
  getIntergroupTeamsByActivity: (data) => ipcRenderer.invoke('intergroup-get-by-activity', data),
  saveIntergroupTeams: (data) => ipcRenderer.invoke('intergroup-save', data),
  deleteIntergroupTeamsByActivity: (data) => ipcRenderer.invoke('intergroup-delete-by-activity', data),
  getStudentsByGroup: (groupId) => ipcRenderer.invoke('students-get-by-group', groupId),

  // ── SEGUIMIENTO DE PAD ─────────────────────
  savePda: (data) => ipcRenderer.invoke('pda-save', data),
  getPdas: () => ipcRenderer.invoke('pda-get-all'),
  deletePda: (id) => ipcRenderer.invoke('pda-delete', id),

  // ── SEGUIMIENTO DE CONDUCTA ────────────────
  getBehaviorRecords: (groupId, date) => ipcRenderer.invoke('behavior-records-get', { groupId, date }),
  saveBehaviorRecords: (groupId, date, records) => ipcRenderer.invoke('behavior-records-save', { groupId, date, records }),
  getBehaviorReport: (groupId, trimester) => ipcRenderer.invoke('behavior-report-get', { groupId, trimester }),

  // ── INCIDENTES ────────────────────────────
  getIncidents: () => ipcRenderer.invoke('incidents-get-all'),
  getIncidentTypes: () => ipcRenderer.invoke('incidents-get-types'),
  createIncidentType: (data) => ipcRenderer.invoke('incidents-create-type', data),
  updateIncidentType: (id, data) => ipcRenderer.invoke('incidents-update-type', id, data),
  deleteIncidentType: (id) => ipcRenderer.invoke('incidents-delete-type', id),
  createIncident: (data) => ipcRenderer.invoke('incidents-create', data),

  // ── CIERRE DE APP ──────────────────────────
  onAppClosing: (callback) => ipcRenderer.on('app-closing', callback),
  forceQuit: () => ipcRenderer.invoke('force-quit'),

  // ── MÚLTIPLE DISPOSITIVO (SYNC) ─────────────────
  syncSetProvider: (data) => ipcRenderer.invoke('sync-set-provider', data),
  syncPush: (data) => ipcRenderer.invoke('sync-push', data),
  syncPull: () => ipcRenderer.invoke('sync-pull'),
  syncBackupDb: () => ipcRenderer.invoke('sync-backup-db'),

  // ── ACTUALIZACIONES ──────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('updater-check'),
  downloadUpdate: () => ipcRenderer.invoke('updater-download'),
  installUpdate: () => ipcRenderer.invoke('updater-install'),
  getUpdaterStatus: () => ipcRenderer.invoke('updater-status'),
  onUpdaterEvent: (callback) => ipcRenderer.on('updater-event', (_, data) => callback(data)),
  removeUpdaterListeners: () => ipcRenderer.removeAllListeners('updater-event'),
  
  // ── ACTUALIZACIONES AUTOMÁTICAS ─────────────
  getAutoUpdateConfig: () => ipcRenderer.invoke('auto-update-get-config'),
  saveAutoUpdateConfig: (enabled) => ipcRenderer.invoke('auto-update-save-config', enabled),
  checkAutoUpdateOnStart: () => ipcRenderer.invoke('auto-update-check-on-start'),
});
