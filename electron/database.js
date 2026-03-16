const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db = null;
let dbPath = null;
let customDbPathFile = null;

// ───────────────────────────────────────────────
// RUTA PERSONALIZADA DE BD
// ───────────────────────────────────────────────
function getCustomDbPathFile() {
  if (!customDbPathFile) {
    const userDataPath = app.getPath('userData');
    customDbPathFile = path.join(userDataPath, 'custom_db_path.json');
  }
  return customDbPathFile;
}

function getCustomDbPath() {
  try {
    const configFile = getCustomDbPathFile();
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return data.dbPath || null;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function setCustomDbPath(newPath) {
  const configFile = getCustomDbPathFile();
  fs.writeFileSync(configFile, JSON.stringify({ dbPath: newPath }), 'utf8');
}

function clearCustomDbPath() {
  try {
    const configFile = getCustomDbPathFile();
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
  } catch (e) { /* ignore */ }
}


// ───────────────────────────────────────────────
// INICIALIZAR BASE DE DATOS
// ───────────────────────────────────────────────
function initDatabase() {
  const userDataPath = app.getPath('userData');
  const defaultPath = path.join(userDataPath, 'arke_software.db');
  // Verificar si hay una ruta personalizada guardada
  const custom = getCustomDbPath();
  dbPath = (custom && fs.existsSync(custom)) ? custom : defaultPath;

  console.log('[DB] Ruta de base de datos:', dbPath);

  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    createSchema();
    seedDefaults();
    syncGrades();
    console.log('[DB] Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('[DB] Error al inicializar la base de datos:', err);
    throw err;
  }
}

// Cambiar ruta de base de datos: copia la actual a la nueva ubicación y la recarga
function changeDatabase(newPath) {
  if (!newPath) return;
  // Si el archivo nuevo ya existe, simplemente se usa; si no, exportamos el actual
  if (!fs.existsSync(newPath)) {
    if (db) {
      // Backup sinécrono usando SQLite backup
      db.backup(newPath);
    }
  }
  // Cerrar la BD actual y reabrir en la nueva ruta
  if (db) {
    db.close();
    db = null;
  }
  dbPath = newPath;
  setCustomDbPath(newPath);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  createSchema();
  console.log('[DB] Base de datos cambiada a:', dbPath);
}


// ───────────────────────────────────────────────
// ESQUEMA COMPLETO
// ───────────────────────────────────────────────
function createSchema() {
  db.exec(`
    -- Configuración general de la escuela
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Mi Escuela',
      address TEXT,
      phone TEXT,
      email TEXT,
      principal_name TEXT,
      logo BLOB,
      logo_mime TEXT,
      state_logo BLOB,
      state_logo_mime TEXT,
      setting_max_score REAL DEFAULT 10,
      setting_min_pass REAL DEFAULT 6,
      setting_periods INTEGER DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Usuarios del sistema (multi-usuario local)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'teacher' CHECK(role IN ('admin', 'teacher')),
      school_id INTEGER REFERENCES schools(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Sesión activa (solo 1 usuario a la vez en desktop)
    CREATE TABLE IF NOT EXISTS active_session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      user_id INTEGER REFERENCES users(id),
      logged_in_at TEXT DEFAULT (datetime('now'))
    );

    -- Ciclos Escolares
    CREATE TABLE IF NOT EXISTS school_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL REFERENCES schools(id),
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycle_trimesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER NOT NULL REFERENCES school_cycles(id) ON DELETE CASCADE,
      trimester_number INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(cycle_id, trimester_number)
    );

    -- Grupos
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      school_id INTEGER REFERENCES schools(id),
      cycle TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT '1',
      shift TEXT DEFAULT 'matutino',
      current_period INTEGER DEFAULT 1,
      archived_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Períodos de Grupo (Trimestres)
    CREATE TABLE IF NOT EXISTS group_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      period INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, period)
    );

    -- Estatus de Alumnos
    CREATE TABLE IF NOT EXISTS student_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER REFERENCES schools(id),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6b7280',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Alumnos
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      student_status_id INTEGER REFERENCES student_statuses(id),
      first_name TEXT NOT NULL,
      paternal_surname TEXT NOT NULL DEFAULT '',
      maternal_surname TEXT DEFAULT '',
      curp TEXT,
      email TEXT,
      phone TEXT,
      birth_date TEXT,
      gender TEXT,
      address TEXT,
      enrolled_at TEXT,
      dropped_at TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Plantillas de Materias
    CREATE TABLE IF NOT EXISTS subject_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER REFERENCES schools(id),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Materias (asignadas a grupos)
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      subject_template_id INTEGER REFERENCES subject_templates(id),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Plantillas de Evaluación
    CREATE TABLE IF NOT EXISTS evaluation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER REFERENCES schools(id),
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Plantillas de Actividades
    CREATE TABLE IF NOT EXISTS activity_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_template_id INTEGER REFERENCES evaluation_templates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      percentage REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_extra INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Ítems dentro de una plantilla de actividad
    CREATE TABLE IF NOT EXISTS activity_template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_template_id INTEGER REFERENCES activity_templates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Rúbricas de Evaluación
    CREATE TABLE IF NOT EXISTS evaluation_rubrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      evaluation_template_id INTEGER REFERENCES evaluation_templates(id),
      name TEXT NOT NULL,
      percentage REAL DEFAULT 0,
      period_id INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      is_extra INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Actividades
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rubric_id INTEGER NOT NULL REFERENCES evaluation_rubrics(id) ON DELETE CASCADE,
      activity_template_id INTEGER REFERENCES activity_templates(id),
      name TEXT NOT NULL,
      period_id INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Indicadores de Desempeño (Semáforo)
    CREATE TABLE IF NOT EXISTS performance_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER REFERENCES schools(id),
      label TEXT NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      color TEXT DEFAULT '#22c55e',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Calificaciones
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      score REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(student_id, activity_id)
    );

    -- Asistencias
    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'present' CHECK(status IN ('present', 'absent', 'late')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(student_id, group_id, date)
    );

    -- Equipos
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      team_number INTEGER DEFAULT 0, -- 0 significa sin equipo, 1-10 los equipos
      comments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(activity_id, student_id)
    );

    -- Seguimiento de PDA
    CREATE TABLE IF NOT EXISTS pdas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      topic TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      num_sessions INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pda_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pda_id INTEGER NOT NULL REFERENCES pdas(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      UNIQUE(pda_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS pda_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pda_id INTEGER NOT NULL REFERENCES pdas(id) ON DELETE CASCADE,
      session_number INTEGER NOT NULL,
      activity TEXT,
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pda_session_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pda_session_id INTEGER NOT NULL REFERENCES pda_sessions(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(pda_session_id, group_id)
    );

    -- Seguimiento de Conducta
    CREATE TABLE IF NOT EXISTS behavior_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      behavior_type TEXT NOT NULL DEFAULT 'neutral' CHECK(behavior_type IN ('good', 'neutral', 'bad')),
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Ajustes de la tabla de calificaciones (orden y zoom)
    CREATE TABLE IF NOT EXISTS grades_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      period_id INTEGER NOT NULL,
      column_layout TEXT,
      zoom_level REAL DEFAULT 1,
      UNIQUE(subject_id, period_id)
    );

    -- Configuración de sincronización en la nube
    CREATE TABLE IF NOT EXISTS cloud_sync_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      enabled INTEGER DEFAULT 0,
      auto_sync INTEGER DEFAULT 0,
      service TEXT DEFAULT 'none',
      last_sync TEXT,
      config_json TEXT
    );

    -- Tipos de Incidente
    CREATE TABLE IF NOT EXISTS incident_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    -- Incidentes
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      incident_date TEXT NOT NULL,
      incident_type_id INTEGER REFERENCES incident_types(id),
      description TEXT,
      notified_authorities TEXT,
      tutor_contacted INTEGER DEFAULT 0,
      contact_method TEXT,
      contact_datetime TEXT,
      school_name TEXT,
      teacher_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Licencias y Suscripciones (Freemium)
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER REFERENCES schools(id),
      plan_type TEXT NOT NULL DEFAULT 'free' CHECK(plan_type IN ('free', 'basic', 'premium', 'enterprise')),
      license_key TEXT,
      max_groups INTEGER DEFAULT 3,
      max_students INTEGER DEFAULT 40,
      has_reports INTEGER DEFAULT 0,
      has_advanced_evaluation INTEGER DEFAULT 0,
      has_cloud_sync INTEGER DEFAULT 0,
      has_support INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      activated_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_licenses_school ON licenses(school_id);
  `);

  try {
    db.exec(`ALTER TABLE teams ADD COLUMN topic TEXT DEFAULT ''`);
  } catch (e) {
    // Si la columna ya existe, SQLite arrojará un error que podemos ignorar con seguridad.
  }

  try {
    db.exec(`ALTER TABLE students ADD COLUMN enrolled_at TEXT`);
  } catch (e) {}
}

// ───────────────────────────────────────────────
// SINCRONIZACIÓN DE CALIFICACIONES
// ───────────────────────────────────────────────

/**
 * syncGrades — Sincronización global al iniciar la app.
 * Crea registros en `grades` para cada combinación (alumno × actividad)
 * que aún no tenga calificación. No sobreescribe registros existentes.
 * - Actividades cuya rúbrica tenga is_extra=1 → score = 0
 * - Resto → score = setting_min_pass de la escuela
 */
function syncGrades() {
  try {
    const config = db.prepare('SELECT setting_min_pass FROM schools LIMIT 1').get();
    const minPass = config ? (config.setting_min_pass ?? 6) : 6;

    db.prepare(`
      INSERT OR IGNORE INTO grades (student_id, activity_id, score)
      SELECT
        s.id        AS student_id,
        a.id        AS activity_id,
        CASE WHEN r.is_extra = 1 THEN 0 ELSE ? END AS score
      FROM students s
      JOIN groups       g   ON g.id  = s.group_id
      JOIN subjects     sub ON sub.group_id = g.id
      JOIN evaluation_rubrics r ON r.subject_id = sub.id
      JOIN activities   a   ON a.rubric_id = r.id
    `).run(minPass);

    console.log('[DB] syncGrades: calificaciones sincronizadas correctamente.');
  } catch (err) {
    console.error('[DB] syncGrades error:', err);
  }
}

/**
 * syncGradesForStudent — Se llama al crear un alumno nuevo (o importar).
 * Inserta calificaciones para TODAS las actividades del grupo del alumno.
 */
function syncGradesForStudent(studentId) {
  try {
    const student = db.prepare('SELECT group_id FROM students WHERE id = ?').get(studentId);
    if (!student) return;

    const config = db.prepare('SELECT setting_min_pass FROM schools LIMIT 1').get();
    const minPass = config ? (config.setting_min_pass ?? 6) : 6;

    db.prepare(`
      INSERT OR IGNORE INTO grades (student_id, activity_id, score)
      SELECT
        ? AS student_id,
        a.id AS activity_id,
        CASE WHEN r.is_extra = 1 THEN 0 ELSE ? END AS score
      FROM subjects     sub
      JOIN evaluation_rubrics r ON r.subject_id = sub.id
      JOIN activities   a       ON a.rubric_id  = r.id
      WHERE sub.group_id = ?
    `).run(studentId, minPass, student.group_id);

    console.log(`[DB] syncGradesForStudent: alumno #${studentId} sincronizado.`);
  } catch (err) {
    console.error('[DB] syncGradesForStudent error:', err);
  }
}

/**
 * syncGradesForActivity — Se llama al crear una nueva actividad.
 * Inserta calificaciones para TODOS los alumnos del grupo de la actividad.
 */
function syncGradesForActivity(activityId) {
  try {
    const activity = db.prepare('SELECT rubric_id FROM activities WHERE id = ?').get(activityId);
    if (!activity) return;

    const rubric = db.prepare('SELECT subject_id, is_extra FROM evaluation_rubrics WHERE id = ?').get(activity.rubric_id);
    if (!rubric) return;

    const subject = db.prepare('SELECT group_id FROM subjects WHERE id = ?').get(rubric.subject_id);
    if (!subject) return;

    const config = db.prepare('SELECT setting_min_pass FROM schools LIMIT 1').get();
    const minPass = config ? (config.setting_min_pass ?? 6) : 6;
    const defaultScore = rubric.is_extra ? 0 : minPass;

    db.prepare(`
      INSERT OR IGNORE INTO grades (student_id, activity_id, score)
      SELECT id, ?, ?
      FROM students
      WHERE group_id = ?
    `).run(activityId, defaultScore, subject.group_id);

    console.log(`[DB] syncGradesForActivity: actividad #${activityId} sincronizada (is_extra=${rubric.is_extra}, score=${defaultScore}).`);
  } catch (err) {
    console.error('[DB] syncGradesForActivity error:', err);
  }
}

// ───────────────────────────────────────────────
// DATOS INICIALES (seed)
// ───────────────────────────────────────────────
function seedDefaults() {
  const schoolCount = db.prepare('SELECT COUNT(*) as cnt FROM schools').get();
  if (schoolCount.cnt === 0) {
    db.prepare(`INSERT INTO schools (name, setting_max_score, setting_min_pass, setting_periods) VALUES (?, ?, ?, ?)`).run('Mi Escuela', 10, 6, 3);
  }

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role, school_id) VALUES (?, ?, ?, 'admin', 1)`).run('Administrador', 'admin@arkhe.local', hashedPassword);
    console.log('[DB] Usuario admin creado: admin@arkhe.local / admin123');
  }

  const statusCount = db.prepare('SELECT COUNT(*) as cnt FROM student_statuses').get();
  if (statusCount.cnt === 0) {
    db.prepare(`INSERT INTO student_statuses (school_id, name, color, is_default) VALUES (1, 'Activo', '#22c55e', 1)`).run();
    db.prepare(`INSERT INTO student_statuses (school_id, name, color, is_default) VALUES (1, 'Baja', '#ef4444', 0)`).run();
    db.prepare(`INSERT INTO student_statuses (school_id, name, color, is_default) VALUES (1, 'Traslado', '#f59e0b', 0)`).run();
    db.prepare(`INSERT INTO student_statuses (school_id, name, color, is_default) VALUES (1, 'Irregular', '#8b5cf6', 0)`).run();
  }

  const indicatorCount = db.prepare('SELECT COUNT(*) as cnt FROM performance_indicators').get();
  if (indicatorCount.cnt === 0) {
    const indicators = [
      [1, 'Insuficiente', 0, 5.9, '#ef4444', 1],
      [1, 'Suficiente', 6, 6.9, '#f59e0b', 2],
      [1, 'Bien', 7, 7.9, '#3b82f6', 3],
      [1, 'Muy Bien', 8, 8.9, '#22c55e', 4],
      [1, 'Excelente', 9, 10, '#8b5cf6', 5],
    ];
    const stmt = db.prepare(`INSERT INTO performance_indicators (school_id, label, min_value, max_value, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)`);
    indicators.forEach(i => stmt.run(...i));
  }

  const licenseCount = db.prepare('SELECT COUNT(*) as cnt FROM licenses').get();
  if (licenseCount.cnt === 0) {
    db.prepare(`INSERT INTO licenses (school_id, plan_type, max_groups, max_students, has_reports, has_advanced_evaluation, has_cloud_sync, has_support) VALUES (1, 'free', 3, 40, 0, 0, 0, 0)`).run();
    console.log('[DB] Licencia Free creada por defecto: 3 grupos, 40 alumnos');
  }
}

// ───────────────────────────────────────────────
// EXPORTAR / IMPORTAR BASE DE DATOS
// ───────────────────────────────────────────────
function exportDatabase(destPath) {
  return db.backup(destPath).then(() => {
    console.log('[DB] Backup exportado a:', destPath);
  }).catch(err => {
    console.error('[DB] Error en backup:', err);
    throw err;
  });
}

function importDatabase(srcPath) {
  // Cerrar la db actual, copiar archivo, reabrir
  if (db) {
    db.close();
    db = null;
  }
  const fs = require('fs');
  fs.copyFileSync(srcPath, dbPath);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('[DB] Base de datos importada desde:', srcPath);
}

// ───────────────────────────────────────────────
// GETTER
// ───────────────────────────────────────────────
function getDatabase() {
  return db;
}

function getDatabasePath() {
  return dbPath;
}

module.exports = {
  initDatabase,
  getDatabase,
  getDatabasePath,
  exportDatabase,
  importDatabase,
  changeDatabase,
  getCustomDbPath,
  setCustomDbPath,
  clearCustomDbPath,
  syncGrades,
  syncGradesForStudent,
  syncGradesForActivity,
};

