export class McpApiClient {
  private baseUrl: string;
  private tenantId: string;

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      'X-Tenant-ID': this.tenantId,
    };

    const options: RequestInit = { method, headers };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, options);
    } catch {
      throw new Error('API server not reachable');
    }

    if (!response.ok) {
      const errorBody = await response.json() as { error?: string };
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async listCourts(): Promise<unknown> {
    return this.request('GET', '/courts');
  }

  async listAvailableSlots(date: string): Promise<unknown> {
    return this.request('GET', `/time-slots/date/${date}`);
  }

  async getReservation(id: string): Promise<unknown> {
    return this.request('GET', `/reservations/${id}`);
  }

  async listReservations(): Promise<unknown> {
    return this.request('GET', '/reservations');
  }

  async createReservation(data: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', '/reservations', data);
  }

  async updateReservation(id: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('PUT', `/reservations/${id}`, data);
  }

  async deleteReservation(id: string): Promise<unknown> {
    return this.request('DELETE', `/reservations/${id}`);
  }
}
