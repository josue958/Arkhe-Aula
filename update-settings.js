const fs = require('fs');

let content = fs.readFileSync('src/pages/settings/SettingsPage.vue', 'utf8');

// 1. IMPORT COMPUTED
content = content.replace("import { ref, onMounted } from 'vue'", "import { ref, computed, onMounted } from 'vue'");

// 2. Evaluaciones State
const newEvalState = `const newEval = ref({ name: '', group_ids: [] as number[], subject_names: [] as string[], percentage: 10.0, period_ids: [] as number[], is_extra: false })`;
// Already there! Edit Activity State:
const actStateRegex = /const newActivity = ref\(\{.*\}\)/;
content = content.replace(actStateRegex, `const newActivity = ref({ name: '', group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[], rubric_name: '' })`);

// remove loadEvalSubjects entirely
content = content.replace(/async function loadEvalSubjects\(\) \{[\s\S]*?formEvalSubjects\.value = Array\.from\(uniqueNames\)\.map\(name => \(\{ name \}\)\)\n\}/, '');

// remove loadActSubjects entirely
content = content.replace(/async function loadActSubjects\(\) \{[\s\S]*?\}\n/, '');

// remove loadActRubrics entirely
content = content.replace(/async function loadActRubrics\(\) \{[\s\S]*?\}\n/, '');

// Add computed properties just before formGroups
const computedProps = `
const uniqueSubjectNames = computed(() => {
  const names = new Set<string>()
  for (const s of subjects.value) {
    names.add(s.name)
  }
  return Array.from(names).sort()
})

const uniqueRubricNames = computed(() => {
  const names = new Set<string>()
  for (const e of evalElements.value) {
    names.add(e.name)
  }
  return Array.from(names).sort()
})

const evalSortKey = ref('name')
const evalSortAsc = ref(true)

const setEvalSort = (key: string) => {
  if (evalSortKey.value === key) evalSortAsc.value = !evalSortAsc.value
  else { evalSortKey.value = key; evalSortAsc.value = true }
}

const groupedEvalElements = computed(() => {
  const map = new Map()
  for (const e of evalElements.value) {
    if (!map.has(e.name)) {
      map.set(e.name, {
        id: e.id,
        name: e.name,
        percentage: e.percentage,
        is_extra: e.is_extra,
        groups: new Set([e.group_grade + '° ' + e.group_name]),
        subjects: new Set([e.subject_name]),
        trimesters: new Set([e.period_id])
      })
    } else {
      const g = map.get(e.name)
      g.groups.add(e.group_grade + '° ' + e.group_name)
      g.subjects.add(e.subject_name)
      g.trimesters.add(e.period_id)
      g.percentage = e.percentage
      g.is_extra = e.is_extra
    }
  }
  let arr = Array.from(map.values()).map(g => ({
    ...g,
    groupsStr: Array.from(g.groups).sort().join(', '),
    subjectsStr: Array.from(g.subjects).sort().join(', '),
    trimestersStr: Array.from(g.trimesters).sort().map(t => 'T'+t).join(', ')
  }))
  arr.sort((a, b) => {
    const valA = a[evalSortKey.value]
    const valB = b[evalSortKey.value]
    if (valA < valB) return evalSortAsc.value ? -1 : 1
    if (valA > valB) return evalSortAsc.value ? 1 : -1
    return 0
  })
  return arr
})

const actSortKey = ref('name')
const actSortAsc = ref(true)

const setActSort = (key: string) => {
  if (actSortKey.value === key) actSortAsc.value = !actSortAsc.value
  else { actSortKey.value = key; actSortAsc.value = true }
}

const groupedActivities = computed(() => {
  const map = new Map()
  for (const a of activities.value) {
    if (!map.has(a.name)) {
      map.set(a.name, {
        id: a.id,
        name: a.name,
        elements: new Set([a.rubric_name]),
        groups: new Set([a.group_grade + '° ' + a.group_name]),
        subjects: new Set([a.subject_name]),
        trimesters: new Set([a.trimester])
      })
    } else {
      const g = map.get(a.name)
      g.elements.add(a.rubric_name)
      g.groups.add(a.group_grade + '° ' + a.group_name)
      g.subjects.add(a.subject_name)
      g.trimesters.add(a.trimester)
    }
  }
  let arr = Array.from(map.values()).map(g => ({
    ...g,
    elementsStr: Array.from(g.elements).sort().join(', '),
    groupsStr: Array.from(g.groups).sort().join(', '),
    subjectsStr: Array.from(g.subjects).sort().join(', '),
    trimestersStr: Array.from(g.trimesters).sort().map(t => 'T'+t).join(', ')
  }))
  arr.sort((a, b) => {
    const valA = a[actSortKey.value]
    const valB = b[actSortKey.value]
    if (valA < valB) return actSortAsc.value ? -1 : 1
    if (valA > valB) return actSortAsc.value ? 1 : -1
    return 0
  })
  return arr
})
`;

