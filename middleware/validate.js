const ALLOWED_KINDS = ['DSLR', 'Mirrorless', 'Action'];

const validateCameraPost = (req, res, next) => {
  const { name, kind } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Camera name is required and cannot be empty' });
  }
  if (!kind || typeof kind !== 'string' || !kind.trim()) {
    return res.status(400).json({ error: 'Camera kind is required and cannot be empty' });
  }
  if (!ALLOWED_KINDS.includes(kind)) {
    return res.status(400).json({
      error: `Invalid camera kind: '${kind}'. Allowed values: ${ALLOWED_KINDS.join(', ')}`,
      allowedValues: ALLOWED_KINDS
    });
  }
  req.body.name = name.trim();
  req.body.kind = kind.trim();
  next();
};

const validateCameraPut = (req, res, next) => {
  const { name, kind } = req.body || {};
  if (name === undefined && kind === undefined) {
    return res.status(400).json({ error: 'At least name or kind must be provided for update' });
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'Camera name cannot be empty' });
  }
  if (kind !== undefined && !ALLOWED_KINDS.includes(kind)) {
    return res.status(400).json({
      error: `Invalid camera kind: '${kind}'. Allowed values: ${ALLOWED_KINDS.join(', ')}`,
      allowedValues: ALLOWED_KINDS
    });
  }
  if (name !== undefined) req.body.name = name.trim();
  if (kind !== undefined) req.body.kind = kind.trim();
  next();
};

const validatePhotographer = (req, res, next) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Photographer name is required' });
  }
  req.body.name = name.trim();
  next();
};

const validateRental = (req, res, next) => {
  const { photographer_id, camera_id, rental_date } = req.body || {};
  if (!photographer_id || !camera_id || !rental_date) {
    return res.status(400).json({ error: 'photographer_id, camera_id, and rental_date are required' });
  }
  next();
};

module.exports = {
  ALLOWED_KINDS,
  validateCameraPost,
  validateCameraPut,
  validatePhotographer,
  validateRental
};
