interface ToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_courts',
    description: 'List all available courts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_available_slots',
    description: 'Get time slots for a specific date, showing which are available for booking',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_reservation',
    description: 'Get details of a specific reservation',
    inputSchema: {
      type: 'object',
      properties: {
        reservation_id: { type: 'string', description: 'The reservation ID' },
      },
      required: ['reservation_id'],
    },
  },
  {
    name: 'list_reservations',
    description: 'List all reservations',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_reservation',
    description: 'Book a court time slot',
    inputSchema: {
      type: 'object',
      properties: {
        timeSlotId: { type: 'string', description: 'Time slot ID (format: courtId-YYYY-MM-DD-hour)' },
        courtId: { type: 'string', description: 'Court ID' },
        playerName: { type: 'string', description: 'Name of the person booking' },
        playerEmail: { type: 'string', description: 'Email address' },
        playerPhone: { type: 'string', description: 'Phone number' },
        players: { type: 'number', description: 'Number of players (1-4, default 1)' },
      },
      required: ['timeSlotId', 'courtId', 'playerName', 'playerEmail', 'playerPhone'],
    },
  },
  {
    name: 'update_reservation',
    description: 'Update an existing reservation',
    inputSchema: {
      type: 'object',
      properties: {
        reservation_id: { type: 'string', description: 'The reservation ID' },
        playerName: { type: 'string', description: 'Updated name' },
        playerEmail: { type: 'string', description: 'Updated email' },
        playerPhone: { type: 'string', description: 'Updated phone' },
        players: { type: 'number', description: 'Updated player count' },
      },
      required: ['reservation_id'],
    },
  },
  {
    name: 'delete_reservation',
    description: 'Cancel/delete a reservation (frees the time slot)',
    inputSchema: {
      type: 'object',
      properties: {
        reservation_id: { type: 'string', description: 'The reservation ID' },
      },
      required: ['reservation_id'],
    },
  },
];
