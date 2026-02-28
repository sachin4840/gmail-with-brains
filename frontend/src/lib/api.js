const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Make an authenticated API call to the backend.
 */
export async function apiFetch(path, { method = 'GET', body, supabaseToken, googleToken } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (supabaseToken) {
    headers['Authorization'] = `Bearer ${supabaseToken}`;
  }
  if (googleToken) {
    headers['X-Google-Token'] = googleToken;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}
