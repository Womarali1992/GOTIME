import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToolHandlers } from '../handlers';

// ---- Types for the MCP response format ----

interface McpTextContent {
  type: 'text';
  text: string;
}

interface McpToolResponse {
  content: McpTextContent[];
  isError?: boolean;
}

// ---- Mock API client matching McpApiClient's interface ----

function createMockApiClient() {
  return {
    listCourts: vi.fn(),
    listAvailableSlots: vi.fn(),
    getReservation: vi.fn(),
    listReservations: vi.fn(),
    createReservation: vi.fn(),
    updateReservation: vi.fn(),
    deleteReservation: vi.fn(),
  };
}

describe('createToolHandlers', () => {
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<McpToolResponse>>;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    handlers = createToolHandlers(mockApiClient);
  });

  describe('list_courts handler', () => {
    it('calls apiClient.listCourts() and returns result as JSON text content', async () => {
      const courts = [
        { id: 'court-1', name: 'Court 1' },
        { id: 'court-2', name: 'Court 2' },
      ];
      mockApiClient.listCourts.mockResolvedValueOnce(courts);

      const response = await handlers['list_courts']({});

      expect(mockApiClient.listCourts).toHaveBeenCalledOnce();
      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(courts) }],
      });
    });
  });

  describe('list_available_slots handler', () => {
    it('calls apiClient.listAvailableSlots with the provided date', async () => {
      const slots = [
        { id: 'slot-1', status: 'available' },
        { id: 'slot-2', status: 'available' },
      ];
      mockApiClient.listAvailableSlots.mockResolvedValueOnce(slots);

      const response = await handlers['list_available_slots']({ date: '2026-02-15' });

      expect(mockApiClient.listAvailableSlots).toHaveBeenCalledWith('2026-02-15');
      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(slots) }],
      });
    });
  });

  describe('create_reservation handler', () => {
    it('calls apiClient.createReservation with the provided data and returns created object', async () => {
      const reservationData = {
        timeSlotId: 'court-1-2026-02-15-14',
        courtId: 'court-1',
        playerName: 'Alice',
        playerEmail: 'alice@example.com',
        playerPhone: '555-1234',
      };
      const created = { id: 'res-new', ...reservationData };
      mockApiClient.createReservation.mockResolvedValueOnce(created);

      const response = await handlers['create_reservation'](reservationData);

      expect(mockApiClient.createReservation).toHaveBeenCalledWith(reservationData);
      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(created) }],
      });
    });
  });

  describe('delete_reservation handler', () => {
    it('calls apiClient.deleteReservation with the reservation_id and returns confirmation', async () => {
      const deleteResult = { success: true };
      mockApiClient.deleteReservation.mockResolvedValueOnce(deleteResult);

      const response = await handlers['delete_reservation']({ reservation_id: 'res-123' });

      expect(mockApiClient.deleteReservation).toHaveBeenCalledWith('res-123');
      expect(response).toEqual({
        content: [{ type: 'text', text: JSON.stringify(deleteResult) }],
      });
    });
  });

  describe('error handling', () => {
    it('returns isError: true with error message when API client throws', async () => {
      mockApiClient.listCourts.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await handlers['list_courts']({});

      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toEqual(expect.stringContaining('Error'));
    });

    it('returns isError: true when create_reservation fails', async () => {
      mockApiClient.createReservation.mockRejectedValueOnce(
        new Error('Slot not available'),
      );

      const response = await handlers['create_reservation']({
        timeSlotId: 'court-1-2026-02-15-14',
        courtId: 'court-1',
        playerName: 'Alice',
        playerEmail: 'alice@example.com',
        playerPhone: '555-1234',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toEqual(expect.stringContaining('Error'));
    });
  });
});
