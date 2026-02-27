const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = '/data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'thaifood.db'));

// ─── Schema ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS spin_stats (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id  TEXT    NOT NULL UNIQUE,
    name_th  TEXT    NOT NULL,
    name_en  TEXT    NOT NULL,
    emoji    TEXT    NOT NULL,
    type     TEXT    NOT NULL,
    spins    INTEGER NOT NULL DEFAULT 0,
    saves    INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT  NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id    TEXT    NOT NULL,
    name_th    TEXT    NOT NULL,
    name_en    TEXT    NOT NULL,
    emoji      TEXT    NOT NULL,
    type       TEXT    NOT NULL,
    spicy      INTEGER NOT NULL DEFAULT 0,
    log_date   TEXT    NOT NULL,
    log_time   TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Routes ────────────────────────────────────────────────────────────────

// POST /api/spin — record a spin event
app.post('/api/spin', (req, res) => {
  const { menu_id, name_th, name_en, emoji, type } = req.body;
  if (!menu_id) return res.status(400).json({ error: 'menu_id required' });

  const existing = db.prepare('SELECT id FROM spin_stats WHERE menu_id = ?').get(menu_id);
  if (existing) {
    db.prepare(`UPDATE spin_stats SET spins = spins + 1, updated_at = datetime('now') WHERE menu_id = ?`).run(menu_id);
  } else {
    db.prepare(`INSERT INTO spin_stats (menu_id, name_th, name_en, emoji, type, spins) VALUES (?, ?, ?, ?, ?, 1)`)
      .run(menu_id, name_th, name_en, emoji, type);
  }
  res.json({ ok: true });
});

// POST /api/save — record a save (add to daily log)
app.post('/api/save', (req, res) => {
  const { menu_id, name_th, name_en, emoji, type, spicy, log_date, log_time } = req.body;
  if (!menu_id) return res.status(400).json({ error: 'menu_id required' });

  // Log the entry
  db.prepare(`INSERT INTO daily_log (menu_id, name_th, name_en, emoji, type, spicy, log_date, log_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(menu_id, name_th, name_en, emoji, type, spicy ? 1 : 0, log_date, log_time);

  // Increment saves counter
  const existing = db.prepare('SELECT id FROM spin_stats WHERE menu_id = ?').get(menu_id);
  if (existing) {
    db.prepare(`UPDATE spin_stats SET saves = saves + 1, updated_at = datetime('now') WHERE menu_id = ?`).run(menu_id);
  } else {
    db.prepare(`INSERT INTO spin_stats (menu_id, name_th, name_en, emoji, type, saves) VALUES (?, ?, ?, ?, ?, 1)`)
      .run(menu_id, name_th, name_en, emoji, type);
  }

  res.json({ ok: true });
});

// DELETE /api/log/:id — remove a log entry
app.delete('/api/log/:id', (req, res) => {
  db.prepare('DELETE FROM daily_log WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/log — get daily log grouped by date
app.get('/api/log', (req, res) => {
  const rows = db.prepare(`SELECT * FROM daily_log ORDER BY log_date DESC, created_at DESC`).all();

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.log_date]) grouped[row.log_date] = [];
    grouped[row.log_date].push(row);
  }

  res.json(grouped);
});

// GET /api/stats — get spin + save stats for all menus
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`SELECT * FROM spin_stats ORDER BY saves DESC, spins DESC`).all();
  
  const totals = db.prepare(`SELECT 
    SUM(spins) as total_spins,
    SUM(saves) as total_saves,
    COUNT(*) as unique_menus
  FROM spin_stats`).get();

  const topFood = db.prepare(`SELECT * FROM spin_stats WHERE type='food' ORDER BY saves DESC LIMIT 5`).all();
  const topDrink = db.prepare(`SELECT * FROM spin_stats WHERE type='drink' ORDER BY saves DESC LIMIT 5`).all();

  // Daily activity last 7 days
  const daily = db.prepare(`
    SELECT log_date, COUNT(*) as count 
    FROM daily_log 
    WHERE log_date >= date('now', '-7 days')
    GROUP BY log_date 
    ORDER BY log_date ASC
  `).all();

  res.json({ stats, totals, topFood, topDrink, daily });
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🍜 Thai Menu API running on port ${PORT}`));
