import api from '../api/axios';

export const logService = {
  getAll: (params = {}) => api.get('/api/logs', { params }),
  getActive: () => api.get('/api/logs/active'),
  getById: (id) => api.get(`/api/logs/${id}`),
  getByVehicleNumber: (num) => api.get(`/api/logs/vehicle/${num}`),
  logEntry: (data) => api.post('/api/logs/entry', data),
  logExit: (data) => api.put('/api/logs/exit', data),
  updateLog: (id, data) => api.put(`/api/logs/${id}`, data),
};