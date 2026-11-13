const express = require('express');
const { getDb } = require('../database/db');
const { validateRental } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const rentals = await db.all(`
      SELECT 
        rentals.id,
        rentals.photographer_id,
        photographers.name AS photographer_name,
        photographers.phone AS photographer_phone,
        rentals.camera_id,
        cameras.name AS camera_name,
        cameras.kind AS camera_kind,
        rentals.rental_date
      FROM rentals
      JOIN photographers ON rentals.photographer_id = photographers.id
      JOIN cameras ON rentals.camera_id = cameras.id
      ORDER BY rentals.id ASC
    `);
    res.status(200).json(rentals);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateRental, async (req, res, next) => {
  try {
    const { photographer_id, camera_id, rental_date } = req.body;
    const db = await getDb();

    const photographer = await db.get('SELECT id FROM photographers WHERE id = ?', [photographer_id]);
    if (!photographer) return res.status(404).json({ error: 'Photographer not found' });

    const camera = await db.get('SELECT id FROM cameras WHERE id = ?', [camera_id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    const existing = await db.get(
      'SELECT id FROM rentals WHERE camera_id = ? AND rental_date = ?',
      [camera_id, rental_date]
    );
    if (existing) {
      return res.status(409).json({ error: 'Camera is already booked for this date' });
    }

    const result = await db.run(
      'INSERT INTO rentals (photographer_id, camera_id, rental_date) VALUES (?, ?, ?)',
      [photographer_id, camera_id, rental_date]
    );
    const created = await db.get('SELECT * FROM rentals WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
