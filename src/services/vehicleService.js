import api from '../api/axios';

export const vehicleService = {
  getAll: (params = {}) => api.get('/api/vehicles', { params }),
  getById: (id) => api.get(`/api/vehicles/${id}`),
  create: (data) => api.post('/api/vehicles', data),
  update: (id, data) => api.put(`/api/vehicles/${id}`, data),
  delete: (id) => api.delete(`/api/vehicles/${id}`),
};