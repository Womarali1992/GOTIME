import express from 'express';
import { query, safeParseJSON } from '../db/database.js';

const router = express.Router();

// Get all clinics
router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM clinics WHERE tenant_id = $1', [req.tenantId]);
  res.json(rows.map(clinic => ({
    ...clinic,
    participants: safeParseJSON(clinic.participants, [])
  })));
});

// Get clinic by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM clinics WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Clinic not found' });
  }
  res.json({
    ...rows[0],
    participants: safeParseJSON(rows[0].participants, [])
  });
});

// Create clinic
router.post('/', async (req, res) => {
  const { coachId, title, description, date, startTime, endTime, timeSlotId, maxParticipants, participants, price, level } = req.body;
  const id = `clinic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  try {
    await query(
      `INSERT INTO clinics (id, tenant_id, "coachId", title, description, date, "startTime", "endTime", "timeSlotId", "maxParticipants", participants, price, level, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, req.tenantId, coachId, title, description, date, startTime, endTime, timeSlotId, maxParticipants || 8, JSON.stringify(participants || []), price || 0, level, createdAt]
    );

    const { rows } = await query('SELECT * FROM clinics WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    res.status(201).json({
      ...rows[0],
      participants: safeParseJSON(rows[0].participants, [])
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// Update clinic
router.put('/:id', async (req, res) => {
  const { title, description, maxParticipants, participants, price, level } = req.body;
  const updatedAt = new Date().toISOString();

  const result = await query(
    `UPDATE clinics SET title = $1, description = $2, "maxParticipants" = $3, participants = $4, price = $5, level = $6, "updatedAt" = $7 WHERE id = $8 AND tenant_id = $9`,
    [title, description, maxParticipants, JSON.stringify(participants || []), price, level, updatedAt, req.params.id, req.tenantId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Clinic not found' });
  }

  const { rows } = await query('SELECT * FROM clinics WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  res.json({
    ...rows[0],
    participants: safeParseJSON(rows[0].participants, [])
  });
});

// Delete clinic
router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM clinics WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Clinic not found' });
  }

  res.status(204).send();
});

export default router;
