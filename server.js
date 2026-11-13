const express = require('express');
const { run, get, all, init } = require('./db');

const app = express();
app.use(express.json());

const ALLOWED_KINDS = ['DSLR', 'Mirrorless', 'Action'];

app.get('/cameras', async (req, res) => {
  try {
    const { kind, search } = req.query;
    if (kind) {
      const rows = await all('SELECT * FROM cameras WHERE kind = ?', [kind]);
      return res.status(200).json(rows);
    }
    if (search) {
      const q = `%${search}%`;
      const rows = await all('SELECT * FROM cameras WHERE name LIKE ? OR kind LIKE ?', [q, q]);
      return res.status(200).json(rows);
    }
    const rows = await all('SELECT * FROM cameras');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cameras/:id', async (req, res) => {
  try {
    const camera = await get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });
    res.status(200).json(camera);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/cameras', async (req, res) => {
  try {
    const { name, kind } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Camera name is required' });
    }
    if (!kind || !ALLOWED_KINDS.includes(kind)) {
      return res.status(400).json({
        error: `Invalid kind: '${kind}'. Allowed values: ${ALLOWED_KINDS.join(', ')}`,
        allowedValues: ALLOWED_KINDS
      });
    }
    const result = await run('INSERT INTO cameras (name, kind) VALUES (?, ?)', [name.trim(), kind]);
    res.status(201).json({ id: result.id, name: name.trim(), kind });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/cameras/:id', async (req, res) => {
  try {
    const camera = await get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    const { name, kind } = req.body;
    if (kind !== undefined && !ALLOWED_KINDS.includes(kind)) {
      return res.status(400).json({
        error: `Invalid kind: '${kind}'. Allowed values: ${ALLOWED_KINDS.join(', ')}`,
        allowedValues: ALLOWED_KINDS
      });
    }
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Camera name cannot be empty' });
    }

    const updatedName = name ? name.trim() : camera.name;
    const updatedKind = kind || camera.kind;
    await run('UPDATE cameras SET name = ?, kind = ? WHERE id = ?', [updatedName, updatedKind, req.params.id]);
    res.status(200).json({ id: Number(req.params.id), name: updatedName, kind: updatedKind });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/cameras/:id', async (req, res) => {
  try {
    const camera = await get('SELECT * FROM cameras WHERE id = ?', [req.params.id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });
    await run('DELETE FROM cameras WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Camera deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/photographers', async (_req, res) => {
  try {
    const rows = await all('SELECT * FROM photographers');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/photographers/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM photographers WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Photographer not found' });
    res.status(200).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/photographers', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Photographer name is required' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const existing = await get('SELECT id FROM photographers WHERE email = ?', [email.trim()]);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const result = await run(
      'INSERT INTO photographers (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), phone ? phone.trim() : null]
    );
    res.status(201).json({ id: result.id, name: name.trim(), email: email.trim(), phone: phone || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/photographers/:id', async (req, res) => {
  try {
    const photographer = await get('SELECT * FROM photographers WHERE id = ?', [req.params.id]);
    if (!photographer) return res.status(404).json({ error: 'Photographer not found' });

    const { name, email, phone } = req.body;
    if (email) {
      const conflict = await get('SELECT id FROM photographers WHERE email = ? AND id != ?', [email.trim(), req.params.id]);
      if (conflict) return res.status(409).json({ error: 'Email already in use' });
    }
    const updatedName = name ? name.trim() : photographer.name;
    const updatedEmail = email ? email.trim() : photographer.email;
    const updatedPhone = phone !== undefined ? phone : photographer.phone;

    await run('UPDATE photographers SET name = ?, email = ?, phone = ? WHERE id = ?', [updatedName, updatedEmail, updatedPhone, req.params.id]);
    res.status(200).json({ id: Number(req.params.id), name: updatedName, email: updatedEmail, phone: updatedPhone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/photographers/:id', async (req, res) => {
  try {
    const photographer = await get('SELECT * FROM photographers WHERE id = ?', [req.params.id]);
    if (!photographer) return res.status(404).json({ error: 'Photographer not found' });
    await run('DELETE FROM photographers WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Photographer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/rentals/details', async (_req, res) => {
  try {
    const sql = `SELECT 
      rentals.id,
      rentals.rental_date,
      rentals.photographer_id,
      photographers.name AS photographer_name,
      photographers.email AS photographer_email,
      rentals.camera_id,
      cameras.name AS camera_name,
      cameras.kind AS camera_kind
    FROM rentals
    JOIN photographers ON rentals.photographer_id = photographers.id
    JOIN cameras ON rentals.camera_id = cameras.id
    ORDER BY rentals.rental_date DESC`;
    const rows = await all(sql);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/rentals', async (_req, res) => {
  try {
    const rows = await all('SELECT * FROM rentals');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/rentals/:id', async (req, res) => {
  try {
    const rental = await get('SELECT * FROM rentals WHERE id = ?', [req.params.id]);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.status(200).json(rental);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/rentals', async (req, res) => {
  try {
    const { photographer_id, camera_id, rental_date } = req.body;
    if (!photographer_id || !camera_id || !rental_date) {
      return res.status(400).json({ error: 'photographer_id, camera_id, and rental_date are required' });
    }
    const photographer = await get('SELECT id FROM photographers WHERE id = ?', [photographer_id]);
    if (!photographer) return res.status(404).json({ error: 'Photographer not found' });

    const camera = await get('SELECT id FROM cameras WHERE id = ?', [camera_id]);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    const booked = await get('SELECT id FROM rentals WHERE camera_id = ? AND rental_date = ?', [camera_id, rental_date]);
    if (booked) {
      return res.status(409).json({ error: 'Camera is already rented on this date' });
    }

    const result = await run(
      'INSERT INTO rentals (photographer_id, camera_id, rental_date) VALUES (?, ?, ?)',
      [photographer_id, camera_id, rental_date]
    );
    res.status(201).json({ id: result.id, photographer_id, camera_id, rental_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/rentals/:id', async (req, res) => {
  try {
    const rental = await get('SELECT * FROM rentals WHERE id = ?', [req.params.id]);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const photographer_id = req.body.photographer_id || rental.photographer_id;
    const camera_id = req.body.camera_id || rental.camera_id;
    const rental_date = req.body.rental_date || rental.rental_date;

    const conflict = await get(
      'SELECT id FROM rentals WHERE camera_id = ? AND rental_date = ? AND id != ?',
      [camera_id, rental_date, req.params.id]
    );
    if (conflict) {
      return res.status(409).json({ error: 'Camera is already rented on this date' });
    }

    await run(
      'UPDATE rentals SET photographer_id = ?, camera_id = ?, rental_date = ? WHERE id = ?',
      [photographer_id, camera_id, rental_date, req.params.id]
    );
    res.status(200).json({ id: Number(req.params.id), photographer_id, camera_id, rental_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/rentals/:id', async (req, res) => {
  try {
    const rental = await get('SELECT * FROM rentals WHERE id = ?', [req.params.id]);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    await run('DELETE FROM rentals WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Rental deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
