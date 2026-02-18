// API client for medical devices backend

const API_BASE_URL = 'https://backend.youware.com';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Helper function for API calls (returns full response for paginated endpoints)
async function apiCallRaw<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Departments API
export const departmentsApi = {
  getAll: () => apiCall<any[]>('/api/departments'),
  
  create: (name: string, custodian_name?: string) =>
    apiCall<{ id: number }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify({ name, custodian_name: custodian_name || null }),
    }),
  
  update: (id: number, name: string, custodian_name?: string) =>
    apiCall<void>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, custodian_name: custodian_name || null }),
    }),
  
  delete: (id: number) =>
    apiCall<void>(`/api/departments/${id}`, { method: 'DELETE' }),
};

// Devices API
export const devicesApi = {
  getAll: (params?: { page?: number; limit?: number; q?: string; department_id?: string; sort?: string }) => {
    if (params && (params.page || params.limit)) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.q) searchParams.set('q', params.q);
      if (params.department_id) searchParams.set('department_id', params.department_id);
      if (params.sort) searchParams.set('sort', params.sort);
      // Return full response with pagination info
      return apiCallRaw<{ success: boolean; data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/devices?${searchParams.toString()}`);
    }
    return apiCall<any[]>('/api/devices');
  },
  
  getById: (id: number) => apiCall<any>(`/api/devices/${id}`),
  
  searchBySerial: (serial: string) => 
    apiCall<any>(`/api/devices/search?serial=${encodeURIComponent(serial)}`),
  
  create: (device: any) =>
    apiCall<{ id: number }>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    }),
  
  update: (id: number, device: any) =>
    apiCall<void>(`/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    }),
  
  delete: (id: number) =>
    apiCall<void>(`/api/devices/${id}`, { method: 'DELETE' }),
};

// Checks API
export const checksApi = {
  getAll: (deviceId?: number) => {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    return apiCall<any[]>(`/api/checks${params}`);
  },
  
  create: (check: any) =>
    apiCall<{ id: number }>('/api/checks', {
      method: 'POST',
      body: JSON.stringify(check),
    }),
};

// Templates API
export const templatesApi = {
  getAll: () => apiCall<any[]>('/api/templates'),
  
  create: (template: any) =>
    apiCall<{ id: number }>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),
};

// Stats API
export const statsApi = {
  get: () => apiCall<any>('/api/stats'),
};

// Reports API (aggregated data from server)
export const reportsApi = {
  get: (params?: { period?: string; department_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set('period', params.period);
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    return apiCallRaw<{ success: boolean; data: any }>(`/api/reports?${searchParams.toString()}`);
  },
};

// Maintenance API (due maintenance notifications)
export const maintenanceApi = {
  getSummary: (params?: { days?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.set('days', String(params.days));
    return apiCallRaw<{ success: boolean; data: { overdue: number; dueToday: number; dueSoon: number; noDate: number; totalDue: number; days: number } }>(
      `/api/maintenance/summary?${searchParams.toString()}`
    );
  },
  getDue: (params?: {
    days?: number;
    limit?: number;
    offset?: number;
    department_id?: string;
    device_type_id?: string;
    status?: string;
    include_no_date?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.set('days', String(params.days));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    if (params?.device_type_id) searchParams.set('device_type_id', params.device_type_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.include_no_date) searchParams.set('include_no_date', '1');

    return apiCallRaw<{
      success: boolean;
      data: {
        items: any[];
        pagination: { total: number; limit: number; offset: number };
      };
    }>(`/api/maintenance/due?${searchParams.toString()}`);
  },
};

// Users API
export const usersApi = {
  getAll: () => apiCall<any[]>('/api/users'),
  
  create: (user: any) =>
    apiCall<{ id: number }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  
  update: (id: number, user: any) =>
    apiCall<void>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  
  delete: (id: number) =>
    apiCall<void>(`/api/users/${id}`, { method: 'DELETE' }),
  
  login: (username: string, password: string) =>
    apiCall<{ user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Check Criteria API
export const criteriaApi = {
  getAll: () => apiCall<any[]>('/api/criteria'),
  
  create: (criteria: any) =>
    apiCall<{ id: number }>('/api/criteria', {
      method: 'POST',
      body: JSON.stringify(criteria),
    }),
  
  update: (id: number, criteria: any) =>
    apiCall<void>(`/api/criteria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(criteria),
    }),
  
  delete: (id: number) =>
    apiCall<void>(`/api/criteria/${id}`, { method: 'DELETE' }),
};

// Device Types API
export const deviceTypesApi = {
  getAll: () => apiCall<any[]>('/api/device-types'),
  
  create: (deviceType: any) =>
    apiCall<{ id: number }>('/api/device-types', {
      method: 'POST',
      body: JSON.stringify(deviceType),
    }),
  
  update: (id: number, deviceType: any) =>
    apiCall<void>(`/api/device-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deviceType),
    }),
  
  delete: (id: number) =>
    apiCall<void>(`/api/device-types/${id}`, { method: 'DELETE' }),
  
  getCriteria: (id: number) =>
    apiCall<any[]>(`/api/device-types/${id}/criteria`),
  
  setCriteria: (id: number, criteriaIds: number[]) =>
    apiCall<void>(`/api/device-types/${id}/criteria`, {
      method: 'POST',
      body: JSON.stringify({ criteria_ids: criteriaIds }),
    }),
};
