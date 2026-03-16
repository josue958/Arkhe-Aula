// Declaración de tipos para la API de Electron expuesta por preload.js
interface ElectronAPI {
  // Sistema
  getAppVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  getUserDataPath: () => Promise<string>
  getLocalIp: () => Promise<string>

  // Diálogos
  openFileDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  saveFileDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
  copyFile: (src: string, dest: string) => Promise<boolean>
  readFile: (filePath: string) => Promise<Buffer>

  // Menú
  onMenuEvent: (callback: (event: string, ...args: any[]) => void) => void
  removeAllListeners: (event: string) => void

  // Auth
  login: (data: { email: string; password: string }) => Promise<{ success: boolean; message?: string; user?: any }>
  logout: () => Promise<{ success: boolean }>
  getCurrentUser: () => Promise<any>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>
  createUser: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>
  getUsers: () => Promise<any[]>
  updateUser: (id: number, data: any) => Promise<{ success: boolean }>
  deleteUser: (id: number) => Promise<{ success: boolean }>

  // Escuela
  getSchool: () => Promise<any>
  saveSchool: (data: any) => Promise<{ success: boolean }>

  // Licencias y Suscripciones
  getLicense: () => Promise<any>
  getLicenseLimits: () => Promise<any>
  checkLicenseLimits: (type: string, currentCount: number) => Promise<{ allowed: boolean; limit?: number }>
  activateLicense: (licenseKey: string, planType: string) => Promise<{ success: boolean; plan?: string; message?: string }>

  // Ciclos
  getCycles: () => Promise<any[]>
  createCycle: (data: any) => Promise<{ success: boolean; id?: number }>
  updateCycle: (id: number, data: any) => Promise<{ success: boolean }>
  deleteCycle: (id: number) => Promise<{ success: boolean }>

  // Grupos
  getGroups: (filters?: any) => Promise<any[]>
  getGroup: (id: number) => Promise<any>
  createGroup: (data: any) => Promise<{ success: boolean; id?: number }>
  updateGroup: (id: number, data: any) => Promise<{ success: boolean }>
  deleteGroup: (id: number) => Promise<{ success: boolean }>
  archiveGroup: (id: number) => Promise<{ success: boolean }>
  restoreGroup: (id: number) => Promise<{ success: boolean }>
  migrateGroup: (id: number, data: any) => Promise<{ success: boolean; target_group_id?: number }>

  // Períodos
  getGroupPeriods: (groupId: number) => Promise<any[]>
  saveGroupPeriod: (data: any) => Promise<{ success: boolean; id?: number }>
  deleteGroupPeriod: (id: number) => Promise<{ success: boolean }>

  // Alumnos
  getStudents: (groupId?: number) => Promise<any[]>
  getStudent: (id: number) => Promise<any>
  createStudent: (data: any) => Promise<{ success: boolean; id?: number }>
  updateStudent: (id: number, data: any) => Promise<{ success: boolean }>
  deleteStudent: (id: number) => Promise<{ success: boolean; message?: string }>
  bulkDeleteStudents: (ids: number[]) => Promise<{ success: boolean; message?: string }>
  bulkUpdateStudentStatus: (ids: number[], statusId: number) => Promise<{ success: boolean; message?: string }>
  bulkUpdateStudentEnrolledAt: (ids: number[], enrolled_at: string) => Promise<{ success: boolean; message?: string }>
  importStudentsFromExcel: (data: { groupId: number; students: any[] }) => Promise<{ success: boolean; imported: number; message?: string }>

  // Estatus
  getStatuses: () => Promise<any[]>
  createStatus: (data: any) => Promise<{ success: boolean; id?: number }>
  updateStatus: (id: number, data: any) => Promise<{ success: boolean }>
  deleteStatus: (id: number) => Promise<{ success: boolean }>

