const { initDatabase, db, getDatabasePath } = require('./electron/database.js');
initDatabase();
const database = db();
try {
  database.transaction(() => {
    let stmt = database.prepare('INSERT INTO cycle_trimesters (cycle_id, trimester_number, start_date, end_date) VALUES (?, ?, ?, ?)');
    stmt.run(1, 1, '2025-09-01', '2025-11-28');
  })();
  console.log("Success");
} catch(e) {
  console.log("Error:", e);
}
