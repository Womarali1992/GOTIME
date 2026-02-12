import express from 'express';
import crypto from 'crypto';
import { query, getClient } from '../db/database.js';
import { DEFAULT_OPERATING_HOURS } from '../utils/defaults.js';

const router = express.Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate a URL-safe slug from a name, with numeric suffix on collision */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);

  // Check if the base slug is available
  const { rows } = await query('SELECT slug FROM tenants WHERE slug = $1', [base]);
  if (rows.length === 0) return base;

  // Append numeric suffix until unique
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    const { rows: check } = await query('SELECT slug FROM tenants WHERE slug = $1', [candidate]);
    if (check.length === 0) return candidate;
  }

  // Fallback: append random string
  return `${base}-${Math.random().toString(36).substr(2, 6)}`;
}

// GET /api/signup/venues — list active tenants for dropdowns
router.get('/venues', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, slug, name FROM tenants WHERE "isActive" = TRUE ORDER BY name`
    );
    res.json(rows);
  } catch (error) {
    console.error('[Signup] Failed to fetch venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// POST /api/signup/venue — create tenant + settings + courts + admin user
router.post('/venue', async (req, res) => {
  const { venueName, address, numCourts, contactName, contactEmail, contactPhone, password } = req.body;

  if (!venueName || !contactName || !contactEmail || !contactPhone || !password) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();
    const slug = await generateUniqueSlug(venueName);
    const tenantId = slug;
    const hashedPassword = hashPassword(password);

    // Create tenant
    await client.query(
      `INSERT INTO tenants (id, slug, name, "isActive", "createdAt") VALUES ($1, $2, $3, TRUE, $4)`,
      [tenantId, slug, venueName, now]
    );

    // Create default settings
    await client.query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [`settings-${tenantId}`, tenantId, venueName, 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), now]
    );

    // Create courts
    const courtCount = Math.min(Math.max(parseInt(numCourts) || 1, 1), 20);
    for (let i = 1; i <= courtCount; i++) {
      await client.query(
        `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`${tenantId}-court-${i}`, tenantId, `Court ${i}`, address || '', '', JSON.stringify(['Nets']), now]
      );
    }

    // Create admin user
    const userId = generateId('user');
    await client.query(
      `INSERT INTO users (id, tenant_id, name, email, phone, password, "membershipType", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, tenantId, contactName, contactEmail, contactPhone, hashedPassword, 'admin', now]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tenant: { id: tenantId, slug, name: venueName },
      user: { id: userId, name: contactName, email: contactEmail },
      redirectUrl: `https://${slug}.picklepop.com/#/admin`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A venue with that name or email already exists' });
    }
    console.error('[Signup] Venue signup failed:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  } finally {
    client.release();
  }
});

// POST /api/signup/coach — standalone (new tenant) or join existing venue
router.post('/coach', async (req, res) => {
  const { name, email, phone, bio, specialties, hourlyRate, mode, venueId, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();
    const hashedPassword = hashPassword(password);
    const coachId = generateId('coach');

    // Parse specialties from comma-separated string
    const specialtiesArray = specialties
      ? specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    let tenantId: string;
    let slug: string;
    let tenantName: string;

    if (mode === 'standalone') {
      // Create a new tenant for the coach
      slug = await generateUniqueSlug(name);
      tenantId = slug;
      tenantName = `${name}'s Coaching`;

      await client.query(
        `INSERT INTO tenants (id, slug, name, "isActive", "createdAt") VALUES ($1, $2, $3, TRUE, $4)`,
        [tenantId, slug, tenantName, now]
      );

      // Create default settings
      await client.query(
        `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [`settings-${tenantId}`, tenantId, tenantName, 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), now]
      );

      // Create a default court
      await client.query(
        `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`${tenantId}-court-1`, tenantId, 'Court 1', '', '', JSON.stringify(['Nets']), now]
      );
    } else {
      // Join existing venue
      if (!venueId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Venue selection is required when joining an existing venue' });
      }

      const { rows: tenantRows } = await client.query(
        'SELECT id, slug, name FROM tenants WHERE id = $1 AND "isActive" = TRUE',
        [venueId]
      );
      if (tenantRows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Selected venue not found' });
      }

      tenantId = tenantRows[0].id;
      slug = tenantRows[0].slug;
      tenantName = tenantRows[0].name;
    }

    // Create the coach
    await client.query(
      `INSERT INTO coaches (id, tenant_id, name, email, phone, bio, specialties, "hourlyRate", password, "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)`,
      [coachId, tenantId, name, email, phone || '', bio || '', JSON.stringify(specialtiesArray), parseFloat(hourlyRate) || 0, hashedPassword, now]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tenant: { id: tenantId, slug, name: tenantName },
      coach: { id: coachId, name, email },
      redirectUrl: mode === 'standalone'
        ? `https://${slug}.picklepop.com/#/coach-dashboard`
        : null,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A coach with that email already exists at this venue' });
    }
    console.error('[Signup] Coach signup failed:', error);
    res.status(500).json({ error: 'Failed to create coach account' });
  } finally {
    client.release();
  }
});

