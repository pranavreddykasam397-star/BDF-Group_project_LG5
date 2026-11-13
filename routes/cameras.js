const express = require('express');
const { getDb } = require('../database/db');
const { validateCameraPost, validateCameraPut } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { kind } = req.query;
    const db = await getDb();
    if (kind) {
      const cameras = await db.all('SELECT * FROM cameras WHERE kind = ?', [kind]);
      return res.status(200).json(cameras);
    }
    const cameras = await db.all('SELECT * FROM cameras');
    res.status(200).json(cameras);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const camera = await db.get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });
    res.status(200).json(camera);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateCameraPost, async (req, res, next) => {
  try {
    const { name, kind } = req.body;
    const db = await getDb();
    const result = await db.run('INSERT INTO cameras (name, kind) VALUES (?, ?)', [name, kind]);
    const created = await db.get('SELECT * FROM cameras WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateCameraPut, async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Camera not found' });

    const updatedName = req.body.name !== undefined ? req.body.name : existing.name;
    const updatedKind = req.body.kind !== undefined ? req.body.kind : existing.kind;

    await db.run('UPDATE cameras SET name = ?, kind = ? WHERE id = ?', [updatedName, updatedKind, req.params.id]);
    const updated = await db.get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Camera not found' });

    await db.run('DELETE FROM cameras WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Camera deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
