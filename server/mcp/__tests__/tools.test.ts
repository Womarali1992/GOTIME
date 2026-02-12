import { describe, it, expect } from 'vitest';
import { toolDefinitions } from '../tools';

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

describe('toolDefinitions', () => {
  it('exports an array of exactly 7 tool definitions', () => {
    expect(Array.isArray(toolDefinitions)).toBe(true);
    expect(toolDefinitions).toHaveLength(7);
  });

  it('each definition has name (string), description (string), and inputSchema (object)', () => {
    for (const tool of toolDefinitions as ToolDefinition[]) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.inputSchema).toBe('object');
      expect(tool.inputSchema).not.toBeNull();
    }
  });

  it('contains tools named: list_courts, list_available_slots, get_reservation, list_reservations, create_reservation, update_reservation, delete_reservation', () => {
    const expectedNames = [
      'list_courts',
      'list_available_slots',
      'get_reservation',
      'list_reservations',
      'create_reservation',
      'update_reservation',
      'delete_reservation',
    ];

    const actualNames = (toolDefinitions as ToolDefinition[]).map((t) => t.name);

    for (const name of expectedNames) {
      expect(actualNames).toContain(name);
    }
  });

  it('list_courts inputSchema has no required fields', () => {
    const listCourts = (toolDefinitions as ToolDefinition[]).find(
      (t) => t.name === 'list_courts',
    );
    expect(listCourts).toBeDefined();

    const schema = listCourts!.inputSchema;
    const hasNoRequired =
      !schema.required || schema.required.length === 0;
    expect(hasNoRequired).toBe(true);
  });

  it('list_available_slots inputSchema has a date property', () => {
    const listSlots = (toolDefinitions as ToolDefinition[]).find(
      (t) => t.name === 'list_available_slots',
    );
    expect(listSlots).toBeDefined();
    expect(listSlots!.inputSchema.properties).toBeDefined();
    expect(listSlots!.inputSchema.properties).toHaveProperty('date');
  });

  it('create_reservation inputSchema has properties: timeSlotId, courtId, playerName, playerEmail, playerPhone', () => {
    const createRes = (toolDefinitions as ToolDefinition[]).find(
      (t) => t.name === 'create_reservation',
    );
    expect(createRes).toBeDefined();

    const properties = createRes!.inputSchema.properties;
    expect(properties).toBeDefined();
    expect(properties).toHaveProperty('timeSlotId');
    expect(properties).toHaveProperty('courtId');
    expect(properties).toHaveProperty('playerName');
    expect(properties).toHaveProperty('playerEmail');
    expect(properties).toHaveProperty('playerPhone');
  });
});
