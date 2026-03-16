const { ipcMain } = require('electron');
const { getDatabase, exportDatabase, importDatabase, getDatabasePath, changeDatabase, getCustomDbPath, clearCustomDbPath, syncGradesForStudent, syncGradesForActivity } = require('./database');
const syncManager = require('./sync/SyncManager');
const logger = require('./logger');

const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────────────────────
// HELPER: obtener db con verificación
// ──────────────────────────────────────────────────────────────────────────────
function db() {
  return getDatabase();
}

// ──────────────────────────────────────────────────────────────────────────────
// AUTENTICACIÓN
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('auth-login', async (_, { email, password }) => {
  logger.logIPC('auth-login', { email }, 'system');
  const user = db().prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) {
    logger.logAuth('login-failed', email, 'system');
    return { success: false, message: 'Usuario no existente, favor de registrarse.' };
  }
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    logger.logAuth('login-invalid-password', email, 'system');
    return { success: false, message: 'Contraseña no válida.' };
  }
  // Guardar sesión
  db().prepare('DELETE FROM active_session').run();
  db().prepare('INSERT INTO active_session (id, user_id) VALUES (1, ?)').run(user.id);
  const { password: _pwd, ...userSafe } = user;
  logger.logAuth('login-success', email, user.name);
  return { success: true, user: userSafe };
});

ipcMain.handle('settings-get-trimesters', async (_, cycleId) => {
  return db().prepare('SELECT * FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(cycleId);
});

ipcMain.handle('settings-save-trimesters', async (_, { cycleId, trimesters }) => {
  try {
    const upsertStmt = db().prepare(`
      INSERT INTO cycle_trimesters (cycle_id, trimester_number, start_date, end_date)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(cycle_id, trimester_number) DO UPDATE SET
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        updated_at = datetime('now')
    `);

    const transaction = db().transaction(() => {
      for (const t of trimesters) {
        upsertStmt.run(cycleId, t.trimester_number, t.start_date, t.end_date);
      }
    });
    transaction();
    return { success: true };
  } catch (error) {
    console.error('Error saving trimesters:', error);
    throw error;
  }
});

ipcMain.handle('settings-get-rubrics', async () => {
  const query = `
    SELECT r.*, s.name as subject_name, g.name as group_name, g.grade as group_grade, g.id as group_id
    FROM evaluation_rubrics r
    JOIN subjects s ON r.subject_id = s.id
    JOIN groups g ON s.group_id = g.id
    ORDER BY g.grade, g.name, s.name, r.period_id, r.sort_order
  `;
  return db().prepare(query).all();
});

ipcMain.handle('settings-get-activities', async () => {
  const query = `
    SELECT a.*, r.name as rubric_name, s.name as subject_name, g.name as group_name, g.grade as group_grade, r.period_id as trimester, s.id as subject_id, g.id as group_id
    FROM activities a
    JOIN evaluation_rubrics r ON a.rubric_id = r.id
    JOIN subjects s ON r.subject_id = s.id
    JOIN groups g ON s.group_id = g.id
    ORDER BY g.grade, g.name, s.name, r.period_id, r.sort_order, a.sort_order
  `;
  return db().prepare(query).all();
});

ipcMain.handle('settings-get-subjects-for-group', async (_, groupId) => {
  return db().prepare('SELECT * FROM subjects WHERE group_id = ?').all(groupId);
});

ipcMain.handle('settings-get-rubrics-for-subject', async (_, { subjectId, periodId }) => {
  if (!periodId) {
    return db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ?').all(subjectId);
  }
  return db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ? AND period_id = ?').all(subjectId, periodId);
});

ipcMain.handle('auth-logout', async () => {
  db().prepare('DELETE FROM active_session').run();
  return { success: true };
});

ipcMain.handle('auth-current-user', async () => {
  const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
  if (!session) return null;
  const user = db().prepare('SELECT id, name, email, role, school_id, created_at FROM users WHERE id = ?').get(session.user_id);
  return user || null;
});

ipcMain.handle('auth-change-password', async (_, { currentPassword, newPassword }) => {
  const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
  if (!session) return { success: false, message: 'No hay sesión activa.' };
  const user = db().prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!bcrypt.compareSync(currentPassword, user.password)) return { success: false, message: 'Contraseña actual incorrecta.' };
  const hashed = bcrypt.hashSync(newPassword, 10);
  db().prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);
  return { success: true };
});

ipcMain.handle('auth-create-user', async (_, data) => {
  try {
    const hashed = bcrypt.hashSync(data.password, 10);
    const result = db().prepare('INSERT INTO users (name, email, password, role, school_id) VALUES (?, ?, ?, ?, 1)').run(data.name, data.email, hashed, data.role || 'teacher');
    return { success: true, id: Number(result.lastInsertRowid) };
  } catch (e) {
    return { success: false, message: 'El correo electrónico ya está registrado u ocurrió un error.' };
  }
});

ipcMain.handle('auth-get-users', async () => {
  return db().prepare('SELECT id, name, email, role, school_id, is_active, created_at FROM users ORDER BY name').all();
});

ipcMain.handle('auth-update-user', async (_, { id, data }) => {
  try {
    let query = "UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = datetime('now')";
    const params = [data.name, data.email, data.role, data.is_active ?? 1];
    if (data.password && data.password.trim() !== '') {
      query += ', password = ?';
      params.push(bcrypt.hashSync(data.password, 10));
    }
    query += ' WHERE id = ?';
    params.push(id);
    db().prepare(query).run(...params);
    return { success: true };
  } catch (e) {
    console.error('[UpdateUser] Error:', e);
    if (e.message?.includes('UNIQUE constraint failed: users.email')) {
      return { success: false, message: 'El correo electrónico ya está en uso por otro usuario.' };
    }
    return { success: false, message: 'Error al actualizar el usuario: ' + String(e.message || e) };
  }
});

