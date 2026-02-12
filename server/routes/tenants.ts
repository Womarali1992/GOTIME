import express from 'express';
import { query, getClient } from '../db/database.js';
import { DEFAULT_OPERATING_HOURS } from '../utils/defaults.js';

const router = express.Router();

// Protect all tenant management routes with API key
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = process.env.SUPER_ADMIN_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Tenant management is not configured' });
  }

  const provided = req.headers['x-api-key'] || req.query.apiKey;
  if (provided !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

router.use(requireApiKey);

// List all tenants
router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT * FROM tenants ORDER BY "createdAt" DESC');
  res.json(rows);
});

// Get tenant by ID
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(rows[0]);
});

// Create (provision) a new tenant
router.post('/', async (req, res) => {
  const { slug, name, domain, plan } = req.body;

  if (!slug || !name) {
    return res.status(400).json({ error: 'slug and name are required' });
  }

  // Validate slug format (lowercase alphanumeric + hyphens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'slug must be lowercase alphanumeric with hyphens only' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();
    const tenantId = slug; // Use slug as the tenant ID for simplicity

    // Insert tenant
    await client.query(
      `INSERT INTO tenants (id, slug, name, domain, plan, "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
      [tenantId, slug, name, domain || null, plan || 'basic', now]
    );

    // Insert default settings
    await client.query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [`settings-${tenantId}`, tenantId, name, 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), now]
    );

    // Insert a starter court
    await client.query(
      `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [`${tenantId}-court-1`, tenantId, 'Court 1', '', 'Main court', JSON.stringify(['Nets']), now]
    );

    await client.query('COMMIT');

    const { rows } = await query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A tenant with that slug already exists' });
    }
    console.error('[Tenants] Failed to create tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  } finally {
    client.release();
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  const { name, domain, plan, isActive } = req.body;

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
  if (domain !== undefined) { fields.push(`domain = $${paramIndex++}`); values.push(domain); }
  if (plan !== undefined) { fields.push(`plan = $${paramIndex++}`); values.push(plan); }
  if (isActive !== undefined) { fields.push(`"isActive" = $${paramIndex++}`); values.push(isActive); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);

  const result = await query(
    `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const { rows } = await query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

// Delete tenant (cascades to all tenant data)
router.delete('/:id', async (req, res) => {
  if (req.params.id === 'default') {
    return res.status(400).json({ error: 'Cannot delete the default tenant' });
  }

  const result = await query('DELETE FROM tenants WHERE id = $1', [req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  res.status(204).send();
});

export default router;
