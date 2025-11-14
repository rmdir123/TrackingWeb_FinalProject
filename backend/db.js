// db.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./PJ.db', (err) => {
  if (err) console.error('DB error:', err.message);
  else console.log('Connected to PJ.db');
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON'); // เปิด FK
});

module.exports = db;
