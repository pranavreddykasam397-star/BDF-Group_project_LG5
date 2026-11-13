const express = require('express');
const { getDb } = require('./database/db');
const photographersRouter = require('./routes/photographers');
const camerasRouter = require('./routes/cameras');
const rentalsRouter = require('./routes/rentals');

const app = express();

app.use(express.json());

app.use('/photographers', photographersRouter);
app.use('/cameras', camerasRouter);
app.use('/rentals', rentalsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, _next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

const seed = async (db) => {
  const row = await db.get('SELECT COUNT(*) as count FROM cameras');
  if (row.count === 0) {
    await db.run('INSERT INTO photographers (name, phone) VALUES (?, ?)', ['Pavan Kumar', '9876543210']);
    await db.run('INSERT INTO photographers (name, phone) VALUES (?, ?)', ['Pranav Reddy', '9123456780']);
    await db.run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['Sony Alpha 7 IV', 'Mirrorless']);
    await db.run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['Canon EOS 90D', 'DSLR']);
    await db.run('INSERT INTO cameras (name, kind) VALUES (?, ?)', ['GoPro HERO12', 'Action']);
    await db.run('INSERT INTO rentals (photographer_id, camera_id, rental_date) VALUES (?, ?, ?)', [1, 1, '2026-11-20']);
  }
};

if (require.main === module) {
  getDb().then(async (db) => {
    await seed(db);
    app.listen(PORT, () => {
      console.log(`LensLab Studio server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
