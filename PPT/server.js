// server.js - Express backend with SQLite for leave system
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // allow all origins for dev
app.use(express.json());

// Initialize SQLite DB
const dbPath = path.join(__dirname, 'leaves.db');
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL
  );
`);

// Helper to map row to object
function rowToRecord(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    type: row.type,
    note: row.note,
    createdAt: row.createdAt,
  };
}

// GET all records
app.get('/api/records', (req, res) => {
  const stmt = db.prepare('SELECT * FROM records ORDER BY createdAt DESC');
  const rows = stmt.all();
  res.json(rows.map(rowToRecord));
});

// POST new record
app.post('/api/records', (req, res) => {
  const { name, startDate, endDate, type, note, createdAt } = req.body;
  if (!name || !startDate || !endDate || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const id = req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const stmt = db.prepare(`INSERT INTO records (id, name, startDate, endDate, type, note, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, name, startDate, endDate, type, note || '', createdAt || new Date().toISOString());
  const newRec = { id, name, startDate, endDate, type, note: note || '', createdAt: createdAt || new Date().toISOString() };
  res.json(newRec);
});

// DELETE a record by id
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM records WHERE id = ?');
  const info = stmt.run(id);
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Record not found' });
  }
  res.json({ message: 'Deleted' });
});

// DELETE all records
app.delete('/api/records', (req, res) => {
  db.exec('DELETE FROM records');
  res.json({ message: 'All records cleared' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