content = content.replace('// Evaluación Formativa', computedProps + '\n// Evaluación Formativa');

// Remove update element by id => it's now by name
content = content.replace("window.electronAPI.updateRubric({ id: editEval.value.id, data: { name: editEval.value.name, percentage: Number(editEval.value.percentage), is_extra: editEval.value.is_extra } })", "window.electronAPI.updateRubric({ oldName: editEval.value.id, data: { name: editEval.value.name, percentage: Number(editEval.value.percentage), is_extra: editEval.value.is_extra } })");

// Wait, editEval initially stores ID. Let's make it store name.
content = content.replace("const editEval = ref({ id: -1, name: '', percentage: 10.0, is_extra: false })", "const editEval = ref({ oldName: '', name: '', percentage: 10.0, is_extra: false })");
content = content.replace("editEval.value = { id: e.id, name: e.name, percentage: Number(e.percentage), is_extra: Boolean(e.is_extra) }", "editEval.value = { oldName: e.name, name: e.name, percentage: Number(e.percentage), is_extra: Boolean(e.is_extra) }");
content = content.replace("id: editEval.value.id", "oldName: editEval.value.oldName");
content = content.replace("editEval.value.id = -1", "editEval.value.oldName = ''");

content = content.replace("const editActivity = ref({ id: -1, name: '' })", "const editActivity = ref({ oldName: '', name: '' })");
content = content.replace("editActivity.value = { id: a.id, name: a.name }", "editActivity.value = { oldName: a.name, name: a.name }");
content = content.replace("window.electronAPI.updateActivity({ id: editActivity.value.id, data: { name: editActivity.value.name } })", "window.electronAPI.updateActivity({ oldName: editActivity.value.oldName, data: { name: editActivity.value.name } })");

content = content.replace('deleteEvalElement(id: number)', 'deleteEvalElement(name: string)');
content = content.replace('deleteRubric(id)', 'deleteRubric(name)');
content = content.replace('deleteActivityElement(id: number)', 'deleteActivityElement(name: string)');
content = content.replace('deleteActivity(id)', 'deleteActivity(name)');


// createActivityElement
const newCreateActivity = `
async function createActivityElement() {
  savingActivity.value = true
  try {
    for (const gid of newActivity.value.group_ids) {
      const gSubjects = await window.electronAPI.getSettingsSubjectsForGroup(gid)
      const matchingSubs = gSubjects.filter((s: any) => newActivity.value.subject_names.includes(s.name))
      for (const sub of matchingSubs) {
        for (const pid of newActivity.value.period_ids) {
          const rubrics = await window.electronAPI.getSettingsRubricsForSubject({
            subjectId: sub.id, periodId: pid
          })
          const targetRubric = rubrics.find((r: any) => r.name === newActivity.value.rubric_name)
          if (targetRubric) {
             await window.electronAPI.createActivity({
               rubric_id: targetRubric.id,
               name: newActivity.value.name,
               period_id: pid
             })
          }
        }
      }
    }
    toast.success('Actividades creadas.')
    showActivityModal.value = false
    newActivity.value = { name: '', group_ids: [], subject_names: [], period_ids: [], rubric_name: '' }
    await loadAll()
  } catch (e: any) {
    console.error(e)
    toast.error('Error al crear actividades: ' + String(e.message || e))
  }
  savingActivity.value = false
}
`;

content = content.replace(/async function createActivityElement\(\) \{[\s\S]*?savingActivity\.value = false\n\}/, newCreateActivity.trim());

