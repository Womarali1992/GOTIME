import express from 'express';
import { query } from '../db/database.js';
import crypto from 'crypto';

const router = express.Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, req.tenantId]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.password) {
    return res.status(401).json({ error: 'Account has no password set. Please sign up again.' });
  }

  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  const { name, email, phone, password, duprRating } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, req.tenantId]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();
  const hashedPassword = hashPassword(password);

  try {
    await query(
      `INSERT INTO users (id, tenant_id, name, email, phone, password, "membershipType", "duprRating", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, req.tenantId, name, email, phone, hashedPassword, 'basic', duprRating || null, createdAt]
    );
    const { rows } = await query(
      `SELECT id, name, email, phone, "membershipType", "duprRating", "createdAt" FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, req.tenantId]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get all users (without passwords)
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, email, phone, "membershipType", "duprRating", "preferredPosition", "createdAt", "updatedAt" FROM users WHERE tenant_id = $1`,
    [req.tenantId]
  );
  res.json(rows);
});

// Get user by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(rows[0]);
});

// Create user
router.post('/', async (req, res) => {
  const { name, email, phone, duprRating, preferredPosition } = req.body;
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  try {
    await query(
      `INSERT INTO users (id, tenant_id, name, email, phone, "duprRating", "preferredPosition", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, req.tenantId, name, email, phone, duprRating, preferredPosition, createdAt]
    );
    const { rows } = await query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { name, email, phone, duprRating, preferredPosition } = req.body;
  const updatedAt = new Date().toISOString();

  try {
    const result = await query(
      `UPDATE users SET name = $1, email = $2, phone = $3, "duprRating" = $4, "preferredPosition" = $5, "updatedAt" = $6 WHERE id = $7 AND tenant_id = $8`,
      [name, email, phone, duprRating, preferredPosition, updatedAt, req.params.id, req.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { rows } = await query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);
    res.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenantId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(204).send();
});

export default router;
