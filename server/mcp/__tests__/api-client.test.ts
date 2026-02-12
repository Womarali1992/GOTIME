import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpApiClient } from '../api-client';

// ---- Mock global fetch ----
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'http://localhost:3001/api';
const TENANT_ID = 'test-tenant';

function okJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

function errorJson(status: number, body: { error: string }) {
  return {
    ok: false,
    status,
    json: async () => body,
  };
}

describe('McpApiClient', () => {
  let client: McpApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new McpApiClient(BASE_URL, TENANT_ID);
  });

  // ──────────────── Read operations ────────────────

  describe('read operations', () => {
    it('listCourts() calls GET {baseUrl}/courts with tenant header and returns parsed JSON array', async () => {
      const courts = [
        { id: 'court-1', name: 'Court 1' },
        { id: 'court-2', name: 'Court 2' },
      ];
      mockFetch.mockResolvedValueOnce(okJson(courts));

      const result = await client.listCourts();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/courts`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual(
        expect.objectContaining({ 'X-Tenant-ID': TENANT_ID }),
      );
      expect(result).toEqual(courts);
    });

    it('listAvailableSlots("2026-02-15") calls GET {baseUrl}/time-slots/date/2026-02-15 with tenant header', async () => {
      const slots = [
        { id: 'slot-1', status: 'available' },
        { id: 'slot-2', status: 'reserved' },
      ];
      mockFetch.mockResolvedValueOnce(okJson(slots));

      const result = await client.listAvailableSlots('2026-02-15');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/time-slots/date/2026-02-15`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual(
        expect.objectContaining({ 'X-Tenant-ID': TENANT_ID }),
      );
      expect(result).toEqual(slots);
    });

    it('getReservation("res-123") calls GET {baseUrl}/reservations/res-123 with tenant header', async () => {
      const reservation = { id: 'res-123', playerName: 'Alice' };
      mockFetch.mockResolvedValueOnce(okJson(reservation));

      const result = await client.getReservation('res-123');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/reservations/res-123`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual(
        expect.objectContaining({ 'X-Tenant-ID': TENANT_ID }),
      );
      expect(result).toEqual(reservation);
    });

    it('listReservations() calls GET {baseUrl}/reservations with tenant header', async () => {
      const reservations = [
        { id: 'res-1', playerName: 'Alice' },
        { id: 'res-2', playerName: 'Bob' },
      ];
      mockFetch.mockResolvedValueOnce(okJson(reservations));

      const result = await client.listReservations();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/reservations`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual(
        expect.objectContaining({ 'X-Tenant-ID': TENANT_ID }),
      );
      expect(result).toEqual(reservations);
    });
  });

  // ──────────────── Write operations ────────────────

  describe('write operations', () => {
    it('createReservation(data) calls POST {baseUrl}/reservations with JSON body, Content-Type, and tenant header', async () => {
      const requestData = {
        timeSlotId: 'court-1-2026-02-15-14',
        courtId: 'court-1',
        playerName: 'Alice',
        playerEmail: 'alice@example.com',
        playerPhone: '555-1234',
      };
      const created = { id: 'res-new', ...requestData };
      mockFetch.mockResolvedValueOnce(okJson(created));

      const result = await client.createReservation(requestData);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/reservations`);
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID,
        }),
      );
      expect(JSON.parse(options.body as string)).toEqual(requestData);
      expect(result).toEqual(created);
    });

    it('updateReservation("res-123", data) calls PUT {baseUrl}/reservations/res-123 with JSON body and tenant header', async () => {
      const updateData = { playerName: 'Alice Updated' };
      const updated = { id: 'res-123', ...updateData };
      mockFetch.mockResolvedValueOnce(okJson(updated));

      const result = await client.updateReservation('res-123', updateData);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/reservations/res-123`);
      expect(options.method).toBe('PUT');
      expect(options.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID,
        }),
      );
      expect(JSON.parse(options.body as string)).toEqual(updateData);
      expect(result).toEqual(updated);
    });

    it('deleteReservation("res-123") calls DELETE {baseUrl}/reservations/res-123 with tenant header and returns success', async () => {
      mockFetch.mockResolvedValueOnce(okJson({ success: true }));

      const result = await client.deleteReservation('res-123');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/reservations/res-123`);
      expect(options.method).toBe('DELETE');
      expect(options.headers).toEqual(
        expect.objectContaining({ 'X-Tenant-ID': TENANT_ID }),
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ──────────────── Error handling ────────────────

  describe('error handling', () => {
    it('throws error containing message from JSON error body on non-2xx response', async () => {
      mockFetch.mockResolvedValueOnce(errorJson(409, { error: 'Slot not available' }));

      await expect(client.listCourts()).rejects.toThrow('Slot not available');
    });

    it('throws error containing "API server not reachable" when fetch rejects (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(client.listCourts()).rejects.toThrow('API server not reachable');
    });
  });
});
