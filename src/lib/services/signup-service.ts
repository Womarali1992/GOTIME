const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

interface Venue {
  id: string;
  slug: string;
  name: string;
}

interface SignupResponse {
  tenant: { id: string; slug: string; name: string };
  user?: { id: string; name: string; email: string };
  coach?: { id: string; name: string; email: string };
  group?: { id: string; name: string };
  redirectUrl: string | null;
}

async function post(path: string, body: Record<string, unknown>): Promise<SignupResponse> {
  const res = await fetch(`${API_BASE_URL}/signup${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Signup failed');
  }
  return data;
}

export const signupService = {
  async fetchVenues(): Promise<Venue[]> {
    const res = await fetch(`${API_BASE_URL}/signup/venues`);
    if (!res.ok) throw new Error('Failed to load venues');
    return res.json();
  },

  venue(body: Record<string, unknown>) {
    return post('/venue', body);
  },

  coach(body: Record<string, unknown>) {
    return post('/coach', body);
  },

  socialGroup(body: Record<string, unknown>) {
    return post('/social-group', body);
  },

  player(body: Record<string, unknown>) {
    return post('/player', body);
  },
};
