const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbInstance = null;

const getDb = async () => {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: path.join(__dirname, '..', 'lenslab.db'),
    driver: sqlite3.Database
  });
  await dbInstance.run('PRAGMA foreign_keys = ON');
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS photographers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT
    );
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photographer_id INTEGER NOT NULL,
      camera_id INTEGER NOT NULL,
      rental_date TEXT NOT NULL,
      FOREIGN KEY (photographer_id) REFERENCES photographers(id) ON DELETE CASCADE,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
      UNIQUE(camera_id, rental_date)
    );
  `);
  return dbInstance;
};

module.exports = { getDb };
