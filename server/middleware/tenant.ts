import { Request, Response, NextFunction } from 'express';
import { query } from '../db/database.js';

// Extend Express Request to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Tenant resolution middleware.
 *
 * Production: extracts subdomain from Host header
 *   e.g. citypark.picklepop.com → slug "citypark"
 *
 * Development: uses X-Tenant-ID header or ?tenant= query param,
 *   falling back to "default"
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    let slug: string | undefined;

    // 1. Check X-Tenant-ID header (dev convenience + frontend in production)
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenant) {
      slug = headerTenant;
    }

    // 2. Check query param (dev convenience)
    if (!slug && req.query.tenant) {
      slug = req.query.tenant as string;
    }

    // 3. Extract subdomain from Host header (production)
    if (!slug) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      // Expect subdomain.domain.tld (3+ parts) for subdomain-based tenancy
      if (parts.length >= 3) {
        slug = parts[0];
      }
    }

    // 4. Fallback to "default" tenant
    if (!slug) {
      slug = 'default';
    }

    // Look up tenant
    const { rows } = await query(
      'SELECT id, "isActive" FROM tenants WHERE slug = $1 OR id = $1',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Tenant not found: ${slug}` });
    }

    if (!rows[0].isActive) {
      return res.status(403).json({ error: 'Tenant is inactive' });
    }

    req.tenantId = rows[0].id;
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve tenant' });
  }
}
