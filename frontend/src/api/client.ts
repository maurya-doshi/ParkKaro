import { ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Check auth in localStorage
    const savedUser = localStorage.getItem('parkshare_auth_user');
    const token = localStorage.getItem('parkshare_auth_token');

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        headers['X-Demo-User-Id'] = user.userId || 'user_driver1';
        headers['X-Demo-Email'] = user.email || 'driver@parkshare.demo';
        headers['X-Demo-Name'] = user.name || 'Demo User';
        headers['X-Demo-Role'] = user.role || 'DRIVER';
      } catch (err) {
        console.warn('Failed parsing saved user', err);
      }
    } else {
      headers['X-Demo-User-Id'] = 'user_driver1';
      headers['X-Demo-Email'] = 'driver@parkshare.demo';
      headers['X-Demo-Name'] = 'Arjun Verma';
      headers['X-Demo-Role'] = 'DRIVER';
    }

    return headers;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...customConfig } = options;

    let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...this.getHeaders(),
        ...(customConfig.headers || {})
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // Quick fallback to mock if backend not running

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json as ApiResponse<T>;
    } catch (error) {
      // Throw to allow fallback in domain API services
      throw error;
    }
  }

  public get<T>(endpoint: string, params?: RequestOptions['params']): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  public post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();
