const express = require('express');
const { getDb } = require('../database/db');
const { validatePhotographer } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const photographers = await db.all('SELECT * FROM photographers');
    res.status(200).json(photographers);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const photographer = await db.get('SELECT * FROM photographers WHERE id = ?', [req.params.id]);
    if (!photographer) return res.status(404).json({ error: 'Photographer not found' });
    res.status(200).json(photographer);
  } catch (err) {
    next(err);
  }
});

router.post('/', validatePhotographer, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO photographers (name, phone) VALUES (?, ?)',
      [name, phone ? phone.trim() : null]
    );
    const created = await db.get('SELECT * FROM photographers WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
