import type { McpApiClient } from './api-client';

interface McpTextContent {
  type: 'text';
  text: string;
}

interface McpToolResponse {
  content: McpTextContent[];
  isError?: boolean;
}

type ApiClient = Pick<McpApiClient,
  'listCourts' | 'listAvailableSlots' | 'getReservation' |
  'listReservations' | 'createReservation' | 'updateReservation' | 'deleteReservation'
>;

function success(data: unknown): McpToolResponse {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function error(err: unknown): McpToolResponse {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

export function createToolHandlers(
  apiClient: ApiClient,
): Record<string, (args: Record<string, unknown>) => Promise<McpToolResponse>> {
  return {
    list_courts: async () => {
      try {
        return success(await apiClient.listCourts());
      } catch (err) {
        return error(err);
      }
    },

    list_available_slots: async (args) => {
      try {
        return success(await apiClient.listAvailableSlots(args.date as string));
      } catch (err) {
        return error(err);
      }
    },

    get_reservation: async (args) => {
      try {
        return success(await apiClient.getReservation(args.reservation_id as string));
      } catch (err) {
        return error(err);
      }
    },

    list_reservations: async () => {
      try {
        return success(await apiClient.listReservations());
      } catch (err) {
        return error(err);
      }
    },

    create_reservation: async (args) => {
      try {
        const { reservation_id: _unused, ...data } = args;
        return success(await apiClient.createReservation(data as Record<string, unknown>));
      } catch (err) {
        return error(err);
      }
    },

    update_reservation: async (args) => {
      try {
        const { reservation_id, ...data } = args;
        return success(await apiClient.updateReservation(reservation_id as string, data));
      } catch (err) {
        return error(err);
      }
    },

    delete_reservation: async (args) => {
      try {
        return success(await apiClient.deleteReservation(args.reservation_id as string));
      } catch (err) {
        return error(err);
      }
    },
  };
}
