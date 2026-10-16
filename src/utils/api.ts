import {
  EventItem,
  RegistrationItem,
  Pagination,
  DashboardStats,
  AdminUser,
} from '../types/index.ts';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Check if token exists in localStorage (used as fallback if cookies are blocked)
  const fallbackToken = localStorage.getItem('eventflow_token');
  if (fallbackToken) {
    defaultHeaders['Authorization'] = `Bearer ${fallbackToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include', // Include HTTP-only cookies
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await response.json();
    if (!response.ok) {
      const err = new Error(json.error?.message || 'Request failed');
      (err as any).status = response.status;
      (err as any).code = json.error?.code || 'UNKNOWN_ERROR';
      (err as any).details = json.error?.details;
      throw err;
    }
    return json;
  }

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(errorText || 'Server error occurred');
    (err as any).status = response.status;
    throw err;
  }

  return (await response.text()) as unknown as T;
}

export const api = {
  // Public Events
  async getEvents(params: {
    q?: string;
    category?: string;
    status?: string;
    format?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; events: EventItem[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.format && params.format !== 'all') searchParams.set('format', params.format);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    return request(`/api/events?${searchParams.toString()}`);
  },

  async getEventById(id: string): Promise<{ success: boolean; event: EventItem }> {
    return request(`/api/events/${id}`);
  },

  async getCategories(): Promise<{ success: boolean; categories: { category: string; count: number }[] }> {
    return request('/api/events/categories');
  },

  // Registration
  async registerForEvent(
    eventId: string,
    payload: {
      fullName: string;
      email: string;
      organization: string;
      domainInterests: string[];
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    registration: RegistrationItem;
    event: Partial<EventItem>;
  }> {
    return request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyRegistration(ref: string): Promise<{ success: boolean; registration: any }> {
    return request(`/api/registrations/verify/${encodeURIComponent(ref)}`);
  },

  // Admin Auth
  async login(identifier: string, password: string): Promise<{ success: boolean; user: AdminUser; token: string }> {
    const res = await request<{ success: boolean; user: AdminUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      localStorage.setItem('eventflow_token', res.token);
    }
    return res;
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('eventflow_token');
    return request('/api/auth/logout', { method: 'POST' });
  },

  async getMe(): Promise<{ success: boolean; user: AdminUser }> {
    return request('/api/auth/me');
  },

  // Admin Management
  async getAdminStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    return request('/api/admin/events/stats');
  },

  async getAdminEvents(params: {
    q?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; events: EventItem[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    return request(`/api/admin/events?${searchParams.toString()}`);
  },

  async createAdminEvent(data: Partial<EventItem>): Promise<{ success: boolean; event: EventItem }> {
    return request('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminEvent(id: string, data: Partial<EventItem>): Promise<{ success: boolean; event: EventItem }> {
    return request(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminEvent(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/events/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminRegistrations(params: {
    eventId?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; registrations: RegistrationItem[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params.eventId && params.eventId !== 'all') searchParams.set('eventId', params.eventId);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.q) searchParams.set('q', params.q);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    return request(`/api/admin/registrations?${searchParams.toString()}`);
  },

  async updateRegistrationStatus(
    id: string,
    status: 'confirmed' | 'waitlisted' | 'cancelled',
    reason?: string
  ): Promise<{ success: boolean; registration: RegistrationItem }> {
    return request(`/api/admin/registrations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  getExportRegistrationsUrl(eventId?: string, status?: string): string {
    const params = new URLSearchParams();
    if (eventId && eventId !== 'all') params.set('eventId', eventId);
    if (status && status !== 'all') params.set('status', status);
    return `/api/admin/registrations/export?${params.toString()}`;
  },
};
