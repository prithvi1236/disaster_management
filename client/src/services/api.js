const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const url = BASE + path;
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  // If using Supabase JWT, include it here (example)
  // const token = localStorage.getItem('supabase_token');
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Request failed: ${resp.status}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  } else {
    return resp.text();
  }
}

export async function fetchDisasters() {
  return request('/disasters', { method: 'GET' });
}

export async function fetchDisaster(id) {
  return request(`/disasters/${id}`, { method: 'GET' });
}

export async function postVolunteer(volunteer) {
  return request('/volunteers', {
    method: 'POST',
    body: JSON.stringify(volunteer)
  });
}

export async function postDonation(donation) {
  return request('/donations', {
    method: 'POST',
    body: JSON.stringify(donation)
  });
}
