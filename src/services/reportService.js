import api from '../api/axios';

export const reportService = {
  // Production summary - daily/weekly/monthly
  getProductionSummary: (params = {}) => api.get('/api/logs', { params }),

  // Party/Supplier wise logs
  getLogsByParty: (partyName, params = {}) =>
    api.get('/api/logs', { params: { ...params, search: partyName } }),

  // All logs with date filter
  getLogsByDate: (from, to, params = {}) =>
    api.get('/api/logs', { params: { ...params, from, to, limit: 500 } }),
};
