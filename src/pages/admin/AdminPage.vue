<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

// ── TABS ─────────────────────────────────────────────────────────────────────
const activeTab = ref<'users' | 'db-explorer'>('users')

// ── USUARIOS ─────────────────────────────────────────────────────────────────
const users = ref<any[]>([])
const showAddModal = ref(false)
const saving = ref(false)
const editUser = ref<any>(null)
const showEditModal = ref(false)
const newUser = ref({ name: '', email: '', password: '', role: 'teacher' })

onMounted(async () => {
  await load()
})

async function load() {
  users.value = await window.electronAPI.getUsers()
}

async function createUser() {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    toast.warning('Todos los campos son requeridos.')
    return
  }
  saving.value = true
  try {
    const result = await window.electronAPI.createUser(JSON.parse(JSON.stringify(newUser.value)))
    if (result.success) {
      toast.success('Usuario creado correctamente.')
      showAddModal.value = false
      newUser.value = { name: '', email: '', password: '', role: 'teacher' }
      await load()
    } else {
      toast.error(result.message || 'Error al crear el usuario.')
    }
  } catch (e: any) {
    toast.error('Error interno: ' + String(e))
  } finally {
    saving.value = false
  }
}

async function saveEdit() {
  if (!editUser.value) return
  saving.value = true
  try {
    const result = await (window.electronAPI.updateUser(editUser.value.id, JSON.parse(JSON.stringify(editUser.value))) as Promise<any>)
    if (result.success) {
      toast.success('Usuario actualizado.')
      showEditModal.value = false
      await load()
    } else {
      toast.error(result.message || 'Error al actualizar.')
    }
  } catch (e: any) {
    toast.error('Error interno: ' + String(e))
  } finally {
    saving.value = false
  }
}

async function toggleActive(user: any) {
  await (window.electronAPI.updateUser(user.id, JSON.parse(JSON.stringify({ ...user, is_active: user.is_active ? 0 : 1 }))) as any)
  toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'}.`)
  await load()
}

// ── VISTA DE LA BASE ──────────────────────────────────────────────────────────
const dbTables = ref<any[]>([])
const selectedTable = ref<string | null>(null)
const dbColumns = ref<any[]>([])
const dbRecords = ref<any>({ columns: [], rows: [], total: 0, page: 1, pageSize: 50, totalPages: 0 })
const dbLoading = ref(false)
const dbSearch = ref('')
const dbPage = ref(1)
const dbPageSize = ref(50)
const dbSearchInput = ref('')

// Filtro de tablas en sidebar
const tableFilter = ref('')
const filteredTables = computed(() => {
  if (!tableFilter.value) return dbTables.value
  return dbTables.value.filter(t => t.name.toLowerCase().includes(tableFilter.value.toLowerCase()))
})

async function loadTables() {
  dbLoading.value = true
  try {
    dbTables.value = await (window.electronAPI as any).dbExplorerTables()
    if (dbTables.value.length && !selectedTable.value) {
      await selectTable(dbTables.value[0].name)
    }
  } catch (e) {
    toast.error('Error al cargar tablas.')
  }
  dbLoading.value = false
}

async function selectTable(name: string) {
  selectedTable.value = name
  dbPage.value = 1
  dbSearch.value = ''
  dbSearchInput.value = ''
  dbLoading.value = true
  try {
    dbColumns.value = await (window.electronAPI as any).dbExplorerColumns(name)
    await loadRecords()
  } catch (e) {
    toast.error('Error al cargar tabla.')
  }
  dbLoading.value = false
}

async function loadRecords() {
  if (!selectedTable.value) return
  dbLoading.value = true
  try {
    dbRecords.value = await (window.electronAPI as any).dbExplorerRecords({
      tableName: selectedTable.value,
      page: dbPage.value,
      pageSize: dbPageSize.value,
      search: dbSearch.value,
    })
  } catch (e) {
    toast.error('Error al cargar registros.')
  }
  dbLoading.value = false
}

function doSearch() {
  dbSearch.value = dbSearchInput.value
  dbPage.value = 1
  loadRecords()
}

function clearSearch() {
  dbSearchInput.value = ''
  dbSearch.value = ''
  dbPage.value = 1
  loadRecords()
}

watch(activeTab, (tab) => {
  if (tab === 'db-explorer' && dbTables.value.length === 0) {
    loadTables()
  }
})

watch(dbPage, () => loadRecords())
watch(dbPageSize, () => { dbPage.value = 1; loadRecords() })

// Detectar tipo de dato para darle color
function getCellStyle(value: any, colName: string): string {
  if (value === null || value === undefined) return 'color: var(--text-muted); font-style: italic;'
  if (typeof value === 'number') return 'color: #60a5fa; font-family: monospace;'
  if (colName.toLowerCase().includes('id') && typeof value === 'number') return 'color: #818cf8; font-family: monospace; font-weight:700;'
  if (colName.toLowerCase().includes('_at') || colName.toLowerCase().includes('date')) return 'color: #34d399; font-family: monospace; font-size:11px;'
  if (colName.toLowerCase().includes('color') && String(value).startsWith('#')) return `color: ${value}; font-weight:700;`
  return ''
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'string' && value.length > 80) return value.slice(0, 78) + '…'
  return String(value)
}

