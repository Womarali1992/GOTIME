import express from 'express';
import { query, safeParseJSON } from '../db/database.js';
import crypto from 'crypto';

const router = express.Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function formatCoach(coach: any) {
  const { password, ...rest } = coach;
  return {
    ...rest,
    specialties: safeParseJSON(coach.specialties, []),
    availability: safeParseJSON(coach.availability, []),
    isActive: Boolean(coach.isActive),
  };
}

// Coach login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await query('SELECT * FROM coaches WHERE email = $1 AND tenant_id = $2', [email, req.tenantId]);
  const coach = rows[0];

  if (!coach) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!coach.isActive) {
    return res.status(401).json({ error: 'Coach account is inactive' });
  }

  let passwordValid = false;
  if (coach.password) {
    if (coach.password.length === 64) {
      passwordValid = verifyPassword(password, coach.password);
    } else {
      passwordValid = coach.password === password;
      if (passwordValid) {
        await query('UPDATE coaches SET password = $1 WHERE id = $2 AND tenant_id = $3', [hashPassword(password), coach.id, req.tenantId]);
      }
    }
  }

  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json(formatCoach(coach));
});

// Get all coaches
router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM coaches WHERE tenant_id = $1', [req.tenantId]);
  res.json(rows.map(formatCoach));
});

// Get coach by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM coaches WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Coach not found' });
  }
  res.json(formatCoach(rows[0]));
});

// Create coach
router.post('/', async (req, res) => {
  const { name, email, phone, bio, specialties, hourlyRate, password, isActive, availability } = req.body;
  const id = `coach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();
  const hashedPassword = hashPassword(password || 'password123');

  try {
    await query(
      `INSERT INTO coaches (id, tenant_id, name, email, phone, bio, specialties, "hourlyRate", password, "isActive", availability, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, req.tenantId, name, email, phone, bio, JSON.stringify(specialties || []), hourlyRate, hashedPassword, isActive !== false, JSON.stringify(availability || []), createdAt]
    );
    const { rows } = await query('SELECT * FROM coaches WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    res.status(201).json(formatCoach(rows[0]));
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// Update coach
router.put('/:id', async (req, res) => {
  const { name, email, phone, bio, specialties, hourlyRate, password, isActive, availability } = req.body;
  const updatedAt = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
  if (email !== undefined) { fields.push(`email = $${paramIndex++}`); values.push(email); }
  if (phone !== undefined) { fields.push(`phone = $${paramIndex++}`); values.push(phone); }
  if (bio !== undefined) { fields.push(`bio = $${paramIndex++}`); values.push(bio); }
  if (specialties !== undefined) { fields.push(`specialties = $${paramIndex++}`); values.push(JSON.stringify(specialties || [])); }
  if (hourlyRate !== undefined) { fields.push(`"hourlyRate" = $${paramIndex++}`); values.push(hourlyRate); }
  if (password !== undefined) { fields.push(`password = $${paramIndex++}`); values.push(hashPassword(password)); }
  if (isActive !== undefined) { fields.push(`"isActive" = $${paramIndex++}`); values.push(isActive); }
  if (availability !== undefined) { fields.push(`availability = $${paramIndex++}`); values.push(JSON.stringify(availability || [])); }
  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(updatedAt);
  values.push(req.params.id);
  values.push(req.tenantId);

  try {
    const result = await query(
      `UPDATE coaches SET ${fields.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    const { rows } = await query('SELECT * FROM coaches WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
    res.json(formatCoach(rows[0]));
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

// Delete coach
router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM coaches WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Coach not found' });
  }

  res.status(204).send();
});

export default router;
