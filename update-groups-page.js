const fs = require('fs');
let content = fs.readFileSync('src/pages/groups/GroupsPage.vue', 'utf8');

// 1. Update createForm structure
content = content.replace(
  "subject_template_id: '',",
  "subject_template_ids: [] as number[],"
);
content = content.replace(
  "current_period: 1,",
  "current_period: 1,\n  period_ids: [] as number[],"
);

content = content.replace(
  "subject_template_id: '',",
  "subject_template_ids: [],"
);
content = content.replace(
  "current_period: 1,",
  "current_period: 1,\n    period_ids: [],"
);

// 2. Add showEditModal, editForm, openEditModal, updateGroup functions under 'showMigrateModal'
content = content.replace(
  "// Modal migrar",
  `// Modal editar grupo
const showEditModal = ref(false)
const editForm = ref({
  id: 0,
  name: '',
  grade: '1',
  cycle: '',
  shift: 'matutino',
  current_period: 1,
})
function openEditModal(group: any) {
  editForm.value = { ...group }
  showEditModal.value = true
}
async function updateGroup() {
  if (!editForm.value.name || !editForm.value.grade || !editForm.value.cycle) {
    toast.warning('Completa todos los campos requeridos.')
    return
  }
  try {
    await window.electronAPI.updateGroup(editForm.value.id, JSON.parse(JSON.stringify(editForm.value)))
    toast.success('Grupo actualizado correctamente.')
    showEditModal.value = false
    await loadData()
  } catch (e) {
    toast.error('Error al actualizar el grupo.')
  }
}

// Modal migrar`
);

// 3. Update the UI for form inputs
content = content.replace(
  `<div class="form-group">
            <label class="form-label">Materia (opcional)</label>
            <select v-model="createForm.subject_template_id" class="form-select">
              <option value="">Sin materia asignada</option>
              <option v-for="t in subjectTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Trimestre Inicial</label>
            <select v-model="createForm.current_period" class="form-select">
              <option :value="1">Trimestre 1</option>
              <option :value="2">Trimestre 2</option>
              <option :value="3">Trimestre 3</option>
            </select>
          </div>`,
  `<div class="form-group">
            <label class="form-label">Materia (opcional) <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list">
              <label v-for="t in subjectTemplates" :key="t.id" class="flex items-center gap-2" style="cursor: pointer; padding: 4px;">
                <input type="checkbox" :value="t.id" v-model="createForm.subject_template_ids" />
                {{ t.name }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Trimestres <span class="text-muted text-xs">(Múltiple)</span></label>
            <div class="checkbox-list">
              <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="1" v-model="createForm.period_ids" /> Trimestre 1</label>
              <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="2" v-model="createForm.period_ids" /> Trimestre 2</label>
              <label class="flex items-center gap-2" style="cursor: pointer; padding: 4px;"><input type="checkbox" :value="3" v-model="createForm.period_ids" /> Trimestre 3</label>
            </div>
          </div>`
);

// 4. Add the button 'Editar' in the group card actions
content = content.replace(
  `<button class="btn btn-ghost btn-sm" @click="openMigrateModal(group)">Migrar</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--color-warning);" @click="archiveGroup(group.id)">Archivar</button>`,
  `<button class="btn btn-ghost btn-sm" @click="openEditModal(group)">Editar</button>
          <button class="btn btn-ghost btn-sm" @click="openMigrateModal(group)">Migrar</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--color-warning);" @click="archiveGroup(group.id)">Archivar</button>`
);

// 5. Add Modal Editar Grupo markup
content = content.replace(
  `<!-- Modal: Crear Grupo -->`,
  `<!-- Modal: Editar Grupo -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Grupo</h2>
          <button class="btn btn-ghost btn-icon" @click="showEditModal = false">✕</button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nombre del Grupo *</label>
              <input v-model="editForm.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Grado *</label>
              <select v-model="editForm.grade" class="form-select">
                <option v-for="g in [1,2,3,4,5,6]" :key="g" :value="String(g)">{{ g }}°</option>
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Ciclo Escolar *</label>
              <select v-model="editForm.cycle" class="form-select">
                <option v-for="c in cycles" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Turno</label>
              <select v-model="editForm.shift" class="form-select">
                <option value="matutino">🌅 Matutino</option>
                <option value="vespertino">🌆 Vespertino</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Trimestre Actual</label>
            <select v-model="editForm.current_period" class="form-select">
              <option :value="1">Trimestre 1</option>
              <option :value="2">Trimestre 2</option>
              <option :value="3">Trimestre 3</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="updateGroup">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Crear Grupo -->`
);

fs.writeFileSync('src/pages/groups/GroupsPage.vue', content);
