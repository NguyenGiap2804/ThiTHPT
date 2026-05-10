import { Exam, Attempt, User, Subject, Notification, AdminStats, AdminUser, AdminSystemStatus } from '../types';
import { API_BASE_URL } from './config';

/**
 * Common fetch wrapper
 */
export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('thpt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let responseData: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { message: 'Failed to parse JSON response' };
    }
  } else {
    const text = await response.text();
    responseData = { message: text || 'Server returned an error without a message' };
  }

  if (!response.ok) {
    const errorMessage = responseData.message || responseData.error || `Server Error (${response.status})`;
    throw new ApiError(errorMessage, response.status, responseData);
  }

  // Return data property if it exists, otherwise the whole object
  return responseData.data !== undefined ? responseData.data : responseData;
}

/**
 * Auth APIs
 */
export const authApi = {
  login: async (credentials: { email: string; password?: string }): Promise<{ user: User; token: string }> => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: async (credentials: { email: string; password?: string; name: string }): Promise<{ user: User; token: string }> => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  getProfile: async (): Promise<User> => {
    return apiFetch('/auth/profile');
  },
};

/**
 * Exam APIs
 */
export const examApi = {
  getAll: async (filters: { subject?: string; level?: string; status?: string } = {}): Promise<Exam[]> => {
    const params = new URLSearchParams();
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.level) params.append('level', filters.level);
    if (filters.status) params.append('status', filters.status);
    
    const query = params.toString();
    const endpoint = filters.status === 'all' ? '/exams/admin' : '/exams';
    return apiFetch(`${endpoint}${query ? `?${query}` : ''}`);
  },
  getById: async (id: string): Promise<Exam> => {
    return apiFetch(`/exams/${id}`);
  },
  getAdminById: async (id: string): Promise<Exam> => {
    return apiFetch(`/exams/admin/${id}`);
  },
  create: async (exam: Partial<Exam>): Promise<Exam> => {
    return apiFetch('/exams', {
      method: 'POST',
      body: JSON.stringify(exam),
    });
  },
  update: async (id: string, exam: Partial<Exam>): Promise<Exam> => {
    return apiFetch(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exam),
    });
  },
  delete: async (id: string): Promise<void> => {
    return apiFetch(`/exams/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Attempt (Submit results) APIs
 */
export const attemptApi = {
  submit: async (attempt: Partial<Attempt>): Promise<Attempt> => {
    return apiFetch('/attempts', {
      method: 'POST',
      body: JSON.stringify(attempt),
    });
  },
  getUserAttempts: async (): Promise<Attempt[]> => {
    return apiFetch('/attempts');
  },
  getById: async (id: string): Promise<Attempt> => {
    return apiFetch(`/attempts/${id}`);
  },
};

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    return apiFetch('/admin/stats');
  },
  getUsers: async (): Promise<AdminUser[]> => {
    return apiFetch('/admin/users');
  },
  updateUser: async (id: string, updates: Partial<Pick<AdminUser, 'name' | 'role'>>): Promise<AdminUser> => {
    return apiFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  deleteUser: async (id: string): Promise<void> => {
    return apiFetch(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
  getSystemStatus: async (): Promise<AdminSystemStatus> => {
    return apiFetch('/admin/system');
  },
};

/**
 * Upload APIs
 */
export const uploadApi = {
  file: async (file: File): Promise<{ url: string; filename: string; mimetype: string; size: number; storageProvider: string; objectKey?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('thpt_token');
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new ApiError(responseData.message || responseData.error || 'Upload failed', response.status, responseData);
    }

    return responseData.data;
  },
};

/**
 * Notifications
 */
export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    return apiFetch('/notifications');
  },
  create: async (notification: Pick<Notification, 'title' | 'message' | 'type'> & { userId?: string | null }): Promise<Notification> => {
    return apiFetch('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },
  markRead: async (id: string): Promise<void> => {
    return apiFetch(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
  markAllRead: async (): Promise<void> => {
    return apiFetch('/notifications/read-all', {
      method: 'PUT',
    });
  },
};
