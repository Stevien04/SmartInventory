import { request } from './api.js';

export const authService = {
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('smartinventory_token', data.token);
      localStorage.setItem('smartinventory_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('smartinventory_token');
    localStorage.removeItem('smartinventory_user');
  },

  getCurrentUser() {
    const u = localStorage.getItem('smartinventory_user');
    return u ? JSON.parse(u) : null;
  }
};