  // Materias
  getSubjectTemplates: () => Promise<any[]>
  createSubjectTemplate: (data: any) => Promise<{ success: boolean; id?: number }>
  updateSubjectTemplate: (id: number, data: any) => Promise<{ success: boolean }>
  deleteSubjectTemplate: (id: number) => Promise<{ success: boolean }>
  assignSubjectTemplate: (groupId: number, templateId: number) => Promise<{ success: boolean }>

  // Evaluación
  getEvaluationData: (groupId: number, subjectId: number) => Promise<any>
  getGroupSubjects: (groupId: number) => Promise<any[]>
  saveGrades: (data: any) => Promise<{ success: boolean }>
  saveGradesSettings: (data: { subjectId: number, settings: any[] }) => Promise<{ success: boolean }>
  createRubric: (data: any) => Promise<{ success: boolean; id?: number }>
  deleteRubric: (name: string) => Promise<{ success: boolean }>
  createActivity: (data: any) => Promise<{ success: boolean; id?: number }>
  deleteActivity: (name: string) => Promise<{ success: boolean }>
  moveRubric: (payload: { rubricId: number, direction: 'left' | 'right' }) => Promise<{ success: boolean }>
  moveActivity: (payload: { activityId: number, direction: 'left' | 'right' }) => Promise<{ success: boolean }>
  exportEvaluation: (groupId: number, subjectId: number) => Promise<any>

  // Plantillas de evaluación
  getEvaluationTemplates: () => Promise<any[]>
  createEvaluationTemplate: (data: any) => Promise<{ success: boolean; id?: number }>
  updateEvaluationTemplate: (id: number, data: any) => Promise<{ success: boolean }>
  deleteEvaluationTemplate: (id: number) => Promise<{ success: boolean }>
  assignEvaluationTemplate: (groupId: number, templateId: number) => Promise<{ success: boolean }>

  // Asistencia
  getAttendanceGroups: () => Promise<any[]>
  getAttendanceForDate: (groupId: number, date: string) => Promise<any[]>
  saveAttendance: (data: any) => Promise<{ success: boolean }>
  deleteAttendanceForDate: (groupId: number, date: string) => Promise<{ success: boolean, message?: string }>
  getAttendanceReport: (filters: any) => Promise<any[]>
  exportAttendanceReport: (data: any) => Promise<{ success: boolean }>
  updateAttendance: (id: number, data: any) => Promise<{ success: boolean }>

  // Ajustes Adicionales
  getSettingsEvaluationElements: () => Promise<any[]>
  getSettingsActivities: () => Promise<any[]>
  getTrimesters: (cycleId: number) => Promise<any[]>
  saveTrimesters: (data: { cycleId: number, trimesters: any[] }) => Promise<{ success: boolean }>
  getSettingsSubjectsForGroup: (groupId: number) => Promise<any[]>
  getSettingsRubricsForSubject: (data: any) => Promise<any[]>
  updateRubricFull: (data: any) => Promise<{ success: boolean }>
  updateActivityFull: (data: any) => Promise<{ success: boolean }>

  // Reportes
  getReportData: (filters: any) => Promise<any[]>
  getStatistics: (filters: any) => Promise<any>
  exportReport: (data: any) => Promise<{ success: boolean }>
  getEvaluationStatistics: (filters: any) => Promise<any>
  getReportsData: (groupId: number, filters: any) => Promise<any>
  getAttendanceReportData: (groupId: number, filters: any) => Promise<any>
  getReportsAttendanceAlerts: (data: { cycleId: number, trimesterNumber: number }) => Promise<{ threeAbsences: any[], moreThanThreeAbsences: any[] }>
  getReportsFailingStudents: (data: { cycleId: number, trimesterNumber: number }) => Promise<any[]>

  // Config
  getIndicators: () => Promise<any[]>
  updateIndicators: (data: any[]) => Promise<{ success: boolean }>
  getGradingConfig: () => Promise<any>
  updateGradingConfig: (data: any) => Promise<{ success: boolean }>

