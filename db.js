const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, 'lenslab.db'));

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ id: this.lastID, changes: this.changes });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const init = async () => {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS photographers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT
  )`);
  await run(`CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('DSLR', 'Mirrorless', 'Action'))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photographer_id INTEGER NOT NULL,
    camera_id INTEGER NOT NULL,
    rental_date TEXT NOT NULL,
    FOREIGN KEY(photographer_id) REFERENCES photographers(id) ON DELETE CASCADE,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    UNIQUE(camera_id, rental_date)
  )`);
  const count = await get('SELECT COUNT(*) as count FROM cameras');
  if (count.count === 0) {
    await run('INSERT INTO photographers (name, email, phone) VALUES (?, ?, ?)', ['Alex Rivera', 'alex@lenslab.com', '555-0101']);
    await run('INSERT INTO photographers (name, email, phone) VALUES (?, ?, ?)', ['Jordan Lee', 'jordan@lenslab.com', '555-0102']);
    await run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['Canon EOS R5', 'Mirrorless']);
    await run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['Nikon D850', 'DSLR']);
    await run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['GoPro Hero 12', 'Action']);
    await run('INSERT INTO rentals (photographer_id, camera_id, rental_date) VALUES (?, ?, ?)', [1, 1, '2026-11-20']);
  }
};

module.exports = { db, run, get, all, init };