// Información de la tabla seleccionada
const selectedTableInfo = computed(() => dbTables.value.find(t => t.name === selectedTable.value))
</script>

<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Administración</h2>
        <p class="text-muted" style="font-size: 14px; margin-top: 4px;">Panel de administración del sistema</p>
      </div>
      <button v-if="activeTab === 'users'" class="btn btn-primary" @click="showAddModal = true">+ Nuevo Usuario</button>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="margin-bottom: 20px;">
      <button class="tab" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        👥 Usuarios
      </button>
      <button class="tab" :class="{ active: activeTab === 'db-explorer' }" @click="activeTab = 'db-explorer'">
        🗄️ Vista de la Base
      </button>
    </div>

    <!-- ═══ TAB: USUARIOS ═══════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'users'">
      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="data-table" v-if="users.length > 0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td style="font-weight: 500;">{{ user.name }}</td>
              <td class="text-muted">{{ user.email }}</td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-primary' : 'badge-neutral'">
                  {{ user.role === 'admin' ? '👑 Admin' : '👤 Docente' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-danger'">
                  {{ user.is_active ? '✓ Activo' : '✕ Inactivo' }}
                </span>
              </td>
              <td class="text-muted" style="font-size: 12px;">{{ user.created_at?.slice(0, 10) }}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-ghost btn-sm" @click="editUser = { ...user }; showEditModal = true">✏️</button>
                  <button class="btn btn-ghost btn-sm"
                    :style="user.is_active ? 'color: var(--color-warning)' : 'color: var(--color-success)'"
                    @click="toggleActive(user)">
                    {{ user.is_active ? '🔒' : '🔓' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state" style="padding: 40px;">
          <div class="empty-state-icon">👥</div>
          <p>No hay usuarios registrados.</p>
        </div>
      </div>
    </div>

    <!-- ═══ TAB: VISTA DE LA BASE ═══════════════════════════════════════════ -->
    <div v-if="activeTab === 'db-explorer'" class="fade-in">
      <!-- Layout de dos columnas: sidebar izquierdo (tablas) + contenido derecho -->
      <div style="display: flex; gap: 16px; height: calc(100vh - 220px); min-height: 500px;">

        <!-- Sidebar de tablas -->
        <div style="width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;">
          <!-- Búsqueda de tabla -->
          <div style="position: relative;">
            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
            <input
              v-model="tableFilter"
              type="text"
              placeholder="Filtrar tabla..."
              class="form-input"
              style="padding-left: 30px !important; font-size: 12px;"
            />
          </div>

          <!-- Lista de tablas -->
          <div class="card" style="padding: 0; overflow-y: auto; flex: 1;">
            <div
              style="padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--bg-elevated);"
            >
              <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
                Tablas ({{ dbTables.length }})
              </span>
            </div>

            <div v-if="dbLoading && dbTables.length === 0" style="padding: 20px; text-align: center;">
              <div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>
            </div>

            <div
              v-for="table in filteredTables"
              :key="table.name"
              @click="selectTable(table.name)"
              style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; transition: background 0.15s;"
              :style="selectedTable === table.name
                ? { background: 'rgba(99,102,241,0.15)', borderLeft: '3px solid var(--color-primary)' }
                : { borderLeft: '3px solid transparent' }"
            >
              <div>
                <div style="font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">
                  {{ table.name }}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">
                  {{ table.type === 'view' ? '👁 Vista' : '📋 Tabla' }}
                </div>
              </div>
              <span style="font-size: 10px; color: var(--color-primary); font-weight: 700; background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 4px; flex-shrink: 0;">
                {{ table.count.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Contenido principal -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; overflow: hidden;">

          <!-- Header del explorador -->
          <div v-if="selectedTable" class="card" style="padding: 12px 16px; flex-shrink: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <h4 style="margin: 0; font-size: 15px; font-weight: 800;">
                  🗄️ {{ selectedTable }}
                  <span v-if="selectedTableInfo" style="font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 8px;">
                    {{ selectedTableInfo.count.toLocaleString() }} registros · {{ dbColumns.length }} columnas
                  </span>
                </h4>
              </div>

              <!-- Búsqueda de registros -->
              <div style="display: flex; gap: 8px; align-items: center;">
                <div style="display: flex; gap: 6px; align-items: center;">
                  <input
                    v-model="dbSearchInput"
                    @keyup.enter="doSearch"
                    type="text"
                    placeholder="Buscar en texto..."
                    class="form-input"
                    style="width: 200px; font-size: 12px;"
                  />
                  <button class="btn btn-primary btn-sm" @click="doSearch">🔍</button>
                  <button v-if="dbSearch" class="btn btn-ghost btn-sm" @click="clearSearch">✕</button>
                </div>
                <select v-model="dbPageSize" class="form-select" style="width: 80px; font-size: 12px;">
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
            </div>

            <!-- Columnas info -->
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
              <span
                v-for="col in dbColumns"
                :key="col.name"
                style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-elevated); border: 1px solid var(--border); font-family: monospace;"
                :style="col.pk ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}"
              >
                {{ col.pk ? '🔑 ' : '' }}{{ col.name }}
                <span style="color: var(--text-muted);">({{ col.type || 'TEXT' }})</span>
              </span>
            </div>
          </div>

          <!-- Tabla de registros -->
          <div class="card" style="padding: 0; overflow: hidden; flex: 1; display: flex; flex-direction: column;">
            <div v-if="!selectedTable" class="empty-state" style="flex: 1;">
              <div class="empty-state-icon">🗄️</div>
              <p>Selecciona una tabla del panel izquierdo</p>
            </div>

            <div v-else-if="dbLoading" style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
            </div>

            <template v-else>
              <!-- Tabla -->
              <div style="overflow: auto; flex: 1;">
                <table v-if="dbRecords.rows.length > 0" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead style="position: sticky; top: 0; z-index: 2;">
                    <tr>
                      <th
                        v-for="col in dbRecords.columns"
                        :key="col"
                        style="padding: 8px 10px; text-align: left; white-space: nowrap; background: var(--bg-elevated); border-bottom: 2px solid var(--border); font-size: 11px; font-weight: 700; color: var(--text-secondary);"
                      >
                        {{ col }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, idx) in dbRecords.rows"
                      :key="idx"
                      style="border-bottom: 1px solid var(--border);"
                    >
                      <td
                        v-for="col in dbRecords.columns"
                        :key="col"
                        style="padding: 6px 10px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        :style="getCellStyle(row[col], col)"
                        :title="String(row[col] ?? 'NULL')"
                      >
                        {{ formatValue(row[col]) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="empty-state" style="padding: 32px;">
                  <div class="empty-state-icon">📭</div>
                  <p>{{ dbSearch ? 'No hay resultados para "' + dbSearch + '"' : 'Esta tabla está vacía.' }}</p>
                </div>
              </div>

              <!-- Paginación -->
              <div v-if="dbRecords.total > 0" style="padding: 10px 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); flex-shrink: 0;">
                <span style="font-size: 12px; color: var(--text-muted);">
                  Mostrando {{ (dbPage - 1) * dbPageSize + 1 }}–{{ Math.min(dbPage * dbPageSize, dbRecords.total) }}
                  de <strong>{{ dbRecords.total.toLocaleString() }}</strong> registros
                  <span v-if="dbSearch"> · Búsqueda: "{{ dbSearch }}"</span>
                </span>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button class="btn btn-ghost btn-sm" :disabled="dbPage <= 1" @click="dbPage = 1">«</button>
                  <button class="btn btn-ghost btn-sm" :disabled="dbPage <= 1" @click="dbPage--">‹</button>
                  <span style="font-size: 12px; padding: 0 8px;">
                    Página {{ dbPage }} / {{ dbRecords.totalPages }}
                  </span>
                  <button class="btn btn-ghost btn-sm" :disabled="dbPage >= dbRecords.totalPages" @click="dbPage++">›</button>
                  <button class="btn btn-ghost btn-sm" :disabled="dbPage >= dbRecords.totalPages" @click="dbPage = dbRecords.totalPages">»</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Crear Usuario -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Nuevo Usuario</h2><button class="btn btn-ghost btn-icon" @click="showAddModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre Completo</label><input v-model="newUser.name" type="text" class="form-input" placeholder="Nombre del usuario" /></div>
          <div class="form-group"><label class="form-label">Correo Electrónico</label><input v-model="newUser.email" type="email" class="form-input" placeholder="correo@escuela.edu" /></div>
          <div class="form-group"><label class="form-label">Contraseña</label><input v-model="newUser.password" type="password" class="form-input" placeholder="Mínimo 8 caracteres" /></div>
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select v-model="newUser.role" class="form-select">
              <option value="teacher">👤 Docente</option>
              <option value="admin">👑 Administrador</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createUser" :disabled="saving"><span v-if="saving" class="spinner"></span><span v-else>Crear</span></button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Usuario -->
    <div v-if="showEditModal && editUser" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header"><h2>Editar Usuario</h2><button class="btn btn-ghost btn-icon" @click="showEditModal = false">✕</button></div>
        <div class="flex flex-col gap-4">
          <div class="form-group"><label class="form-label">Nombre</label><input v-model="editUser.name" type="text" class="form-input" /></div>
          <div class="form-group"><label class="form-label">Correo</label><input v-model="editUser.email" type="email" class="form-input" /></div>
          <div class="form-group"><label class="form-label">Nueva Contraseña (opcional)</label><input v-model="editUser.password" type="password" class="form-input" placeholder="Dejar vacío para no cambiar" /></div>
          <div class="form-group"><label class="form-label">Rol</label><select v-model="editUser.role" class="form-select"><option value="teacher">Docente</option><option value="admin">Administrador</option></select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="saving"><span v-if="saving" class="spinner"></span><span v-else>Guardar</span></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table tbody tr:hover { background: rgba(99,102,241,0.05); }
</style>