  // DB
  exportDatabase: (destPath: string) => Promise<{ success: boolean }>
  importDatabase: (srcPath: string) => Promise<{ success: boolean }>
  getDatabaseInfo: () => Promise<{ path: string; size: number; modified: Date }>
  changeDatabasePath: (newPath: string) => Promise<{ success: boolean; path?: string; message?: string }>
  resetDatabasePath: () => Promise<{ success: boolean; message?: string }>
  // Vista de la Base
  dbExplorerTables: () => Promise<{ name: string; type: string; count: number }[]>
  dbExplorerColumns: (tableName: string) => Promise<any[]>
  dbExplorerRecords: (data: { tableName: string; page?: number; pageSize?: number; search?: string }) => Promise<any>

  // Perfil de usuario
  exportUserProfile: (destPath: string) => Promise<{ success: boolean; message?: string }>
  importUserProfile: (srcPath: string) => Promise<{ success: boolean; groupsImported?: number; studentsImported?: number; message?: string }>

  // Dashboard
  dashboardStudentSearch: (query: string) => Promise<any[]>
  getStudentGradesDetail: (studentId: number) => Promise<any>

  // Equipos
  getAllConfiguredTeams: () => Promise<any[]>
  getTeamsByActivity: (data: { activityId: number, groupId: number }) => Promise<any[]>
  saveTeams: (data: { activityId: number, teamsData: any[] }) => Promise<{ success: boolean }>
  deleteTeamsByActivity: (data: { activityId: number }) => Promise<{ success: boolean }>

  // CIERRE DE APP
  onAppClosing: (callback: () => void) => void
  forceQuit: () => Promise<void>

  // SINCRONIZACIÓN
  getCloudSyncConfig: () => Promise<any>
  syncDatabase: () => Promise<any>
  syncSetProvider: (providerType: string, config: any) => Promise<{ success: boolean; message?: string }>
  syncPush: (config?: any) => Promise<{ success: boolean; message?: string }>
  syncPull: (config?: any) => Promise<{ success: boolean; message?: string }>
  syncBackupDb: () => Promise<{ success: boolean; message?: string }>

  // Seguimiento de PDA
  savePda: (data: any) => Promise<{ success: boolean, id?: number, message?: string }>
  getPdas: () => Promise<any[]>
  deletePda: (id: number) => Promise<{ success: boolean }>

  // Seguimiento de Conducta
  getBehaviorRecords: (groupId: number, date: string) => Promise<any[]>
  saveBehaviorRecords: (groupId: number, date: string, records: any[]) => Promise<{ success: boolean }>
  getBehaviorReport: (groupId: number, trimester: number) => Promise<{ students: any[], records: any[], trimesterObj: any }>

  // Incidentes
  getIncidents: () => Promise<any[]>
  getIncidentTypes: () => Promise<any[]>
  createIncidentType: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>
  updateIncidentType: (id: number, data: any) => Promise<{ success: boolean; message?: string }>
  deleteIncidentType: (id: number) => Promise<{ success: boolean; message?: string }>
  createIncident: (data: any) => Promise<{ success: boolean; id?: number; message?: string }>

  // Actualizaciones
  checkForUpdates: () => Promise<{ success: boolean; updateFound?: boolean; message?: string }>
  downloadUpdate: () => Promise<{ success: boolean; message?: string }>
  installUpdate: () => Promise<{ success: boolean }>
  getUpdaterStatus: () => Promise<{ updateAvailable: boolean; updateDownloaded: boolean; updateInfo: any }>
  onUpdaterEvent: (callback: (data: { event: string; data: any }) => void) => void
  removeUpdaterListeners: () => void
  getAutoUpdateConfig: () => Promise<{ enabled: boolean }>
  saveAutoUpdateConfig: (enabled: boolean) => Promise<{ success: boolean }>
  checkAutoUpdateOnStart: () => Promise<{ success: boolean; checked: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}

