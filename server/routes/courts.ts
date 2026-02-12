import express from 'express';
import { query, safeParseJSON } from '../db/database.js';

const router = express.Router();

// Get all courts
router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM courts WHERE tenant_id = $1', [req.tenantId]);
  res.json(rows.map(court => ({
    ...court,
    amenities: safeParseJSON(court.amenities, [])
  })));
});

// Get court by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM courts WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Court not found' });
  }
  res.json({
    ...rows[0],
    amenities: safeParseJSON(rows[0].amenities, [])
  });
});

// Create court
router.post('/', async (req, res) => {
  const { name, location, description, amenities } = req.body;
  const id = `court-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, req.tenantId, name, location, description, JSON.stringify(amenities || []), createdAt]
  );

  const { rows } = await query('SELECT * FROM courts WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
  res.status(201).json({
    ...rows[0],
    amenities: safeParseJSON(rows[0].amenities, [])
  });
});

// Update court
router.put('/:id', async (req, res) => {
  const { name, location, description, amenities } = req.body;
  const updatedAt = new Date().toISOString();

  const result = await query(
    `UPDATE courts SET name = $1, location = $2, description = $3, amenities = $4, "updatedAt" = $5 WHERE id = $6 AND tenant_id = $7`,
    [name, location, description, JSON.stringify(amenities || []), updatedAt, req.params.id, req.tenantId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Court not found' });
  }

  const { rows } = await query('SELECT * FROM courts WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  res.json({
    ...rows[0],
    amenities: safeParseJSON(rows[0].amenities, [])
  });
});

// Delete court
router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM courts WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Court not found' });
  }

  res.status(204).send();
});

export default router;
