const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal Fetch Client with JWT Token Injection & Error Handling
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cleantrack_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.warn(`[CleanTrack API Connection Notice] ${endpoint}:`, error.message);
    throw error;
  }
}

// Authentication APIs
export const authApi = {
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// Complaint APIs
export const complaintApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/complaints${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getById: (id) => apiRequest(`/complaints/${id}`, { method: 'GET' }),
  create: (complaintData) => apiRequest('/complaints', { method: 'POST', body: JSON.stringify(complaintData) }),
  updateStatus: (id, status, extraData = {}) => apiRequest(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ...extraData }) }),
  assignSquad: (id, squadData) => apiRequest(`/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify(squadData) }),
  submitWorkerEvidence: (id, evidenceData) => apiRequest(`/complaints/${id}/worker-evidence`, { method: 'POST', body: JSON.stringify(evidenceData) })
};

// AI Vision & Telemetry APIs
export const aiApi = {
  analyze: (data) => apiRequest('/ai/analyze', { method: 'POST', body: JSON.stringify(data) }),
  checkDuplicates: (data) => apiRequest('/ai/duplicate', { method: 'POST', body: JSON.stringify(data) }),
  calculateSeverity: (data) => apiRequest('/ai/severity', { method: 'POST', body: JSON.stringify(data) })
};

// Verification & Green Points APIs
export const verificationApi = {
  approve: (complaintId, notes = '') => apiRequest(`/verifications/${complaintId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  reject: (complaintId, reason = '') => apiRequest(`/verifications/${complaintId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
};

// Notifications APIs
export const notificationApi = {
  getAll: (role = 'citizen') => apiRequest(`/notifications?role=${role}`, { method: 'GET' }),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: (role = 'citizen') => apiRequest(`/notifications/read-all?role=${role}`, { method: 'PATCH' })
};

// Hotspots & GIS APIs
export const hotspotApi = {
  getAll: () => apiRequest('/hotspots', { method: 'GET' }),
  getById: (id) => apiRequest(`/hotspots/${id}`, { method: 'GET' })
};

// Analytics APIs
export const analyticsApi = {
  getDashboard: () => apiRequest('/analytics/dashboard', { method: 'GET' })
};

// Rewards & Leaderboard APIs
export const rewardApi = {
  getLeaderboard: () => apiRequest('/rewards/leaderboard', { method: 'GET' }),
  getUserRewards: (userId) => apiRequest(`/rewards/user/${userId}`, { method: 'GET' })
};

// Admin APIs
export const adminApi = {
  getAuditLogs: () => apiRequest('/admin/audit-logs', { method: 'GET' }),
  getSettings: () => apiRequest('/admin/settings', { method: 'GET' }),
  updateSettings: (settings) => apiRequest('/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) }),
  testEscalate: (complaintId) => apiRequest(`/admin/test/escalate/${complaintId}`, { method: 'POST' })
};
