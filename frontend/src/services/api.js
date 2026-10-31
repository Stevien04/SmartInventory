const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('smartinventory_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud');
  }

  return data;
}