// POST /api/signup/social-group — create tenant + organizer user + social group
router.post('/social-group', async (req, res) => {
  const { groupName, organizerName, email, phone, description, skillLevel, password } = req.body;

  if (!groupName || !organizerName || !email || !password) {
    return res.status(400).json({ error: 'Group name, organizer name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();
    const slug = await generateUniqueSlug(groupName);
    const tenantId = slug;
    const hashedPassword = hashPassword(password);
    const userId = generateId('user');
    const groupId = generateId('group');

    // Create tenant
    await client.query(
      `INSERT INTO tenants (id, slug, name, "isActive", "createdAt") VALUES ($1, $2, $3, TRUE, $4)`,
      [tenantId, slug, groupName, now]
    );

    // Create default settings
    await client.query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [`settings-${tenantId}`, tenantId, groupName, 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), now]
    );

    // Create organizer user
    await client.query(
      `INSERT INTO users (id, tenant_id, name, email, phone, password, "membershipType", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, tenantId, organizerName, email, phone || '', hashedPassword, 'admin', now]
    );

    // Create social group
    await client.query(
      `INSERT INTO social_groups (id, tenant_id, name, description, "skillLevel", "organizerId", "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)`,
      [groupId, tenantId, groupName, description || '', skillLevel || null, userId, now]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tenant: { id: tenantId, slug, name: groupName },
      user: { id: userId, name: organizerName, email },
      group: { id: groupId, name: groupName },
      redirectUrl: `https://${slug}.picklepop.com/#/`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A group with that name or email already exists' });
    }
    console.error('[Signup] Social group signup failed:', error);
    res.status(500).json({ error: 'Failed to create social group' });
  } finally {
    client.release();
  }
});

// POST /api/signup/player — create user in selected tenant
router.post('/player', async (req, res) => {
  const { name, email, phone, duprRating, tenantId, password } = req.body;

  if (!name || !email || !password || !tenantId) {
    return res.status(400).json({ error: 'Name, email, password, and venue selection are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify the tenant exists and is active
    const { rows: tenantRows } = await client.query(
      'SELECT id, slug, name FROM tenants WHERE id = $1 AND "isActive" = TRUE',
      [tenantId]
    );
    if (tenantRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Selected venue not found' });
    }

    const tenant = tenantRows[0];
    const now = new Date().toISOString();
    const userId = generateId('user');
    const hashedPassword = hashPassword(password);

    await client.query(
      `INSERT INTO users (id, tenant_id, name, email, phone, password, "membershipType", "duprRating", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, tenantId, name, email, phone || '', hashedPassword, 'basic', duprRating ? parseFloat(duprRating) : null, now]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: { id: userId, name, email },
      redirectUrl: null,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists at this venue' });
    }
    console.error('[Signup] Player signup failed:', error);
    res.status(500).json({ error: 'Failed to create player account' });
  } finally {
    client.release();
  }
});

export default router;