ipcMain.handle('auth-delete-user', async (_, id) => {
  db().prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('auth-reset-password', async (_, { email, newPassword }) => {
  try {
    const user = db().prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
    if (!user) return { success: false, message: 'Usuario no encontrado o inactivo.' };
    const hashed = bcrypt.hashSync(newPassword, 10);
    db().prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);
    return { success: true };
  } catch (e) {
    return { success: false, message: 'Ocurrió un error al restablecer la contraseña.' };
  }
});

ipcMain.handle('auth-open-admin-readme', async () => {
  const { shell, app } = require('electron');
  const docPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'documentacion', 'Leame_Administrador.txt')
    : path.join(__dirname, '..', 'documentacion', 'Leame_Administrador.txt');
  await shell.openPath(docPath);
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// ESCUELA
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('school-get', async () => {
  return db().prepare('SELECT * FROM schools LIMIT 1').get();
});

ipcMain.handle('school-save', async (_, data) => {
  const school = db().prepare('SELECT id FROM schools LIMIT 1').get();
  if (school) {
    db().prepare(`UPDATE schools SET name=?, address=?, phone=?, email=?, principal_name=?,
      setting_max_score=?, setting_min_pass=?, setting_periods=?, updated_at=datetime('now') WHERE id=?`)
      .run(data.name, data.address, data.phone, data.email, data.principal_name,
        data.setting_max_score ?? 10, data.setting_min_pass ?? 6, data.setting_periods ?? 3, school.id);
    if (data.logo) {
      db().prepare(`UPDATE schools SET logo=?, logo_mime=? WHERE id=?`).run(data.logo, data.logo_mime || 'image/png', school.id);
    }
    if (data.state_logo) {
      db().prepare(`UPDATE schools SET state_logo=?, state_logo_mime=? WHERE id=?`).run(data.state_logo, data.state_logo_mime || 'image/png', school.id);
    }
  } else {
    db().prepare(`INSERT INTO schools (name, address, phone, email, principal_name) VALUES (?, ?, ?, ?, ?)`)
      .run(data.name, data.address, data.phone, data.email, data.principal_name);
  }
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// LICENCIAS Y SUSCRIPCIONES
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('license-get', async () => {
  const license = db().prepare('SELECT * FROM licenses WHERE school_id = 1 AND is_active = 1').get();
  if (!license) {
    return db().prepare(`INSERT INTO licenses (school_id, plan_type, max_groups, max_students, has_reports, has_advanced_evaluation, has_cloud_sync, has_support) VALUES (1, 'free', 3, 40, 0, 0, 0, 0) RETURNING *`).get();
  }
  return license;
});

ipcMain.handle('license-get-limits', async () => {
  const license = db().prepare('SELECT * FROM licenses WHERE school_id = 1 AND is_active = 1').get();
  if (!license) {
    return { plan_type: 'free', max_groups: 3, max_students: 40, has_reports: 0, has_advanced_evaluation: 0, has_cloud_sync: 0, has_support: 0 };
  }
  return {
    plan_type: license.plan_type,
    max_groups: license.max_groups,
    max_students: license.max_students,
    has_reports: license.has_reports,
    has_advanced_evaluation: license.has_advanced_evaluation,
    has_cloud_sync: license.has_cloud_sync,
    has_support: license.has_support
  };
});

ipcMain.handle('license-check-limits', async (_, { type, currentCount }) => {
  const license = db().prepare('SELECT * FROM licenses WHERE school_id = 1 AND is_active = 1').get();
  if (!license) {
    return { allowed: true, limit: 3 };
  }

  const limits = {
    groups: { current: 'groupsCount', max: license.max_groups, name: 'grupos' },
    students: { current: 'studentsCount', max: license.max_students, name: 'alumnos' }
  };

  if (type === 'groups') {
    return { allowed: currentCount < license.max_groups, limit: license.max_groups, name: 'grupos' };
  } else if (type === 'students') {
    return { allowed: currentCount < license.max_students, limit: license.max_students, name: 'alumnos' };
  }
  return { allowed: true };
});

ipcMain.handle('license-activate', async (_, { licenseKey, planType }) => {
  const plans = {
    basic: { max_groups: 10, max_students: 150, has_reports: 1, has_advanced_evaluation: 0, has_cloud_sync: 0, has_support: 0 },
    premium: { max_groups: 999999, max_students: 999999, has_reports: 1, has_advanced_evaluation: 1, has_cloud_sync: 1, has_support: 1 },
    enterprise: { max_groups: 999999, max_students: 999999, has_reports: 1, has_advanced_evaluation: 1, has_cloud_sync: 1, has_support: 1 }
  };

  const plan = plans[planType];
  if (!plan) {
    return { success: false, message: 'Plan no válido' };
  }

  const license = db().prepare('SELECT id FROM licenses WHERE school_id = 1').get();
  if (license) {
    db().prepare(`UPDATE licenses SET plan_type = ?, license_key = ?, max_groups = ?, max_students = ?, has_reports = ?, has_advanced_evaluation = ?, has_cloud_sync = ?, has_support = ?, is_active = 1, activated_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .run(planType, licenseKey, plan.max_groups, plan.max_students, plan.has_reports, plan.has_advanced_evaluation, plan.has_cloud_sync, plan.has_support, license.id);
  } else {
    db().prepare(`INSERT INTO licenses (school_id, plan_type, license_key, max_groups, max_students, has_reports, has_advanced_evaluation, has_cloud_sync, has_support) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(planType, licenseKey, plan.max_groups, plan.max_students, plan.has_reports, plan.has_advanced_evaluation, plan.has_cloud_sync, plan.has_support);
  }
  return { success: true, plan: planType };
});

// ──────────────────────────────────────────────────────────────────────────────
// CICLOS ESCOLARES
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('cycles-get-all', async () => {
  return db().prepare('SELECT * FROM school_cycles ORDER BY start_date DESC').all();
});

ipcMain.handle('cycles-create', async (_, data) => {
  if (data.is_active) {
    db().prepare('UPDATE school_cycles SET is_active = 0').run();
  }
  const result = db().prepare(`INSERT INTO school_cycles (school_id, name, start_date, end_date, is_active) VALUES (1, ?, ?, ?, ?)`)
    .run(data.name, data.start_date, data.end_date, data.is_active ? 1 : 0);
  return { success: true, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('cycles-update', async (_, { id, data }) => {
  if (data.is_active) {
    db().prepare('UPDATE school_cycles SET is_active = 0').run();
  }
  db().prepare(`UPDATE school_cycles SET name=?, start_date=?, end_date=?, is_active=?, updated_at=datetime('now') WHERE id=?`)
    .run(data.name, data.start_date, data.end_date, data.is_active ? 1 : 0, id);
  return { success: true };
});

ipcMain.handle('cycles-delete', async (_, id) => {
  db().prepare('DELETE FROM school_cycles WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// GRUPOS
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('groups-get-all', async (_, filters = {}) => {
  let query = `
    SELECT g.*,
      (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id) as students_count,
      (SELECT GROUP_CONCAT(sub.name, ', ') FROM subjects sub WHERE sub.group_id = g.id) as subjects_list
    FROM groups g
    WHERE 1=1
  `;
  const params = [];
  if (filters.user_id) { query += ' AND g.user_id = ?'; params.push(filters.user_id); }
  if (!filters.include_archived) { query += ' AND g.archived_at IS NULL'; }
  if (filters.cycle) { query += ' AND g.cycle = ?'; params.push(filters.cycle); }
  query += ' ORDER BY g.grade, g.name';

  const groups = db().prepare(query).all(...params);

  // Cargar períodos de cada grupo con fechas SIEMPRE desde cycle_trimesters (fuente maestra de Configuración/Trimestres)
  return groups.map(g => {
    const periods = db().prepare('SELECT * FROM group_periods WHERE group_id = ? ORDER BY period').all(g.id);
    
    // Siempre sobrescribir fechas desde cycle_trimesters para garantizar consistencia
    if (periods.length > 0) {
      // Obtener el cycle_id basado en el nombre del ciclo
      const cycle = db().prepare('SELECT id FROM school_cycles WHERE name = ?').get(g.cycle);
      if (cycle) {
        const trimesters = db().prepare('SELECT trimester_number, start_date, end_date FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(cycle.id);
        
        // Siempre tomar fechas desde cycle_trimesters (fuente maestra del módulo Configuración)
        for (const period of periods) {
          const trimester = trimesters.find(t => t.trimester_number === period.period);
          if (trimester) {
            period.start_date = trimester.start_date;
            period.end_date = trimester.end_date;
          }
        }
      }
    }
    
    return {
      ...g,
      subjects: g.subjects_list ? g.subjects_list.split(', ').map(n => ({ name: n })) : [],
      periods: periods,
    };
  });
});

ipcMain.handle('groups-get-one', async (_, id) => {
  const group = db().prepare('SELECT * FROM groups WHERE id = ?').get(id);
  if (!group) return null;
  
  const periods = db().prepare('SELECT * FROM group_periods WHERE group_id = ? ORDER BY period').all(id);
  
  // Siempre sobrescribir fechas desde cycle_trimesters (fuente maestra de Configuración/Trimestres)
  if (periods.length > 0) {
    const cycle = db().prepare('SELECT id FROM school_cycles WHERE name = ?').get(group.cycle);
    if (cycle) {
      const trimesters = db().prepare('SELECT trimester_number, start_date, end_date FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(cycle.id);
      
      // Siempre tomar fechas desde cycle_trimesters independientemente de lo guardado en group_periods
      for (const period of periods) {
        const trimester = trimesters.find(t => t.trimester_number === period.period);
        if (trimester) {
          period.start_date = trimester.start_date;
          period.end_date = trimester.end_date;
        }
      }
    }
  }
  
  group.periods = periods;
  group.subjects = db().prepare('SELECT * FROM subjects WHERE group_id = ?').all(id);
  return group;
});

ipcMain.handle('groups-create', async (_, data) => {
  const license = db().prepare('SELECT max_groups FROM licenses WHERE school_id = 1 AND is_active = 1').get();
  const currentGroups = db().prepare('SELECT COUNT(*) as cnt FROM groups WHERE archived_at IS NULL').get();
  
  if (license && currentGroups.cnt >= license.max_groups) {
    return { success: false, message: `Límite alcanzado: Has llegado al máximo de ${license.max_groups} grupos permitidos en tu plan.`, limit: license.max_groups };
  }

  const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
  const result = db().prepare(`INSERT INTO groups (user_id, school_id, cycle, name, grade, shift, current_period) VALUES (?, 1, ?, ?, ?, ?, ?)`)
    .run(session?.user_id || 1, data.cycle, data.name, data.grade, data.shift || 'matutino', data.current_period || 1);
  const groupId = Number(result.lastInsertRowid);

  // Crear materias si viene subject_template_ids
  if (data.subject_template_ids && data.subject_template_ids.length > 0) {
    for (const tid of data.subject_template_ids) {
      const template = db().prepare('SELECT * FROM subject_templates WHERE id = ?').get(tid);
      if (template) {
        db().prepare(`INSERT INTO subjects (group_id, subject_template_id, name, color) VALUES (?, ?, ?, ?)`)
          .run(groupId, template.id, template.name, template.color || '#6366f1');
      }
    }
  }

  // Crear períodos con fechas desde cycle_trimesters si period_ids existe
  if (data.period_ids && data.period_ids.length > 0) {
    // Obtener el cycle_id basado en el nombre del ciclo
    const cycle = db().prepare('SELECT id FROM school_cycles WHERE name = ?').get(data.cycle);
    const trimesters = cycle 
      ? db().prepare('SELECT trimester_number, start_date, end_date FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(cycle.id)
      : [];
    
    for (const pid of data.period_ids) {
      const trimester = trimesters.find(t => t.trimester_number === pid);
      const startDate = trimester?.start_date || null;
      const endDate = trimester?.end_date || null;
      db().prepare(`INSERT INTO group_periods (group_id, period, start_date, end_date) VALUES (?, ?, ?, ?)`)
        .run(groupId, pid, startDate, endDate);
    }
  }

  return { success: true, id: groupId };
});

ipcMain.handle('groups-update', async (_, { id, data }) => {
  const trans = db().transaction(() => {
    db().prepare(`UPDATE groups SET cycle=?, name=?, grade=?, shift=?, current_period=?, updated_at=datetime('now') WHERE id=?`)
      .run(data.cycle, data.name, data.grade, data.shift, data.current_period, id);

    if (Array.isArray(data.period_ids)) {
      const existingPeriods = db().prepare('SELECT period FROM group_periods WHERE group_id = ?').all(id).map(p => p.period);
      const periodsToAdd = data.period_ids.filter(p => !existingPeriods.includes(p));
      const periodsToRemove = existingPeriods.filter(p => !data.period_ids.includes(p));

      const delPeriod = db().prepare('DELETE FROM group_periods WHERE group_id = ? AND period = ?');
      for (const p of periodsToRemove) delPeriod.run(id, p);

      // Obtener el cycle_id basado en el nombre del ciclo para obtener fechas
      const cycle = db().prepare('SELECT id FROM school_cycles WHERE name = ?').get(data.cycle);
      const trimesters = cycle 
        ? db().prepare('SELECT trimester_number, start_date, end_date FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(cycle.id)
        : [];

      const insPeriod = db().prepare(`INSERT INTO group_periods (group_id, period, start_date, end_date) VALUES (?, ?, ?, ?)`);
      for (const p of periodsToAdd) {
        const trimester = trimesters.find(t => t.trimester_number === p);
        const startDate = trimester?.start_date || null;
        const endDate = trimester?.end_date || null;
        insPeriod.run(id, p, startDate, endDate);
      }
    }

    if (Array.isArray(data.subject_template_ids)) {
      const existingSubjects = db().prepare('SELECT subject_template_id FROM subjects WHERE group_id = ? AND subject_template_id IS NOT NULL').all(id).map(s => s.subject_template_id);
      const subjectsToAdd = data.subject_template_ids.filter(s => !existingSubjects.includes(s));
      const subjectsToRemove = existingSubjects.filter(s => !data.subject_template_ids.includes(s));

      const delSubject = db().prepare('DELETE FROM subjects WHERE group_id = ? AND subject_template_id = ?');
      for (const s of subjectsToRemove) delSubject.run(id, s);

      for (const tid of subjectsToAdd) {
        const template = db().prepare('SELECT * FROM subject_templates WHERE id = ?').get(tid);
        if (template) {
          const subResult = db().prepare(`INSERT INTO subjects (group_id, name, color, subject_template_id) VALUES (?, ?, ?, ?)`).run(id, template.name, template.color || '#6366f1', tid);
          const newSubjectId = Number(subResult.lastInsertRowid);
          
          // Clonar rubricas y actividades de otro grupo que tenga esta misma materia
          const sourceSubject = db().prepare('SELECT id FROM subjects WHERE subject_template_id = ? AND id != ? LIMIT 1').get(tid, newSubjectId);
          if (sourceSubject) {
            const rubrics = db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ?').all(sourceSubject.id);
            for (const rub of rubrics) {
              const res = db().prepare('INSERT INTO evaluation_rubrics (subject_id, name, percentage, period_id, sort_order, is_extra) VALUES (?, ?, ?, ?, ?, ?)')
                .run(newSubjectId, rub.name, rub.percentage, rub.period_id, rub.sort_order, rub.is_extra);
              const newRubId = Number(res.lastInsertRowid);
              
              const activities = db().prepare('SELECT * FROM activities WHERE rubric_id = ?').all(rub.id);
              for (const act of activities) {
                db().prepare('INSERT INTO activities (rubric_id, name, period_id, sort_order) VALUES (?, ?, ?, ?)')
                  .run(newRubId, act.name, act.period_id, act.sort_order);
              }
            }
          }
        }
      }
    }
  });
  trans();
  return { success: true };
});

ipcMain.handle('groups-delete', async (_, id) => {
  db().prepare('DELETE FROM groups WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('groups-archive', async (_, id) => {
  db().prepare(`UPDATE groups SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(id);
  return { success: true };
});

ipcMain.handle('groups-restore', async (_, id) => {
  db().prepare(`UPDATE groups SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
  return { success: true };
});

ipcMain.handle('groups-migrate', async (_, { id, data }) => {
  // Copiar alumnos a otro grupo o crear nuevo grupo clon
  const sourceGroup = db().prepare('SELECT * FROM groups WHERE id = ?').get(id);
  if (!sourceGroup) return { success: false, message: 'Grupo no encontrado' };

  let targetGroupId = data.target_group_id;

  if (!targetGroupId) {
    // Crear nuevo grupo clon
    const result = db().prepare(`INSERT INTO groups (user_id, school_id, cycle, name, grade, shift, current_period) VALUES (?, 1, ?, ?, ?, ?, 1)`)
      .run(sourceGroup.user_id, sourceGroup.cycle, data.new_group_name || `${sourceGroup.name} - Nuevo`, sourceGroup.grade, sourceGroup.shift);
    targetGroupId = Number(result.lastInsertRowid);
  }

  // Mover alumnos
  db().prepare('UPDATE students SET group_id = ? WHERE group_id = ?').run(targetGroupId, id);

  // Archivar el grupo original
  db().prepare(`UPDATE groups SET archived_at = datetime('now') WHERE id = ?`).run(id);

  return { success: true, target_group_id: targetGroupId };
});

// ──────────────────────────────────────────────────────────────────────────────
// PERÍODOS DE GRUPO
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('group-periods-get', async (_, groupId) => {
  return db().prepare('SELECT * FROM group_periods WHERE group_id = ? ORDER BY period').all(groupId);
});

ipcMain.handle('group-periods-save', async (_, data) => {
  const existing = db().prepare('SELECT id FROM group_periods WHERE group_id = ? AND period = ?').get(data.group_id, data.period);
  if (existing) {
    db().prepare(`UPDATE group_periods SET start_date=?, end_date=?, updated_at=datetime('now') WHERE id=?`)
      .run(data.start_date, data.end_date, existing.id);
    return { success: true, id: existing.id };
  } else {
    const result = db().prepare('INSERT INTO group_periods (group_id, period, start_date, end_date) VALUES (?, ?, ?, ?)')
      .run(data.group_id, data.period, data.start_date, data.end_date);
    return { success: true, id: Number(result.lastInsertRowid) };
  }
});

ipcMain.handle('group-periods-delete', async (_, id) => {
  db().prepare('DELETE FROM group_periods WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// ESTATUS DE ALUMNOS
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('statuses-get-all', async () => {
  return db().prepare('SELECT * FROM student_statuses ORDER BY is_default DESC, name').all();
});

ipcMain.handle('statuses-create', async (_, data) => {
  const result = db().prepare('INSERT INTO student_statuses (school_id, name, color, is_default) VALUES (1, ?, ?, ?)')
    .run(data.name, data.color, data.is_default ? 1 : 0);
  return { success: true, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('statuses-update', async (_, { id, data }) => {
  db().prepare(`UPDATE student_statuses SET name=?, color=?, updated_at=datetime('now') WHERE id=?`).run(data.name, data.color, id);
  return { success: true };
});

ipcMain.handle('statuses-delete', async (_, id) => {
  // No borrar si tiene alumnos asociados
  const count = db().prepare('SELECT COUNT(*) as cnt FROM students WHERE student_status_id = ?').get(id);
  if (count.cnt > 0) return { success: false, message: 'Hay alumnos con este estatus.' };
  db().prepare('DELETE FROM student_statuses WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// ALUMNOS
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('students-get-all', async (_, groupId) => {
  if (groupId) {
    return db().prepare(`
      SELECT s.*, ss.name as status_name, ss.color as status_color 
      FROM students s
      LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
      WHERE s.group_id = ?
      ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
    `).all(groupId);
  }
  return db().prepare(`
    SELECT s.*, ss.name as status_name, ss.color as status_color, g.name as group_name, g.grade as group_grade
    FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    LEFT JOIN groups g ON s.group_id = g.id
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all();
});

ipcMain.handle('students-get-one', async (_, id) => {
  return db().prepare('SELECT * FROM students WHERE id = ?').get(id);
});

ipcMain.handle('students-create', async (_, data) => {
  const license = db().prepare('SELECT max_students FROM licenses WHERE school_id = 1 AND is_active = 1').get();
  const currentStudents = db().prepare('SELECT COUNT(*) as cnt FROM students WHERE dropped_at IS NULL').get();
  
  if (license && currentStudents.cnt >= license.max_students) {
    return { success: false, message: `Límite alcanzado: Has llegado al máximo de ${license.max_students} alumnos permitidos en tu plan.`, limit: license.max_students };
  }

  // Obtener el estatus activo por defecto
  const defaultStatus = db().prepare('SELECT id FROM student_statuses WHERE is_default = 1 LIMIT 1').get();
  const enrolledAt = data.enrolled_at || new Date().toISOString().slice(0, 10);
  const result = db().prepare(`
    INSERT INTO students (group_id, student_status_id, first_name, paternal_surname, maternal_surname, curp, email, phone, birth_date, gender, address, enrolled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.group_id, data.student_status_id || defaultStatus?.id, data.first_name, data.paternal_surname, data.maternal_surname,
    data.curp, data.email, data.phone, data.birth_date, data.gender, data.address, enrolledAt);

  const studentId = Number(result.lastInsertRowid);

  // Sincronizar calificaciones: minPass para normales, 0 para is_extra
  syncGradesForStudent(studentId);

  return { success: true, id: studentId };
});

ipcMain.handle('students-update', async (_, { id, data }) => {
  db().prepare(`
    UPDATE students SET first_name=?, paternal_surname=?, maternal_surname=?, curp=?, email=?, phone=?,
      birth_date=?, gender=?, address=?, student_status_id=?, enrolled_at=?, dropped_at=?, updated_at=datetime('now')
    WHERE id=?
  `).run(data.first_name, data.paternal_surname, data.maternal_surname, data.curp, data.email, data.phone,
    data.birth_date, data.gender, data.address, data.student_status_id, data.enrolled_at || null, data.dropped_at || null, id);
  return { success: true };
});

ipcMain.handle('students-delete', async (_, id) => {
  db().prepare('DELETE FROM students WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('students-bulk-delete', async (_, ids) => {
  const stmt = db().prepare('DELETE FROM students WHERE id = ?');
  const deleteAll = db().transaction((ids) => ids.forEach(id => stmt.run(id)));
  deleteAll(ids);
  return { success: true };
});

ipcMain.handle('students-bulk-status', async (_, { ids, statusId }) => {
  const droppedStatus = db().prepare('SELECT id FROM student_statuses WHERE name = "Baja" LIMIT 1').get();
  const isDropping = droppedStatus && droppedStatus.id == statusId;
  const stmt = db().prepare(`UPDATE students SET student_status_id = ?, dropped_at = ?, updated_at = datetime('now') WHERE id = ?`);
  const updateAll = db().transaction((ids) => {
    ids.forEach(id => stmt.run(statusId, isDropping ? new Date().toISOString().slice(0, 10) : null, id));
  });
  updateAll(ids);
  return { success: true };
});

ipcMain.handle('students-bulk-enrolled_at', async (_, { ids, enrolled_at }) => {
  const stmt = db().prepare(`UPDATE students SET enrolled_at = ?, updated_at = datetime('now') WHERE id = ?`);
  const updateAll = db().transaction((ids) => {
    ids.forEach(id => stmt.run(enrolled_at, id));
  });
  updateAll(ids);
  return { success: true };
});

ipcMain.handle('students-import', async (_, { groupId, students }) => {
  const defaultStatus = db().prepare('SELECT id FROM student_statuses WHERE is_default = 1 LIMIT 1').get();

  const stmt = db().prepare(`
    INSERT INTO students (group_id, student_status_id, first_name, paternal_surname, maternal_surname)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAll = db().transaction((students) => {
    let count = 0;
    students.forEach(s => {
      try {
        const res = stmt.run(groupId, defaultStatus?.id, s.first_name, s.paternal_surname, s.maternal_surname);
        const newStudentId = Number(res.lastInsertRowid);
        // Sincronizar calificaciones usando la función central (respeta is_extra)
        syncGradesForStudent(newStudentId);
        count++;
      } catch (e) { /* skip duplicates */ }
    });
    return count;
  });

  const count = insertAll(students);
  return { success: true, imported: count };
});

// ──────────────────────────────────────────────────────────────────────────────
// PLANTILLAS DE MATERIAS
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('subject-templates-get', async () => {
  const templates = db().prepare('SELECT * FROM subject_templates ORDER BY name').all();
  for (const t of templates) {
    const rawGroups = db().prepare('SELECT g.id, g.grade, g.name FROM subjects s JOIN groups g ON s.group_id = g.id WHERE s.subject_template_id = ?').all(t.id);
    t.assigned_groups_str = rawGroups.map(g => `${g.grade}° ${g.name}`).join(', ');
    t.group_ids = rawGroups.map(g => g.id);
  }
  return templates;
});

ipcMain.handle('subject-templates-create', async (_, data) => {
  const result = db().prepare('INSERT INTO subject_templates (school_id, name, color) VALUES (1, ?, ?)').run(data.name, data.color || '#6366f1');
  const templateId = Number(result.lastInsertRowid);
  
  if (data.group_ids && data.group_ids.length > 0) {
    for (const gid of data.group_ids) {
      db().prepare('INSERT INTO subjects (group_id, subject_template_id, name, color) VALUES (?, ?, ?, ?)').run(gid, templateId, data.name, data.color || '#6366f1');
    }
  }

  return { success: true, id: templateId };
});

ipcMain.handle('subject-templates-update', async (_, { id, data }) => {
  db().prepare(`UPDATE subject_templates SET name=?, color=?, updated_at=datetime('now') WHERE id=?`).run(data.name, data.color, id);
  db().prepare(`UPDATE subjects SET name=?, color=?, updated_at=datetime('now') WHERE subject_template_id=?`).run(data.name, data.color, id);
  if (Array.isArray(data.group_ids)) {
    const existing = db().prepare('SELECT group_id FROM subjects WHERE subject_template_id = ?').all(id).map(s => s.group_id);
    const toAdd = data.group_ids.filter((gid) => !existing.includes(gid));
    const toRemove = existing.filter((gid) => !data.group_ids.includes(gid));
    
    for (const gid of toRemove) {
      db().prepare('DELETE FROM subjects WHERE subject_template_id = ? AND group_id = ?').run(id, gid);
    }

    for (const gid of toAdd) {
      const subResult = db().prepare('INSERT INTO subjects (group_id, subject_template_id, name, color) VALUES (?, ?, ?, ?)').run(gid, id, data.name, data.color || '#6366f1');
      const newSubjectId = Number(subResult.lastInsertRowid);
      
      const sourceSubject = db().prepare('SELECT id FROM subjects WHERE subject_template_id = ? AND id != ? LIMIT 1').get(id, newSubjectId);
      if (sourceSubject) {
        const rubrics = db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ?').all(sourceSubject.id);
        for (const rub of rubrics) {
          const res = db().prepare('INSERT INTO evaluation_rubrics (subject_id, name, percentage, period_id, sort_order, is_extra) VALUES (?, ?, ?, ?, ?, ?)')
            .run(newSubjectId, rub.name, rub.percentage, rub.period_id, rub.sort_order, rub.is_extra);
          const newRubId = Number(res.lastInsertRowid);
          
          const activities = db().prepare('SELECT * FROM activities WHERE rubric_id = ?').all(rub.id);
          for (const act of activities) {
            db().prepare('INSERT INTO activities (rubric_id, name, period_id, sort_order) VALUES (?, ?, ?, ?)')
              .run(newRubId, act.name, act.period_id, act.sort_order);
          }
        }
      }
    }
  }

  return { success: true };
});

ipcMain.handle('subject-templates-delete', async (_, id) => {
  db().prepare('DELETE FROM subject_templates WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('subject-templates-assign', async (_, { groupId, templateId }) => {
  const template = db().prepare('SELECT * FROM subject_templates WHERE id = ?').get(templateId);
  if (!template) return { success: false };
  // Verificar si ya existe
  const existing = db().prepare('SELECT id FROM subjects WHERE group_id = ? AND subject_template_id = ?').get(groupId, templateId);
  if (!existing) {
    db().prepare('INSERT INTO subjects (group_id, subject_template_id, name, color) VALUES (?, ?, ?, ?)').run(groupId, templateId, template.name, template.color);
  }
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// EVALUACIÓN
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('evaluation-get-subjects', async (_, groupId) => {
  return db().prepare('SELECT * FROM subjects WHERE group_id = ? ORDER BY name').all(groupId);
});

ipcMain.handle('evaluation-get-data', async (_, { groupId, subjectId }) => {
  const subject = db().prepare('SELECT * FROM subjects WHERE id = ? AND group_id = ?').get(subjectId, groupId);
  if (!subject) return null;

  const group = db().prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return null;

  const trimesters = db().prepare('SELECT * FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(group.school_cycle_id);

  const now = new Date();
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const students = db().prepare(`
    SELECT s.*, ss.name as status_name, ss.color as status_color,
           (SELECT status FROM attendances WHERE student_id = s.id AND date = ?) as today_attendance
    FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all(today, groupId);

  const rubrics = db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ? ORDER BY period_id, sort_order').all(subjectId);

  const activitiesStmt = db().prepare('SELECT * FROM activities WHERE rubric_id = ? ORDER BY sort_order');
  const gradesStmt = db().prepare('SELECT g.* FROM grades g JOIN activities a ON g.activity_id = a.id JOIN evaluation_rubrics r ON a.rubric_id = r.id WHERE r.subject_id = ?');

  const allGrades = gradesStmt.all(subjectId);
  const gradeMap = {};
  allGrades.forEach(g => {
    if (!gradeMap[g.student_id]) gradeMap[g.student_id] = {};
    gradeMap[g.student_id][g.activity_id] = g.score;
  });

  const rubricsWithActivities = rubrics.map(r => ({
    ...r,
    activities: activitiesStmt.all(r.id),
  }));

  const gradingConfig = db().prepare('SELECT setting_max_score, setting_min_pass FROM schools LIMIT 1').get();

  // Cargar ajustes de orden y zoom
  const settings = db().prepare('SELECT * FROM grades_settings WHERE subject_id = ?').all(subjectId);

  return { subject, group, students, trimesters, rubrics: rubricsWithActivities, grades: gradeMap, grading_config: gradingConfig, settings };
});

ipcMain.handle('evaluation-save-grades', async (_, data) => {
  // data: { grades: [{ student_id, activity_id, score }] }
  const upsert = db().prepare(`
    INSERT INTO grades (student_id, activity_id, score) VALUES (?, ?, ?)
    ON CONFLICT(student_id, activity_id) DO UPDATE SET score = excluded.score, updated_at = datetime('now')
  `);
  const saveAll = db().transaction((grades) => {
    grades.forEach(g => upsert.run(g.student_id, g.activity_id, g.score));
  });
  saveAll(data.grades);
  return { success: true };
});

ipcMain.handle('evaluation-save-settings', async (_, { subjectId, settings }) => {
  // settings: [{ period_id, column_layout, zoom_level }]
  const upsert = db().prepare(`
    INSERT INTO grades_settings (subject_id, period_id, column_layout, zoom_level)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(subject_id, period_id) DO UPDATE SET
      column_layout = excluded.column_layout,
      zoom_level = excluded.zoom_level
  `);

  const saveAll = db().transaction((items) => {
    items.forEach(item => {
      upsert.run(subjectId, item.period_id, item.column_layout, item.zoom_level);
    });
  });

  saveAll(settings);
  return { success: true };
});

ipcMain.handle('evaluation-create-rubric', async (_, data) => {
  const result = db().prepare(`INSERT INTO evaluation_rubrics (subject_id, name, percentage, period_id, sort_order, is_extra) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(data.subject_id, data.name, data.percentage || 0, data.period_id || 1, data.sort_order || 0, data.is_extra ? 1 : 0);
  return { success: true, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('evaluation-move-rubric', async (_, { rubricId, direction }) => {
  const rubric = db().prepare('SELECT * FROM evaluation_rubrics WHERE id = ?').get(rubricId);
  if (!rubric) return { success: false };

  const otherRubric = db().prepare(`
    SELECT * FROM evaluation_rubrics 
    WHERE subject_id = ? AND period_id = ? 
    AND sort_order ${direction === 'left' ? '<' : '>'} ?
    ORDER BY sort_order ${direction === 'left' ? 'DESC' : 'ASC'}
    LIMIT 1
  `).get(rubric.subject_id, rubric.period_id, rubric.sort_order);

  if (otherRubric) {
    db().prepare('UPDATE evaluation_rubrics SET sort_order = ? WHERE id = ?').run(otherRubric.sort_order, rubric.id);
    db().prepare('UPDATE evaluation_rubrics SET sort_order = ? WHERE id = ?').run(rubric.sort_order, otherRubric.id);
  } else {
    // Si no hay otro pero queremos moverlo, simplemente ajustamos el sort_order para que sea relativo
    const offset = direction === 'left' ? -1 : 1;
    db().prepare('UPDATE evaluation_rubrics SET sort_order = sort_order + ? WHERE id = ?').run(offset, rubric.id);
  }
  return { success: true };
});

ipcMain.handle('evaluation-delete-rubric', async (_, name) => {
  db().prepare('DELETE FROM evaluation_rubrics WHERE name = ?').run(name);
  return { success: true };
});

ipcMain.handle('evaluation-update-rubric', async (_, { oldName, data }) => {
  db().prepare(`
    UPDATE evaluation_rubrics 
    SET name = ?, percentage = ?, is_extra = ?, updated_at = datetime('now')
    WHERE name = ?
  `).run(data.name, data.percentage, data.is_extra ? 1 : 0, oldName);
  return { success: true };
});

ipcMain.handle('evaluation-create-activity', async (_, data) => {
  const result = db().prepare('INSERT INTO activities (rubric_id, name, period_id, sort_order) VALUES (?, ?, ?, ?)')
    .run(data.rubric_id, data.name, data.period_id || 1, data.sort_order || 0);
  const activityId = Number(result.lastInsertRowid);

  // Sincronizar calificaciones para todos los alumnos del grupo (respeta is_extra)
  syncGradesForActivity(activityId);

  return { success: true, id: activityId };
});

ipcMain.handle('evaluation-move-activity', async (_, { activityId, direction }) => {
  const activity = db().prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
  if (!activity) return { success: false };

  const otherActivity = db().prepare(`
    SELECT * FROM activities 
    WHERE rubric_id = ? 
    AND sort_order ${direction === 'left' ? '<' : '>'} ?
    ORDER BY sort_order ${direction === 'left' ? 'DESC' : 'ASC'}
    LIMIT 1
  `).get(activity.rubric_id, activity.sort_order);

  if (otherActivity) {
    db().prepare('UPDATE activities SET sort_order = ? WHERE id = ?').run(otherActivity.sort_order, activity.id);
    db().prepare('UPDATE activities SET sort_order = ? WHERE id = ?').run(activity.sort_order, otherActivity.id);
  } else {
    const offset = direction === 'left' ? -1 : 1;
    db().prepare('UPDATE activities SET sort_order = sort_order + ? WHERE id = ?').run(offset, activity.id);
  }
  return { success: true };
});

ipcMain.handle('evaluation-delete-activity', async (_, name) => {
  db().prepare('DELETE FROM activities WHERE name = ?').run(name);
  return { success: true };
});

ipcMain.handle('evaluation-update-activity', async (_, { oldName, data }) => {
  db().prepare(`
    UPDATE activities 
    SET name = ?, updated_at = datetime('now')
    WHERE name = ?
  `).run(data.name, oldName);
  return { success: true };
});

ipcMain.handle('evaluation-update-rubric-full', async (_, { oldName, data }) => {
  const transaction = db().transaction(() => {
    const existing = db().prepare(`SELECT id, subject_id, period_id FROM evaluation_rubrics WHERE name = ?`).all(oldName);
    const targets = [];
    
    for (const gid of data.group_ids) {
      const subs = db().prepare(`
        SELECT id, name 
        FROM subjects 
        WHERE group_id = ?
      `).all(gid);
      const filtered = subs.filter(su => data.subject_names.includes(su.name));
      for (const su of filtered) {
        for (const pid of data.period_ids) {
          targets.push({ subject_id: su.id, period_id: pid });
        }
      }
    }

    for (const old of existing) {
      const match = targets.find(t => t.subject_id === old.subject_id && t.period_id === old.period_id);
      if (match) {
        db().prepare(`UPDATE evaluation_rubrics SET name=?, percentage=?, is_extra=? WHERE id=?`)
          .run(data.name, data.percentage, data.is_extra ? 1 : 0, old.id);
        match._handled = true;
      } else {
        db().prepare(`DELETE FROM evaluation_rubrics WHERE id=?`).run(old.id);
      }
    }

    for (const t of targets) {
      if (!t._handled) {
        db().prepare(`INSERT INTO evaluation_rubrics (subject_id, name, percentage, period_id, is_extra) VALUES (?, ?, ?, ?, ?)`)
          .run(t.subject_id, data.name, data.percentage, t.period_id, data.is_extra ? 1 : 0);
      }
    }
  });

  transaction();
  return { success: true };
});

ipcMain.handle('evaluation-update-activity-full', async (_, { oldName, data }) => {
  const transaction = db().transaction(() => {
    const existing = db().prepare(`SELECT id, rubric_id, period_id FROM activities WHERE name = ?`).all(oldName);
    const targets = [];
    
    for (const gid of data.group_ids) {
      const subs = db().prepare(`
        SELECT id, name 
        FROM subjects 
        WHERE group_id = ?
      `).all(gid);
      const filtered = subs.filter(su => data.subject_names.includes(su.name));
      for (const su of filtered) {
        for (const pid of data.period_ids) {
          const rubric = db().prepare(`SELECT id FROM evaluation_rubrics WHERE subject_id = ? AND period_id = ? AND name = ?`).get(su.id, pid, data.rubric_name);
          if (rubric) {
             targets.push({ rubric_id: rubric.id, period_id: pid });
          }
        }
      }
    }

    for (const old of existing) {
      const match = targets.find(t => t.rubric_id === old.rubric_id && t.period_id === old.period_id);
      if (match) {
        db().prepare(`UPDATE activities SET name=? WHERE id=?`).run(data.name, old.id);
        match._handled = true;
      } else {
        db().prepare(`DELETE FROM activities WHERE id=?`).run(old.id);
      }
    }

    for (const t of targets) {
      if (!t._handled) {
        const result = db().prepare(`INSERT INTO activities (rubric_id, name, period_id) VALUES (?, ?, ?)`).run(t.rubric_id, data.name, t.period_id);
        const activityId = Number(result.lastInsertRowid);
        
        // Insertar calificación mínima por defecto
        try {
          const rubric = db().prepare('SELECT subject_id FROM evaluation_rubrics WHERE id = ?').get(t.rubric_id);
          if (rubric) {
            const subject = db().prepare('SELECT group_id FROM subjects WHERE id = ?').get(rubric.subject_id);
            if (subject) {
              const config = db().prepare('SELECT setting_min_pass FROM schools LIMIT 1').get();
              const minGrade = config ? (config.setting_min_pass ?? 6) : 6;
              const students = db().prepare('SELECT id FROM students WHERE group_id = ?').all(subject.group_id);
              const insertGrade = db().prepare('INSERT OR IGNORE INTO grades (student_id, activity_id, score) VALUES (?, ?, ?)');
              for (const s of students) {
                insertGrade.run(s.id, activityId, minGrade);
              }
            }
          }
        } catch (err) {
          console.error('Error in default grades insert (batch):', err);
        }
      }
    }
  });

  transaction();
  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// PLANTILLAS DE EVALUACIÓN
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('eval-templates-get', async () => {
  const templates = db().prepare('SELECT * FROM evaluation_templates ORDER BY name').all();
  const activitiesStmt = db().prepare('SELECT * FROM activity_templates WHERE evaluation_template_id = ? ORDER BY sort_order');
  return templates.map(t => ({ ...t, activities: activitiesStmt.all(t.id) }));
});

ipcMain.handle('eval-templates-create', async (_, data) => {
  const result = db().prepare('INSERT INTO evaluation_templates (school_id, name) VALUES (1, ?)').run(data.name);
  return { success: true, id: Number(result.lastInsertRowid) };
});

ipcMain.handle('eval-templates-update', async (_, { id, data }) => {
  db().prepare(`UPDATE evaluation_templates SET name=?, updated_at=datetime('now') WHERE id=?`).run(data.name, id);
  return { success: true };
});

ipcMain.handle('eval-templates-delete', async (_, id) => {
  db().prepare('DELETE FROM evaluation_templates WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('eval-templates-assign', async (_, { groupId, templateId }) => {
  // Asignar plantilla a todas las materias del grupo
  const subjects = db().prepare('SELECT id FROM subjects WHERE group_id = ?').all(groupId);
  const template = db().prepare('SELECT * FROM evaluation_templates WHERE id = ?').get(templateId);
  if (!template) return { success: false };
  const activities = db().prepare('SELECT * FROM activity_templates WHERE evaluation_template_id = ? ORDER BY sort_order').all(templateId);

  const group = db().prepare('SELECT current_period FROM groups WHERE id = ?').get(groupId);
  const period = group?.current_period || 1;

  subjects.forEach(subject => {
    const rubricResult = db().prepare('INSERT INTO evaluation_rubrics (subject_id, evaluation_template_id, name, percentage, period_id, sort_order) VALUES (?, ?, ?, ?, ?, 0)')
      .run(subject.id, templateId, template.name, 100, period);
    const rubricId = Number(rubricResult.lastInsertRowid);
    activities.forEach((a, idx) => {
      db().prepare('INSERT INTO activities (rubric_id, activity_template_id, name, period_id, sort_order) VALUES (?, ?, ?, ?, ?)')
        .run(rubricId, a.id, a.name, period, idx);
    });
  });

  return { success: true };
});

// ──────────────────────────────────────────────────────────────────────────────
// ASISTENCIA
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('attendance-get-groups', async () => {
  const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
  return db().prepare(`
    SELECT g.*, 
      (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id AND s.student_status_id != (SELECT id FROM student_statuses WHERE name='Baja' LIMIT 1)) as students_count,
      (SELECT COUNT(*) FROM attendances a WHERE a.group_id = g.id AND a.date = date('now', 'localtime')) as taken_today
    FROM groups g WHERE g.archived_at IS NULL ORDER BY g.grade, g.name
  `).all();
});

ipcMain.handle('attendance-get-for-date', async (_, { groupId, date }) => {
  const students = db().prepare(`
    SELECT s.*, ss.name as status_name, ss.color as status_color
    FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all(groupId);

  const attendances = db().prepare('SELECT * FROM attendances WHERE group_id = ? AND date = ?').all(groupId, date);
  const attMap = {};
  attendances.forEach(a => { attMap[a.student_id] = a.status; });

  return students.map(s => ({
    ...s,
    attendance_status: attMap[s.id] || 'present',
  }));
});

ipcMain.handle('attendance-save', async (_, data) => {
  // data: { group_id, date, attendances: [{student_id, status}] }
  const upsert = db().prepare(`
    INSERT INTO attendances (student_id, group_id, date, status) VALUES (?, ?, ?, ?)
    ON CONFLICT(student_id, group_id, date) DO UPDATE SET status = excluded.status, updated_at = datetime('now')
  `);
  const saveAll = db().transaction((records) => {
    records.forEach(r => upsert.run(r.student_id, data.group_id, data.date, r.status));
  });
  saveAll(data.attendances);
  return { success: true };
});

ipcMain.handle('attendance-update', async (_, { id, data }) => {
  db().prepare(`UPDATE attendances SET status=?, notes=?, updated_at=datetime('now') WHERE id=?`).run(data.status, data.notes, id);
  return { success: true };
});

ipcMain.handle('attendance-report', async (_, filters = {}) => {
  let query = `
    SELECT a.*, s.first_name, s.paternal_surname, s.maternal_surname,
      g.name as group_name, g.grade as group_grade, g.shift,
      ss.name as status_name
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    JOIN groups g ON a.group_id = g.id
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE 1=1
  `;
  const params = [];
  if (filters.group_id) { query += ' AND a.group_id = ?'; params.push(filters.group_id); }
  if (filters.date_from) { query += ' AND a.date >= ?'; params.push(filters.date_from); }
  if (filters.date_to) { query += ' AND a.date <= ?'; params.push(filters.date_to); }
  if (filters.turno) { query += ' AND g.shift = ?'; params.push(filters.turno); }
  
  query += ' ORDER BY a.date ASC, s.paternal_surname';
  return db().prepare(query).all(...params);
});

ipcMain.handle('attendance-export', async (_, data) => {
  // data contiene el objeto del reporte para generar XLSX
  // La exportación real la maneja el renderer con xlsx
  return { success: true, data };
});

// ──────────────────────────────────────────────────────────────────────────────
// REPORTES
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('reports-get-data', async (_, filters = {}) => {
  let query = `
    SELECT s.*, ss.name as status_name, ss.color as status_color,
      g.name as group_name, g.grade as group_grade, g.cycle as group_cycle, g.current_period
    FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    LEFT JOIN groups g ON s.group_id = g.id
    WHERE g.archived_at IS NULL
  `;
  const params = [];
  if (filters.group_id) { query += ' AND s.group_id = ?'; params.push(filters.group_id); }
  if (filters.name) { 
    query += ' AND (s.first_name LIKE ? OR s.paternal_surname LIKE ? OR s.maternal_surname LIKE ?)';
    params.push(`%${filters.name}%`, `%${filters.name}%`, `%${filters.name}%`);
  }
  query += ' ORDER BY g.grade, g.name, s.paternal_surname, s.first_name';
  return db().prepare(query).all(...params);
});

ipcMain.handle('reports-statistics', async (_, filters = {}) => {
  const groups = db().prepare('SELECT * FROM groups WHERE archived_at IS NULL').all();
  return { groups };
});

ipcMain.handle('reports-eval-stats', async (_, filters = {}) => {
  // Estadística de evaluación por grupo/materia/período
  const { group_id, subject_id, period } = filters;
  if (!group_id || !subject_id) return { rows: [], totals: {} };

  const students = db().prepare(`
    SELECT s.*, ss.name as status_name FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.first_name
  `).all(group_id);

  const rubrics = db().prepare('SELECT * FROM evaluation_rubrics WHERE subject_id = ? AND period_id = ? ORDER BY sort_order').all(subject_id, period || 1);
  const rows = [];

  students.forEach(student => {
    const studentGrades = {};
    let totalScore = 0;
    let rubricCount = 0;

    rubrics.forEach(rubric => {
      const activities = db().prepare('SELECT * FROM activities WHERE rubric_id = ?').all(rubric.id);
      let rubricScore = 0;
      let activityCount = 0;
      activities.forEach(activity => {
        const grade = db().prepare('SELECT score FROM grades WHERE student_id = ? AND activity_id = ?').get(student.id, activity.id);
        if (grade) {
          rubricScore += grade.score;
          activityCount++;
        }
      });
      const avg = activityCount > 0 ? rubricScore / activityCount : 0;
      studentGrades[rubric.id] = avg;
      totalScore += avg * (rubric.percentage / 100);
      rubricCount++;
    });

    rows.push({ ...student, grades: studentGrades, total: Math.round(totalScore * 10) / 10 });
  });

  return { rows, rubrics };
});

ipcMain.handle('reports-export', async (_, data) => {
  return { success: true, data };
});

// ──────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN (INDICADORES / SEMÁFORO)
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('config-get-indicators', async () => {
  return db().prepare('SELECT * FROM performance_indicators ORDER BY sort_order').all();
});

ipcMain.handle('config-update-indicators', async (_, data) => {
  const stmt = db().prepare(`UPDATE performance_indicators SET label=?, min_value=?, max_value=?, color=? WHERE id=?`);
  const insertStmt = db().prepare(`INSERT INTO performance_indicators (school_id, label, min_value, max_value, color, sort_order) VALUES (1, ?, ?, ?, ?, ?)`);
  const saveAll = db().transaction((indicators) => {
    indicators.forEach((ind, idx) => {
      if (ind.id) {
        stmt.run(ind.label, ind.min_value, ind.max_value, ind.color, ind.id);
      } else {
        insertStmt.run(ind.label, ind.min_value, ind.max_value, ind.color, idx);
      }
    });
  });
  saveAll(data);
  return { success: true };
});

ipcMain.handle('config-get-grading', async () => {
  return db().prepare('SELECT setting_max_score, setting_min_pass, setting_periods FROM schools LIMIT 1').get();
});

ipcMain.handle('config-update-grading', async (_, data) => {
  db().prepare(`UPDATE schools SET setting_max_score=?, setting_min_pass=?, setting_periods=?, updated_at=datetime('now') WHERE id=1`)
    .run(data.setting_max_score, data.setting_min_pass, data.setting_periods);
  return { success: true };
});

// ── EQUIPOS ─────────────────────────────────
ipcMain.handle('teams-get-all-configured', async () => {
  return db().prepare(`
    SELECT DISTINCT a.id as activity_id, a.name as activity_name, a.period_id,
           r.id as rubric_id, r.name as rubric_name,
           s.id as subject_id, s.name as subject_name,
           g.name as group_name, g.grade as group_grade, g.id as group_id, g.cycle
    FROM teams t
    JOIN activities a ON t.activity_id = a.id
    JOIN evaluation_rubrics r ON a.rubric_id = r.id
    JOIN subjects s ON r.subject_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE t.team_number > 0
    ORDER BY g.grade, g.name, s.name, a.period_id
  `).all();
});

ipcMain.handle('teams-get-by-activity', async (_, { activityId, groupId }) => {
  const now = new Date();
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const students = db().prepare(`
    SELECT s.id as student_id, s.first_name, s.paternal_surname, s.maternal_surname,
           t.team_number, t.comments, t.topic,
           st.name as status_name, st.color as status_color,
           (SELECT score FROM grades WHERE student_id = s.id AND activity_id = ?) as activity_score,
           (SELECT status FROM attendances WHERE student_id = s.id AND date = ?) as today_attendance
    FROM students s
    LEFT JOIN student_statuses st ON s.student_status_id = st.id
    LEFT JOIN teams t ON s.id = t.student_id AND t.activity_id = ?
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all(activityId, today, activityId, groupId);
  return students;
});

ipcMain.handle('teams-save', async (_, { activityId, teamsData }) => {
  const upsert = db().prepare(`
    INSERT INTO teams (activity_id, student_id, team_number, comments, topic) 
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(activity_id, student_id) 
    DO UPDATE SET team_number = excluded.team_number, comments = excluded.comments, topic = excluded.topic, updated_at = datetime('now')
  `);
  const transaction = db().transaction((records) => {
    records.forEach(r => upsert.run(activityId, r.student_id, r.team_number, r.comments, r.topic));
  });
  transaction(teamsData);
  return { success: true };
});

ipcMain.handle('teams-delete-by-activity', async (_, { activityId }) => {
  db().prepare('DELETE FROM teams WHERE activity_id = ?').run(activityId);
  return { success: true };
});

// ── ACTIVIDADES INTERGRUPALES ─────────────────────────────────
// Las actividades intergrupales usan la misma tabla teams pero pueden abarcar múltiples grupos
ipcMain.handle('intergroup-get-all', async () => {
  const activities = db().prepare(`
    SELECT DISTINCT a.id as activity_id, a.name as activity_name, a.period_id,
           r.id as rubric_id, r.name as rubric_name,
           s.id as subject_id, s.name as subject_name,
           GROUP_CONCAT(DISTINCT g.name || ' (' || g.grade || '°)') as groups_info,
           JSON_GROUP_ARRAY(DISTINCT g.id) as group_ids
    FROM teams t
    JOIN activities a ON t.activity_id = a.id
    JOIN evaluation_rubrics r ON a.rubric_id = r.id
    JOIN subjects s ON r.subject_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE t.team_number > 0
    GROUP BY a.id, r.id, s.id
    ORDER BY s.name, a.name
  `).all();

  // Parsear group_ids de JSON a array
  return activities.map(a => ({
    ...a,
    group_ids: JSON.parse(a.group_ids)
  }));
});

ipcMain.handle('intergroup-get-by-activity', async (_, { activityId, groupIds }) => {
  const now = new Date();
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  // Obtener estudiantes de todos los grupos seleccionados
  const groupIdList = Array.isArray(groupIds) ? groupIds.join(',') : groupIds;
  const students = db().prepare(`
    SELECT s.id as student_id, s.first_name, s.paternal_surname, s.maternal_surname,
           s.group_id, g.name as group_name,
           t.team_number, t.comments, t.topic,
           st.name as status_name, st.color as status_color,
           (SELECT score FROM grades WHERE student_id = s.id AND activity_id = ?) as activity_score,
           (SELECT status FROM attendances WHERE student_id = s.id AND date = ?) as today_attendance
    FROM students s
    JOIN groups g ON s.group_id = g.id
    LEFT JOIN student_statuses st ON s.student_status_id = st.id
    LEFT JOIN teams t ON s.id = t.student_id AND t.activity_id = ?
    WHERE s.group_id IN (${groupIdList.split(',').map(() => '?').join(',')})
    ORDER BY g.name, s.paternal_surname, s.maternal_surname, s.first_name
  `).all(activityId, today, activityId, ...groupIds);

  return students;
});

ipcMain.handle('intergroup-save', async (_, { activityId, teamsData }) => {
  const upsert = db().prepare(`
    INSERT INTO teams (activity_id, student_id, team_number, comments, topic)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(activity_id, student_id)
    DO UPDATE SET team_number = excluded.team_number, comments = excluded.comments, topic = excluded.topic, updated_at = datetime('now')
  `);
  const transaction = db().transaction((records) => {
    records.forEach(r => upsert.run(activityId, r.student_id, r.team_number, r.comments, r.topic));
  });
  transaction(teamsData);
  return { success: true };
});

ipcMain.handle('intergroup-delete-by-activity', async (_, { activityId }) => {
  db().prepare('DELETE FROM teams WHERE activity_id = ?').run(activityId);
  return { success: true };
});

ipcMain.handle('students-get-by-group', async (_, groupId) => {
  return db().prepare(`
    SELECT s.id as student_id, s.first_name, s.paternal_surname, s.maternal_surname,
           s.group_id, g.name as group_name,
           st.name as status_name, st.color as status_color
    FROM students s
    JOIN groups g ON s.group_id = g.id
    LEFT JOIN student_statuses st ON s.student_status_id = st.id
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all(groupId);
});

// ──────────────────────────────────────────────────────────────────────────────
// BASE DE DATOS — EXPORT / IMPORT
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('db-export', async (_, destPath) => {
  try {
    await exportDatabase(destPath);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('db-import', async (_, srcPath) => {
  try {
    importDatabase(srcPath);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('db-info', async () => {
  const dbPath = getDatabasePath();
  const stats = fs.statSync(dbPath);
  return {
    path: dbPath,
    size: stats.size,
    modified: stats.mtime,
  };
});

// ── VISTA DE LA BASE DE DATOS (Admin Explorer) ─────────────────────────────
ipcMain.handle('db-explorer-tables', async () => {
  try {
    const tables = db().prepare(`
      SELECT name, type 
      FROM sqlite_master 
      WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `).all();

    return tables.map(t => {
      const count = db().prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
      return { name: t.name, type: t.type, count: count?.c ?? 0 };
    });
  } catch (err) {
    return [];
  }
});

ipcMain.handle('db-explorer-columns', async (_, tableName) => {
  try {
    const cols = db().prepare(`PRAGMA table_info("${tableName}")`).all();
    return cols;
  } catch (err) {
    return [];
  }
});

ipcMain.handle('db-explorer-records', async (_, { tableName, page = 1, pageSize = 50, search = '' }) => {
  try {
    const offset = (page - 1) * pageSize;
    const cols = db().prepare(`PRAGMA table_info("${tableName}")`).all();

    let whereClause = '';
    const params = [];

    if (search && search.trim() !== '' && cols.length > 0) {
      const textCols = cols.filter(c =>
        ['TEXT', 'VARCHAR', 'CHAR', 'CLOB', ''].some(t => c.type.toUpperCase().includes(t))
      );
      if (textCols.length > 0) {
        const conditions = textCols.map(c => `CAST("${c.name}" AS TEXT) LIKE ?`);
        whereClause = `WHERE ${conditions.join(' OR ')}`;
        textCols.forEach(() => params.push(`%${search}%`));
      }
    }

    const totalRow = db().prepare(`SELECT COUNT(*) as c FROM "${tableName}" ${whereClause}`).get(...params);
    const total = totalRow?.c ?? 0;

    const rows = db().prepare(
      `SELECT * FROM "${tableName}" ${whereClause} LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    return {
      columns: cols.map(c => c.name),
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (err) {
    return { columns: [], rows: [], total: 0, page: 1, pageSize: 50, totalPages: 0, error: err.message };
  }
});


// ── SEGUIMIENTO DE PDA ──────────────────────
ipcMain.handle('pda-save', async (_, { pda, groups, sessions, tracking }) => {
  console.log('[PDA Save] Datos recibidos:', { pda, groups, sessionsCount: sessions?.length, trackingKeys: Object.keys(tracking || {}) });
  const transaction = db().transaction(() => {
    let pdaId = pda.id;
    if (pdaId) {
      db().prepare('UPDATE pdas SET topic=?, subject_name=?, num_sessions=?, updated_at=datetime(\'now\') WHERE id=?')
        .run(pda.topic, pda.subject_name, pda.num_sessions, pdaId);
    } else {
      const res = db().prepare('INSERT INTO pdas (topic, subject_name, num_sessions) VALUES (?, ?, ?)')
        .run(pda.topic, pda.subject_name, pda.num_sessions);
      pdaId = Number(res.lastInsertRowid);
    }

    // Grupos vinculados
    db().prepare('DELETE FROM pda_groups WHERE pda_id = ?').run(pdaId);
    const insertGroup = db().prepare('INSERT INTO pda_groups (pda_id, group_id) VALUES (?, ?)');
    groups.forEach(gid => insertGroup.run(pdaId, gid));

    // Sesiones
    // Al guardar, re-sincronizamos sesiones. Si el num_sessions cambió, borramos las que sobran o agregamos las faltantes.
    // O simplemente borramos y re-insertamos si el volumen es bajo (lo es).
    db().prepare('DELETE FROM pda_sessions WHERE pda_id = ?').run(pdaId);
    const insertSession = db().prepare('INSERT INTO pda_sessions (pda_id, session_number, activity, observations) VALUES (?, ?, ?, ?)');
    
    sessions.forEach(s => {
      const res = insertSession.run(pdaId, s.session_number, s.activity, s.observations);
      const sessionId = Number(res.lastInsertRowid);
      
      // Tracking para esta sesión
      if (tracking && tracking[s.session_number]) {
        const insertTracking = db().prepare('INSERT INTO pda_session_tracking (pda_session_id, group_id, start_date, end_date) VALUES (?, ?, ?, ?)');
        Object.entries(tracking[s.session_number]).forEach(([gid, t]) => {
          insertTracking.run(sessionId, Number(gid), t.start_date, t.end_date);
        });
      }
    });

    return pdaId;
  });

  try {
    const id = transaction();
    return { success: true, id };
  } catch (e) {
    console.error('[PDA Save Error]', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('pda-get-all', async () => {
  const pdas = db().prepare('SELECT * FROM pdas ORDER BY updated_at DESC').all();
  for (const p of pdas) {
    p.groups = db().prepare('SELECT group_id FROM pda_groups WHERE pda_id = ?').all(p.id).map(g => g.group_id);
    p.sessions = db().prepare('SELECT * FROM pda_sessions WHERE pda_id = ? ORDER BY session_number').all(p.id);
    p.tracking = {}; // { session_num: { group_id: { start_date, end_date } } }
    for (const s of p.sessions) {
      const tracks = db().prepare('SELECT * FROM pda_session_tracking WHERE pda_session_id = ?').all(s.id);
      p.tracking[s.session_number] = {};
      tracks.forEach(t => {
        p.tracking[s.session_number][t.group_id] = { start_date: t.start_date, end_date: t.end_date };
      });
    }
  }
  return pdas;
});

ipcMain.handle('pda-delete', async (_, id) => {
  db().prepare('DELETE FROM pdas WHERE id = ?').run(id);
  return { success: true };
});

// ────────────────────────────────────────────────────────────────────────────────
// CAMBIAR RUTA DE BASE DE DATOS
// ────────────────────────────────────────────────────────────────────────────────
ipcMain.handle('db-change-path', async (_, newPath) => {
  try {
    await changeDatabase(newPath);
    return { success: true, path: newPath };
  } catch (e) {
    console.error('[DB] Error al cambiar ruta:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('delete-attendance-for-date', async (_, { groupId, date }) => {
  try {
    db().prepare(`DELETE FROM attendances WHERE group_id = ? AND date = ?`).run(groupId, date);
    return { success: true };
  } catch(e) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('db-reset-path', async () => {
  try {
    clearCustomDbPath();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// IMPORTAR / EXPORTAR PERFIL DE USUARIO
// ────────────────────────────────────────────────────────────────────────────────
function exportProfileData() {
  const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
  if (!session) throw new Error('No hay sesión activa.');
  const userId = session.user_id;

  const profile = { user: userId, groups: [], students: [], subjects: [], rubrics: [], activities: [], grades: [], attendances: [] };

  profile.groups = db().prepare('SELECT * FROM groups WHERE user_id = ? AND archived_at IS NULL').all(userId);
  const groupIds = profile.groups.map(g => g.id);
  
  if (groupIds.length > 0) {
    const bindVars = groupIds.map(() => '?').join(',');
    
    profile.students = db().prepare(`SELECT * FROM students WHERE group_id IN (${bindVars})`).all(...groupIds);
    profile.subjects = db().prepare(`SELECT * FROM subjects WHERE group_id IN (${bindVars})`).all(...groupIds);
    profile.attendances = db().prepare(`SELECT * FROM attendances WHERE group_id IN (${bindVars})`).all(...groupIds);
    
    const subjectIds = profile.subjects.map(s => s.id);
    if (subjectIds.length > 0) {
      const subBind = subjectIds.map(() => '?').join(',');
      profile.rubrics = db().prepare(`SELECT * FROM evaluation_rubrics WHERE subject_id IN (${subBind})`).all(...subjectIds);
      
      const rubricIds = profile.rubrics.map(r => r.id);
      if (rubricIds.length > 0) {
        const rubBind = rubricIds.map(() => '?').join(',');
        profile.activities = db().prepare(`SELECT * FROM activities WHERE rubric_id IN (${rubBind})`).all(...rubricIds);
        
        const activityIds = profile.activities.map(a => a.id);
        if (activityIds.length > 0) {
          const actBind = activityIds.map(() => '?').join(',');
          profile.grades = db().prepare(`SELECT * FROM grades WHERE activity_id IN (${actBind})`).all(...activityIds);
        }
      }
    }
  }

  return profile;
}

// Exporta todos los datos asociados al usuario activo en la sesión
ipcMain.handle('profile-export', async (_, { destPath }) => {
  try {
    const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
    if (!session) return { success: false, message: 'No hay sesión activa.' };
    const userId = session.user_id;

    const profile = exportProfileData();

    fs.writeFileSync(destPath, JSON.stringify(profile, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    console.error('[Profile Export]', e);
    return { success: false, message: e.message };
  }
});

// Importa un perfil de usuario (solo los datos activos del archivo)
ipcMain.handle('profile-import', async (_, { srcPath }) => {
  try {
    const raw = fs.readFileSync(srcPath, 'utf8');
    const profile = JSON.parse(raw);
    if (!profile.user || !Array.isArray(profile.groups)) {
      return { success: false, message: 'Formato de perfil inválido.' };
    }

    const session = db().prepare('SELECT user_id FROM active_session WHERE id = 1').get();
    if (!session) return { success: false, message: 'No hay sesión activa.' };
    const currentUserId = session.user_id;

    // Mapa de IDs originales -> nuevos
    const groupIdMap = {};
    const studentIdMap = {};
    const subjectIdMap = {};
    const rubricIdMap = {};
    const activityIdMap = {};

    const importTx = db().transaction(() => {
      // Insertar grupos
      for (const g of profile.groups) {
        const res = db().prepare(
          `INSERT INTO groups (user_id, school_id, cycle, name, grade, shift, current_period) VALUES (?, 1, ?, ?, ?, ?, ?)`
        ).run(currentUserId, g.cycle, g.name + ' [Importado]', g.grade, g.shift || 'matutino', g.current_period || 1);
        groupIdMap[g.id] = Number(res.lastInsertRowid);
      }
      // Insertar alumnos
      for (const s of (profile.students || [])) {
        const newGroupId = groupIdMap[s.group_id];
        if (!newGroupId) continue;
        const defaultStatus = db().prepare('SELECT id FROM student_statuses WHERE is_default = 1 LIMIT 1').get();
        const res = db().prepare(
          `INSERT INTO students (group_id, student_status_id, first_name, paternal_surname, maternal_surname, curp, email, phone, birth_date, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(newGroupId, s.student_status_id || defaultStatus?.id, s.first_name, s.paternal_surname, s.maternal_surname, s.curp, s.email, s.phone, s.birth_date, s.gender);
        studentIdMap[s.id] = Number(res.lastInsertRowid);
      }
      // Insertar materias
      for (const sub of (profile.subjects || [])) {
        const newGroupId = groupIdMap[sub.group_id];
        if (!newGroupId) continue;
        const res = db().prepare(
          `INSERT INTO subjects (group_id, name, color) VALUES (?, ?, ?)`
        ).run(newGroupId, sub.name, sub.color || '#6366f1');
        subjectIdMap[sub.id] = Number(res.lastInsertRowid);
      }
      // Insertar rúbricas
      for (const r of (profile.rubrics || [])) {
        const newSubjectId = subjectIdMap[r.subject_id];
        if (!newSubjectId) continue;
        const res = db().prepare(
          `INSERT INTO evaluation_rubrics (subject_id, name, percentage, period_id, sort_order, is_extra) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(newSubjectId, r.name, r.percentage, r.period_id, r.sort_order, r.is_extra);
        rubricIdMap[r.id] = Number(res.lastInsertRowid);
      }
      // Insertar actividades
      for (const a of (profile.activities || [])) {
        const newRubricId = rubricIdMap[a.rubric_id];
        if (!newRubricId) continue;
        const res = db().prepare(
          `INSERT INTO activities (rubric_id, name, period_id, sort_order) VALUES (?, ?, ?, ?)`
        ).run(newRubricId, a.name, a.period_id, a.sort_order);
        activityIdMap[a.id] = Number(res.lastInsertRowid);
      }
      // Insertar calificaciones
      for (const g of (profile.grades || [])) {
        const newStudentId = studentIdMap[g.student_id];
        const newActivityId = activityIdMap[g.activity_id];
        if (!newStudentId || !newActivityId) continue;
        db().prepare(`INSERT OR IGNORE INTO grades (student_id, activity_id, score) VALUES (?, ?, ?)`)
          .run(newStudentId, newActivityId, g.score);
      }
      // Insertar asistencias
      for (const att of (profile.attendances || [])) {
        const newStudentId = studentIdMap[att.student_id];
        const newGroupId = groupIdMap[att.group_id];
        if (!newStudentId || !newGroupId) continue;
        db().prepare(`INSERT OR IGNORE INTO attendances (student_id, group_id, date, status, notes) VALUES (?, ?, ?, ?, ?)`)
          .run(newStudentId, newGroupId, att.date, att.status, att.notes);
      }
    });

    importTx();
    return { success: true, groupsImported: profile.groups.length, studentsImported: (profile.students || []).length };
  } catch (e) {
    console.error('[Profile Import]', e);
    return { success: false, message: e.message };
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// Inicializar la base de datos al inicio
// ────────────────────────────────────────────────────────────────────────────────
const { initDatabase } = require('./database');
const { app } = require('electron');
app.whenReady().then(() => {
  initDatabase();
});

// ──────────────────────────────────────────────────────────────────────────────
// SEGUIMIENTO DE CONDUCTA
// ──────────────────────────────────────────────────────────────────────────────
ipcMain.handle('behavior-records-get', async (_, { groupId, date }) => {
  const { getDatabase } = require('./database');
  return getDatabase().prepare(`
    SELECT * FROM behavior_records 
    WHERE group_id = ? AND date = ?
  `).all(groupId, date);
});

ipcMain.handle('behavior-records-save', async (_, { groupId, date, records }) => {
  const { getDatabase } = require('./database');
  const ddb = getDatabase();
  const deleteStmt = ddb.prepare(`DELETE FROM behavior_records WHERE group_id = ? AND date = ? AND student_id = ?`);
  const insertStmt = ddb.prepare(`
    INSERT INTO behavior_records (student_id, group_id, date, behavior_type, observations)
    VALUES (?, ?, ?, ?, ?)
  `);

  const saveAll = ddb.transaction(() => {
    records.forEach(r => {
      deleteStmt.run(groupId, date, r.student_id);
      if (r.behavior_type !== 'neutral' || (r.observations && r.observations.trim() !== '')) {
        insertStmt.run(r.student_id, groupId, date, r.behavior_type, r.observations || '');
      }
    });
  });

  saveAll();
  return { success: true };
});

ipcMain.handle('behavior-report-get', async (_, { groupId, trimester }) => {
  const { getDatabase } = require('./database');
  const dbInst = getDatabase();
  
  const group = dbInst.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return { students: [], records: [] };
  
  const trimesters = dbInst.prepare('SELECT * FROM cycle_trimesters WHERE cycle_id = ? ORDER BY trimester_number').all(group.school_cycle_id);
  const t = trimesters.find(x => String(x.trimester_number) === String(trimester));
  
  let dateCondition = "";
  let params = [groupId];
  if (t && t.start_date && t.end_date) {
    dateCondition = " AND date >= ? AND date <= ?";
    params.push(t.start_date, t.end_date);
  }
  
  const students = dbInst.prepare(`
    SELECT s.id, s.paternal_surname, s.maternal_surname, s.first_name, ss.name as status_name 
    FROM students s
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE s.group_id = ?
    ORDER BY s.paternal_surname, s.maternal_surname, s.first_name
  `).all(groupId);
  
  const records = dbInst.prepare(`
    SELECT * FROM behavior_records 
    WHERE group_id = ? ${dateCondition}
    ORDER BY date ASC
  `).all(...params);
  
  return { students, records, trimesterObj: t || null };
});

ipcMain.handle('student-grades-detail', async (_, studentId) => {
  const { getDatabase } = require('./database');
  const ddb = getDatabase();

  // Datos básicos del alumno
  const student = ddb.prepare(`
    SELECT s.*, g.id as group_id, g.name as group_name, g.grade as group_grade, 
           g.cycle as group_cycle, g.shift as group_shift,
           ss.name as status_name, ss.color as status_color
    FROM students s
    JOIN groups g ON s.group_id = g.id
    LEFT JOIN student_statuses ss ON s.student_status_id = ss.id
    WHERE s.id = ?
  `).get(studentId);

  if (!student) return null;

  const gradingConfig = ddb.prepare('SELECT setting_max_score, setting_min_pass FROM schools LIMIT 1').get() || { setting_max_score: 10, setting_min_pass: 6 };
  const minPass = gradingConfig.setting_min_pass;
  const maxSys = gradingConfig.setting_max_score;

  // Materias del grupo
  const subjects = ddb.prepare('SELECT * FROM subjects WHERE group_id = ? ORDER BY name').all(student.group_id);

  // Todas las rúbricas por materia
  const rubrics = ddb.prepare('SELECT * FROM evaluation_rubrics WHERE subject_id IN (SELECT id FROM subjects WHERE group_id = ?) ORDER BY period_id, sort_order').all(student.group_id);

  // Todas las actividades
  const activities = ddb.prepare(`
    SELECT a.*, r.name as rubric_name, r.percentage, r.is_extra, r.period_id as rubric_period_id, r.subject_id
    FROM activities a 
    JOIN evaluation_rubrics r ON a.rubric_id = r.id 
    WHERE r.subject_id IN (SELECT id FROM subjects WHERE group_id = ?)
    ORDER BY r.period_id, r.sort_order, a.sort_order
  `).all(student.group_id);

  // Calificaciones del alumno
  const grades = ddb.prepare('SELECT activity_id, score FROM grades WHERE student_id = ?').all(studentId);
  const gradeMap = {};
  for (const g of grades) gradeMap[g.activity_id] = g.score;

  // Construir estructura por materia → trimestre → rúbrica → actividad
  const subjectsDetail = subjects.map(subj => {
    const subjectRubrics = rubrics.filter(r => r.subject_id === subj.id);
    
    const periods = [1, 2, 3].map(period => {
      const periodRubrics = subjectRubrics.filter(r => r.period_id == period);
      let periodTotal = 0;
      
      const rubricsDetail = periodRubrics.map(rubric => {
        const rubricActivities = activities.filter(a => a.rubric_id === rubric.id);
        
        const activitiesDetail = rubricActivities.map(act => {
          const score = gradeMap[act.id] !== undefined ? parseFloat(gradeMap[act.id]) : minPass;
          return { id: act.id, name: act.name, score };
        });

        // Promedio de la rúbrica
        const avg = activitiesDetail.length
          ? activitiesDetail.reduce((sum, a) => sum + a.score, 0) / activitiesDetail.length
          : minPass;

        // Puntaje de la rúbrica según si es extra o no
        let puntaje = 0;
        if (rubric.is_extra) {
          puntaje = avg;
          periodTotal += puntaje;
        } else {
          const w = rubric.percentage || 0;
          const x = maxSys - minPass;
          if (x > 0) {
            const a = w / x;
            const b = -a * minPass;
            puntaje = Math.max(0, Math.round((a * avg + b) * 10) / 10);
            periodTotal += puntaje;
          }
        }

        return {
          id: rubric.id,
          name: rubric.name,
          percentage: rubric.percentage,
          is_extra: rubric.is_extra,
          activities: activitiesDetail,
          avg: Math.round(avg * 10) / 10,
          puntaje: Math.round(puntaje * 10) / 10,
        };
      });

      const periodGrade = Math.round((periodTotal + minPass) * 10) / 10;

      return {
        period,
        rubrics: rubricsDetail,
        grade: periodGrade,
      };
    });

    const general = Math.round((periods.reduce((s, p) => s + p.grade, 0) / 3) * 10) / 10;

    return {
      id: subj.id,
      name: subj.name,
      color: subj.color,
      periods,
      general,
    };
  });

  // Asistencia
  const attendances = ddb.prepare('SELECT status, date FROM attendances WHERE student_id = ? ORDER BY date DESC').all(studentId);
  const totalAtt = attendances.length;
  const presentAtt = attendances.filter(a => a.status === 'present').length;
  const absentAtt = attendances.filter(a => a.status === 'absent').length;
  const lateAtt = attendances.filter(a => a.status === 'late').length;
  const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  // Conducta
  const behaviors = ddb.prepare('SELECT behavior_type, date FROM behavior_records WHERE student_id = ? ORDER BY date DESC').all(studentId);
  const totalBehav = behaviors.length;
  const goodBehav = behaviors.filter(b => b.behavior_type === 'good').length;
  const badBehav = behaviors.filter(b => b.behavior_type === 'bad').length;
  const behavPct = totalBehav > 0 ? Math.round(((totalBehav - badBehav) / totalBehav) * 100) : 100;

  return {
    student: {
      id: student.id,
      name: `${student.paternal_surname} ${student.maternal_surname} ${student.first_name}`.trim(),
      first_name: student.first_name,
      paternal_surname: student.paternal_surname,
      maternal_surname: student.maternal_surname,
      curp: student.curp,
      gender: student.gender,
      birth_date: student.birth_date,
      enrolled_at: student.enrolled_at,
      status_name: student.status_name,
      status_color: student.status_color,
      group_name: student.group_name,
      group_grade: student.group_grade,
      group_cycle: student.group_cycle,
      group_shift: student.group_shift,
    },
    subjects: subjectsDetail,
    attendance: { total: totalAtt, present: presentAtt, absent: absentAtt, late: lateAtt, pct: attPct },
    behavior: { total: totalBehav, good: goodBehav, bad: badBehav, pct: behavPct },
    grading_config: gradingConfig,
  };
});

ipcMain.handle('dashboard-student-search', async (_, query) => {
  const { getDatabase } = require('./database');
  const ddb = getDatabase();
  
  if (!query || query.trim() === '') return [];

  const searchParam = `%${query.trim()}%`;
  const students = ddb.prepare(`
    SELECT s.id, s.first_name, s.paternal_surname, s.maternal_surname,
           g.id as group_id, g.name as group_name, g.grade as group_grade
    FROM students s
    JOIN groups g ON s.group_id = g.id
    WHERE (s.first_name || ' ' || s.paternal_surname || ' ' || s.maternal_surname LIKE ?)
       OR (s.paternal_surname || ' ' || s.maternal_surname || ' ' || s.first_name LIKE ?)
       OR (g.grade LIKE ?)
       OR (g.name LIKE ?)
    LIMIT 100
  `).all(searchParam, searchParam, searchParam, searchParam);

  const gradingConfig = ddb.prepare('SELECT setting_max_score, setting_min_pass FROM schools LIMIT 1').get() || { setting_max_score: 10, setting_min_pass: 6 };
  const minPass = gradingConfig.setting_min_pass;
  const maxSys = gradingConfig.setting_max_score;

  const results = [];
  for (const stu of students) {
    const groupId = stu.group_id;
    const subjects = ddb.prepare('SELECT id FROM subjects WHERE group_id = ?').all(groupId);
    const rubrics = ddb.prepare('SELECT * FROM evaluation_rubrics WHERE subject_id IN (SELECT id FROM subjects WHERE group_id = ?)').all(groupId);
    const activities = ddb.prepare('SELECT id, rubric_id FROM activities WHERE rubric_id IN (SELECT id FROM evaluation_rubrics WHERE subject_id IN (SELECT id FROM subjects WHERE group_id = ?))').all(groupId);
    const grades = ddb.prepare('SELECT activity_id, score FROM grades WHERE student_id = ?').all(stu.id);

    const gradeMap = {};
    for (const g of grades) gradeMap[g.activity_id] = g.score;

    const tStats = { 1: [], 2: [], 3: [] };
    
    for (const period of [1, 2, 3]) {
      for (const subj of subjects) {
        const strRub = rubrics.filter(r => r.subject_id === subj.id && r.period_id == period);
        let stuSubTotal = 0;
        strRub.forEach(rubric => {
          const acts = activities.filter(a => a.rubric_id === rubric.id);
          if (!acts.length) return;
          const scores = acts.map(a => gradeMap[a.id] !== undefined && gradeMap[a.id] !== '' ? parseFloat(gradeMap[a.id]) : minPass);
          const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
          
          if (rubric.is_extra) {
            stuSubTotal += avg;
          } else {
            const w = rubric.percentage || 0;
            const x = maxSys - minPass;
            if (x > 0) {
                const a = w / x;
                const b = -a * minPass;
                stuSubTotal += Math.max(0, a * avg + b);
            }
          }
        });
        tStats[period].push(Math.round((stuSubTotal + minPass) * 10) / 10);
      }
    }

    const t1 = tStats[1].length ? tStats[1].reduce((a,b)=>a+b,0) / tStats[1].length : 0;
    const t2 = tStats[2].length ? tStats[2].reduce((a,b)=>a+b,0) / tStats[2].length : 0;
    const t3 = tStats[3].length ? tStats[3].reduce((a,b)=>a+b,0) / tStats[3].length : 0;
    const general = (t1 + t2 + t3) / 3;

    const behaviors = ddb.prepare("SELECT behavior_type FROM behavior_records WHERE student_id = ? AND behavior_type != 'neutral'").all(stu.id);
    const totalBehav = ddb.prepare("SELECT COUNT(*) as c FROM behavior_records WHERE student_id = ?").get(stu.id).c;
    const badBehav = behaviors.filter(b => b.behavior_type === 'bad').length;
    
    const attendances = ddb.prepare('SELECT status FROM attendances WHERE student_id = ?').all(stu.id);
    const totalAtt = attendances.length;
    const presentAtt = attendances.filter(a => a.status === 'present').length;
    const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    results.push({
      id: stu.id,
      name: `${stu.paternal_surname} ${stu.maternal_surname} ${stu.first_name}`.trim(),
      grade: stu.group_grade,
      group: stu.group_name,
      t1: t1.toFixed(1),
      t2: t2.toFixed(1),
      t3: t3.toFixed(1),
      general: general.toFixed(1),
      behavior_avg: totalBehav > 0 ? Math.round((1 - badBehav / totalBehav)*100) + '%' : '100%',
      attendance_avg: attPct + '%'
    });
  }

  return results;
});

// ──────────────────────────────────────────────────────────────────────────────
// REPORTES EXTRAS (ALERTAS DE ASISTENCIA Y REPROBADOS)
// ──────────────────────────────────────────────────────────────────────────────

ipcMain.handle('reports-attendance-alerts', async (_, { cycleId, trimesterNumber }) => {
  const { getDatabase } = require('./database');
  const ddb = getDatabase();

  let dateQuery = '';
  let queryParams = [];

  if (cycleId && trimesterNumber) {
    const t = ddb.prepare('SELECT start_date, end_date FROM cycle_trimesters WHERE cycle_id = ? AND trimester_number = ?').get(cycleId, trimesterNumber);
    if (t && t.start_date && t.end_date) {
      dateQuery = 'AND date >= ? AND date <= ?';
      queryParams.push(t.start_date, t.end_date);
    }
  }

  const groupDates = ddb.prepare(`SELECT DISTINCT group_id, date FROM attendances ${dateQuery !== '' ? 'WHERE '+dateQuery.substring(4) : ''} ORDER BY date ASC`).all(...queryParams);
  const uniqueDatesByGroup = {};
  groupDates.forEach(r => {
    if (!uniqueDatesByGroup[r.group_id]) uniqueDatesByGroup[r.group_id] = [];
    uniqueDatesByGroup[r.group_id].push(r.date);
  });

  const absences = ddb.prepare(`
    SELECT a.student_id, a.group_id, a.date, s.first_name, s.paternal_surname, s.maternal_surname, g.grade, g.name as group_name
    FROM attendances a
    JOIN students s ON a.student_id = s.id
    JOIN groups g ON s.group_id = g.id
    WHERE a.status = 'absent' ${dateQuery}
    ORDER BY a.student_id, a.date ASC
  `).all(...queryParams);

  const totals = ddb.prepare(`
    SELECT student_id, COUNT(*) as amount
    FROM attendances
    WHERE status = 'absent' ${dateQuery}
    GROUP BY student_id
  `).all(...queryParams);

  const totalMap = {};
  totals.forEach(t => totalMap[t.student_id] = t.amount);

  const studentData = {};
  for (const row of absences) {
    if (!studentData[row.student_id]) {
      studentData[row.student_id] = {
        id: row.student_id,
        name: `${row.paternal_surname} ${row.maternal_surname} ${row.first_name}`.trim(),
        grade: row.grade,
        group: row.group_name,
        group_id: row.group_id,
        totalAbsences: totalMap[row.student_id] || 0,
        dates: []
      };
    }
    studentData[row.student_id].dates.push(row.date);
  }

  const threeAbsences = [];
  const moreThanThreeAbsences = [];

  for (const stuId in studentData) {
    const data = studentData[stuId];
    if (data.dates.length < 3) continue;
    
    const grpDates = uniqueDatesByGroup[data.group_id] || [];
    const absentIndices = data.dates.map(d => grpDates.indexOf(d)).filter(idx => idx !== -1).sort((a,b)=>a-b);
    
    if (absentIndices.length < 3) continue;

    let maxConsecutive = 1;
    let currSeq = 1;
    for (let i = 1; i < absentIndices.length; i++) {
        if (absentIndices[i] === absentIndices[i-1] + 1) {
            currSeq++;
            if (currSeq > maxConsecutive) maxConsecutive = currSeq;
        } else {
            currSeq = 1;
        }
    }

    if (maxConsecutive === 3) threeAbsences.push(data);
    else if (maxConsecutive > 3) moreThanThreeAbsences.push(data);
  }

  return { threeAbsences, moreThanThreeAbsences };
});

ipcMain.handle('reports-failing-students', async (_, { cycleId, trimesterNumber }) => {
  const { getDatabase } = require('./database');
  const ddb = getDatabase();

  const gradingConfig = ddb.prepare('SELECT setting_max_score, setting_min_pass FROM schools LIMIT 1').get() || { setting_max_score: 10, setting_min_pass: 6 };
  const minPass = gradingConfig.setting_min_pass;
  const maxSys = gradingConfig.setting_max_score;

  const students = ddb.prepare(`
    SELECT s.id, s.first_name, s.paternal_surname, s.maternal_surname,
           g.id as group_id, g.name as group_name, g.grade as group_grade
    FROM students s
    JOIN groups g ON s.group_id = g.id
    WHERE g.school_cycle_id = ? AND s.student_status_id != (SELECT id FROM student_statuses WHERE name='Baja' LIMIT 1)
  `).all(cycleId);

  const failingStudents = [];

  for (const stu of students) {
    const groupId = stu.group_id;
    const subjects = ddb.prepare('SELECT id FROM subjects WHERE group_id = ?').all(groupId);
    if (!subjects.length) continue;

    const rubrics = ddb.prepare('SELECT * FROM evaluation_rubrics WHERE subject_id IN (SELECT id FROM subjects WHERE group_id = ?) AND period_id = ?').all(groupId, trimesterNumber);
    const activities = ddb.prepare('SELECT id, rubric_id FROM activities WHERE rubric_id IN (SELECT id FROM evaluation_rubrics WHERE subject_id IN (SELECT id FROM subjects WHERE group_id = ?) AND period_id = ?)').all(groupId, trimesterNumber);
    const grades = ddb.prepare('SELECT activity_id, score FROM grades WHERE student_id = ?').all(stu.id);

    const gradeMap = {};
    for (const g of grades) gradeMap[g.activity_id] = g.score;

    const subjectGrades = [];

    for (const subj of subjects) {
      const strRub = rubrics.filter(r => r.subject_id === subj.id);
      let stuSubTotal = 0;
      strRub.forEach(rubric => {
        const acts = activities.filter(a => a.rubric_id === rubric.id);
        if (!acts.length) return;
        const scores = acts.map(a => gradeMap[a.id] !== undefined && gradeMap[a.id] !== '' ? parseFloat(gradeMap[a.id]) : minPass);
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        
        if (rubric.is_extra) {
          stuSubTotal += avg;
        } else {
          const w = rubric.percentage || 0;
          const x = maxSys - minPass;
          if (x > 0) {
              const a = w / x;
              const b = -a * minPass;
              stuSubTotal += (a * avg + b);
          }
        }
      });
      subjectGrades.push(Math.round((stuSubTotal + minPass) * 10) / 10);
    }

    const finalAvg = subjectGrades.length ? subjectGrades.reduce((a,b)=>a+b,0) / subjectGrades.length : 0;
    
    if (finalAvg < 5.9 && finalAvg > 0) { // < 5.9 as requested by user
      const totals = ddb.prepare(`
        SELECT COUNT(*) as amount FROM attendances WHERE student_id = ? AND status = 'absent'
      `).get(stu.id);

      failingStudents.push({
        id: stu.id,
        name: `${stu.paternal_surname} ${stu.maternal_surname} ${stu.first_name}`.trim(),
        grade: stu.group_grade,
        group: stu.group_name,
        totalAbsences: totals.amount || 0,
        finalGrade: finalAvg.toFixed(1)
      });
    }
  }

  return failingStudents;
});

// ──────────────────────────────────────────────────────────────────────────────
// INCIDENTES
// ──────────────────────────────────────────────────────────────────────────────

ipcMain.handle('incidents-get-all', async () => {
  const { getDatabase } = require('./database');
  return getDatabase().prepare(`
      SELECT i.*, 
             s.first_name, s.paternal_surname, s.maternal_surname,
             g.grade, g.name as group_name,
             t.name as incident_type_name
      FROM incidents i
      JOIN students s ON i.student_id = s.id
      JOIN groups g ON i.group_id = g.id
      LEFT JOIN incident_types t ON i.incident_type_id = t.id
      ORDER BY i.incident_date DESC, i.id DESC
  `).all();
});

ipcMain.handle('incidents-get-types', async () => {
  const { getDatabase } = require('./database');
  return getDatabase().prepare('SELECT * FROM incident_types ORDER BY name ASC').all();
});

ipcMain.handle('incidents-create-type', async (_, data) => {
  const { getDatabase } = require('./database');
  try {
    const res = getDatabase().prepare('INSERT INTO incident_types (name) VALUES (?)').run(data.name);
    return { success: true, id: res.lastInsertRowid };
  } catch(err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('incidents-update-type', async (_, id, data) => {
  const { getDatabase } = require('./database');
  try {
    getDatabase().prepare('UPDATE incident_types SET name = ? WHERE id = ?').run(data.name, id);
    return { success: true };
  } catch(err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('incidents-delete-type', async (_, id) => {
  const { getDatabase } = require('./database');
  try {
    // Optional: Check if type is in use before deleting
    const inUse = getDatabase().prepare('SELECT COUNT(*) as c FROM incidents WHERE incident_type_id = ?').get(id).c > 0;
    if (inUse) return { success: false, message: 'No se puede eliminar porque está en uso por incidentes.' };

    getDatabase().prepare('DELETE FROM incident_types WHERE id = ?').run(id);
    return { success: true };
  } catch(err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('incidents-create', async (_, data) => {
  const { getDatabase } = require('./database');
  try {
      const res = getDatabase().prepare(`
          INSERT INTO incidents (
              student_id, group_id, incident_date, incident_type_id, description, 
              notified_authorities, tutor_contacted, contact_method, contact_datetime, 
              school_name, teacher_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
          data.student_id, data.group_id, data.incident_date, data.incident_type_id, 
          data.description || '',
          JSON.stringify(data.notified_authorities || {}), 
          data.tutor_contacted ? 1 : 0, 
          data.contact_method || '', 
          data.contact_datetime || '',
          data.school_name || '', 
          data.teacher_name || ''
      );
      return { success: true, id: res.lastInsertRowid };
  } catch(err) {
      console.error(err);
      return { success: false, message: err.message };
  }
});

// ── MÚLTIPLE DISPOSITIVO (SYNC) ─────────────────
ipcMain.handle('sync-set-provider', async (_, { provider, config }) => {
  try {
    syncManager.setProvider(provider, config);
    const result = await syncManager.connect();
    
    // Guardar si es válido
    if(result && result.success) {
      const db = getDatabase();
      db.prepare('UPDATE cloud_sync_config SET service = ?, config_json = ?, enabled = 1').run(provider, JSON.stringify(config));
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sync-push', async (_, localData) => {
  try { return await syncManager.pushLocalChanges(localData); }
  catch(err) { return { success: false, error: err.message }; }
});

ipcMain.handle('sync-pull', async () => {
  try { return await syncManager.pullRemoteChanges(); }
  catch(err) { return { success: false, error: err.message }; }
});

ipcMain.handle('sync-backup-db', async () => {
  try {
    const dbPath = getDatabasePath();
    const remoteName = `arkhe_backup_${Date.now()}.sqlite`;
    return await syncManager.backupDatabase(dbPath, remoteName);
  } catch(err) {
    return { success: false, error: err.message };
  }
});
