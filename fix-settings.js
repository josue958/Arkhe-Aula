const fs = require('fs');

let content = fs.readFileSync('src/pages/settings/SettingsPage.vue', 'utf8');

// Fix newEval default percentage
content = content.replace("percentage: 10.0, period_ids: [] as number[], is_extra: false })", "percentage: 0, period_ids: [] as number[], is_extra: false })");

// Fix editEval state
content = content.replace("const editEval = ref({ oldName: '', name: '', percentage: 10.0, is_extra: false })", "const editEval = ref({ oldName: '', name: '', percentage: 0, is_extra: false, group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[] })");

// Fix editActivity state
content = content.replace("const editActivity = ref({ oldName: '', name: '' })", "const editActivity = ref({ oldName: '', name: '', group_ids: [] as number[], subject_names: [] as string[], period_ids: [] as number[], rubric_name: '' })");

// groupedEvalElements mapping logic change
content = content.replace(/groups: new Set\(\[e\.group_grade \+ '° ' \+ e\.group_name\]\),/g, "groups: new Set([e.group_grade + '° ' + e.group_name]),\n        raw_groups: new Set([e.group_id]),\n        raw_subjects: new Set([e.subject_name]),\n        raw_periods: new Set([e.period_id]),");
// ... and in the else block:
content = content.replace(/g\.groups\.add\(e\.group_grade \+ '° ' \+ e\.group_name\)/g, "g.groups.add(e.group_grade + '° ' + e.group_name)\n      g.raw_groups.add(e.group_id)\n      g.raw_subjects.add(e.subject_name)\n      g.raw_periods.add(e.period_id)");

// Map elements back
content = content.replace(/g\.elements\.add\(a\.rubric_name\)/g, "g.elements.add(a.rubric_name)\n      g.raw_rubrics.add(a.rubric_name)\n      g.raw_groups.add(a.group_id)\n      g.raw_subjects.add(a.subject_name)\n      g.raw_periods.add(a.trimester)");
content = content.replace(/elements: new Set\(\[a\.rubric_name\]\),/g, "elements: new Set([a.rubric_name]),\n        raw_rubrics: new Set([a.rubric_name]),\n        raw_groups: new Set([a.group_id]),\n        raw_subjects: new Set([a.subject_name]),\n        raw_periods: new Set([a.trimester]),");

// update logic in openEditEval
content = content.replace(/editEval\.value = \{ oldName: e\.name, name: e\.name, percentage: e\.percentage, is_extra: !!e\.is_extra \}/, "editEval.value = { oldName: e.name, name: e.name, percentage: e.percentage, is_extra: !!e.is_extra, group_ids: Array.from(e.raw_groups) as number[], subject_names: Array.from(e.raw_subjects) as string[], period_ids: Array.from(e.raw_periods) as number[] }");

// logic in updateEvalElement
content = content.replace(/await window\.electronAPI\.updateRubric\(\{[\s\S]*?\}\)/, `await window.electronAPI.updateRubricFull({ oldName: editEval.value.oldName, data: { name: editEval.value.name, percentage: Number(editEval.value.percentage), is_extra: editEval.value.is_extra, group_ids: Array.from(editEval.value.group_ids), subject_names: Array.from(editEval.value.subject_names), period_ids: Array.from(editEval.value.period_ids) } })`);

// logic in openEditActivity
content = content.replace(/editActivity\.value = \{ oldName: a\.name, name: a\.name \}/, "editActivity.value = { oldName: a.name, name: a.name, group_ids: Array.from(a.raw_groups) as number[], subject_names: Array.from(a.raw_subjects) as string[], period_ids: Array.from(a.raw_periods) as number[], rubric_name: Array.from(a.raw_rubrics)[0] as string }");

// logic in updateActivityElement
content = content.replace(/await window\.electronAPI\.updateActivity\(\{[\s\S]*?\}\)/, `await window.electronAPI.updateActivityFull({ oldName: editActivity.value.oldName, data: { name: editActivity.value.name, group_ids: Array.from(editActivity.value.group_ids), subject_names: Array.from(editActivity.value.subject_names), period_ids: Array.from(editActivity.value.period_ids), rubric_name: editActivity.value.rubric_name } })`);

fs.writeFileSync('src/pages/settings/SettingsPage.vue', content);
