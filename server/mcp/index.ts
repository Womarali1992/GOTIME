import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { McpApiClient } from './api-client';
import { createToolHandlers } from './handlers';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TENANT_ID = process.env.TENANT_ID || 'default';

const apiClient = new McpApiClient(API_BASE_URL, TENANT_ID);
const handlers = createToolHandlers(apiClient);

const server = new McpServer({
  name: 'pickleball',
  version: '1.0.0',
});

server.registerTool(
  'list_courts',
  {
    description: 'List all available courts',
    inputSchema: {},
  },
  async () => handlers.list_courts({}),
);

server.registerTool(
  'list_available_slots',
  {
    description: 'Get time slots for a specific date, showing which are available for booking',
    inputSchema: {
      date: z.string().describe('Date in YYYY-MM-DD format'),
    },
  },
  async ({ date }) => handlers.list_available_slots({ date }),
);

server.registerTool(
  'get_reservation',
  {
    description: 'Get details of a specific reservation',
    inputSchema: {
      reservation_id: z.string().describe('The reservation ID'),
    },
  },
  async ({ reservation_id }) => handlers.get_reservation({ reservation_id }),
);

server.registerTool(
  'list_reservations',
  {
    description: 'List all reservations',
    inputSchema: {},
  },
  async () => handlers.list_reservations({}),
);

server.registerTool(
  'create_reservation',
  {
    description: 'Book a court time slot',
    inputSchema: {
      timeSlotId: z.string().describe('Time slot ID (format: courtId-YYYY-MM-DD-hour)'),
      courtId: z.string().describe('Court ID'),
      playerName: z.string().describe('Name of the person booking'),
      playerEmail: z.string().describe('Email address'),
      playerPhone: z.string().describe('Phone number'),
      players: z.number().min(1).max(4).optional().describe('Number of players (1-4, default 1)'),
    },
  },
  async (args) => handlers.create_reservation(args),
);

server.registerTool(
  'update_reservation',
  {
    description: 'Update an existing reservation',
    inputSchema: {
      reservation_id: z.string().describe('The reservation ID'),
      playerName: z.string().optional().describe('Updated name'),
      playerEmail: z.string().optional().describe('Updated email'),
      playerPhone: z.string().optional().describe('Updated phone'),
      players: z.number().min(1).max(4).optional().describe('Updated player count'),
    },
  },
  async (args) => handlers.update_reservation(args),
);

server.registerTool(
  'delete_reservation',
  {
    description: 'Cancel/delete a reservation (frees the time slot)',
    inputSchema: {
      reservation_id: z.string().describe('The reservation ID'),
    },
  },
  async ({ reservation_id }) => handlers.delete_reservation({ reservation_id }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pickleball MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