// Update template for Eval Elements Table
const evalTableOld = `<table class="data-table" v-if="evalElements.length > 0">
          <thead><tr><th>Nombre</th><th>Grupo/Grado</th><th>Materia</th><th>Trimestre</th><th>Puntaje</th><th>Extra</th></tr></thead>
          <tbody>
            <tr v-for="e in evalElements" :key="e.id">
              <td style="font-weight: 500;">{{ e.name }}</td>
              <td>{{ e.group_grade }}° {{ e.group_name }}</td>
              <td>{{ e.subject_name }}</td>
              <td>Trimestre {{ e.period_id }}</td>
              <td>{{ e.percentage }}<span v-if="!e.is_extra">%</span></td>
              <td><span class="badge" :class="e.is_extra ? 'badge-primary' : 'badge-neutral'">{{ e.is_extra ? 'Sí' : 'No' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditEval(e)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteEvalElement(e.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>`;

const evalTableNew = `<table class="data-table" v-if="groupedEvalElements.length > 0">
          <thead><tr>
            <th @click="setEvalSort('name')" style="cursor:pointer">Nombre {{ evalSortKey === 'name' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('groupsStr')" style="cursor:pointer">Grupo/Grado {{ evalSortKey === 'groupsStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('subjectsStr')" style="cursor:pointer">Materia {{ evalSortKey === 'subjectsStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setEvalSort('trimestersStr')" style="cursor:pointer">Trimestre {{ evalSortKey === 'trimestersStr' ? (evalSortAsc ? '↑' : '↓') : '' }}</th>
            <th>Puntaje</th>
            <th>Extra</th>
          </tr></thead>
          <tbody>
            <tr v-for="e in sortedGroupedEvalElements" :key="e.name">
              <td style="font-weight: 500;">{{ e.name }}</td>
              <td style="font-size: 13px">{{ e.groupsStr }}</td>
              <td style="font-size: 13px">{{ e.subjectsStr }}</td>
              <td style="font-size: 13px">{{ e.trimestersStr }}</td>
              <td>{{ e.percentage }}</td>
              <td><span class="badge" :class="e.is_extra ? 'badge-primary' : 'badge-neutral'">{{ e.is_extra ? 'Sí' : 'No' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditEval(e)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteEvalElement(e.name)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>`;

content = content.replace(evalTableOld, evalTableNew);


// Update Template for Act Table
const actTableOld = `<table class="data-table" v-if="activities.length > 0">
          <thead><tr><th>Nombre</th><th>Elemento</th><th>Grupo/Grado</th><th>Materia</th><th>Trimestre</th></tr></thead>
          <tbody>
            <tr v-for="a in activities" :key="a.id">
              <td style="font-weight: 500;">{{ a.name }}</td>
              <td>{{ a.rubric_name }}</td>
              <td>{{ a.group_grade }}° {{ a.group_name }}</td>
              <td>{{ a.subject_name }}</td>
              <td>Trimestre {{ a.trimester }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditActivity(a)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteActivityElement(a.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>`;

const actTableNew = `<table class="data-table" v-if="groupedActivities.length > 0">
          <thead><tr>
            <th @click="setActSort('name')" style="cursor:pointer">Nombre {{ actSortKey === 'name' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('elementsStr')" style="cursor:pointer">Elemento {{ actSortKey === 'elementsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('groupsStr')" style="cursor:pointer">Grupo/Grado {{ actSortKey === 'groupsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('subjectsStr')" style="cursor:pointer">Materia {{ actSortKey === 'subjectsStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
            <th @click="setActSort('trimestersStr')" style="cursor:pointer">Trimestre {{ actSortKey === 'trimestersStr' ? (actSortAsc ? '↑' : '↓') : '' }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="a in groupedActivities" :key="a.name">
              <td style="font-weight: 500;">{{ a.name }}</td>
              <td style="font-size: 13px">{{ a.elementsStr }}</td>
              <td style="font-size: 13px">{{ a.groupsStr }}</td>
              <td style="font-size: 13px">{{ a.subjectsStr }}</td>
              <td style="font-size: 13px">{{ a.trimestersStr }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openEditActivity(a)">✏️</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--color-danger);" @click="deleteActivityElement(a.name)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>`;
content = content.replace(actTableOld, actTableNew);


fs.writeFileSync('src/pages/settings/SettingsPage.vue', content);
