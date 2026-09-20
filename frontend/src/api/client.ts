import { ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
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
    const savedUser = localStorage.getItem('parkkaro_auth_user');
    const token = localStorage.getItem('parkkaro_auth_token');

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        let defaultUserId = 'driver_demo_1';
        let defaultRole = user.role || 'DRIVER';
        if (defaultRole === 'HOST' || user.userId === 'user_host1' || user.userId === 'host_demo_1') {
          defaultUserId = 'host_demo_1';
          defaultRole = 'HOST';
        } else if (defaultRole === 'ADMIN' || user.userId === 'user_admin1' || user.userId === 'admin_demo_1') {
          defaultUserId = 'admin_demo_1';
          defaultRole = 'ADMIN';
        }

        // Map obsolete user_* IDs to valid demo seed IDs
        let effectiveUserId = user.userId || defaultUserId;
        if (effectiveUserId === 'user_driver1') effectiveUserId = 'driver_demo_1';
        if (effectiveUserId === 'user_host1') effectiveUserId = 'host_demo_1';
        if (effectiveUserId === 'user_admin1') effectiveUserId = 'admin_demo_1';

        headers['X-Demo-User-Id'] = effectiveUserId;
        headers['X-Demo-Email'] = user.email || `${effectiveUserId}@demo.parkshare.com`;
        headers['X-Demo-Name'] = user.name || 'Demo User';
        headers['X-Demo-Role'] = defaultRole;
      } catch (err) {
        console.warn('Failed parsing saved user', err);
        headers['X-Demo-User-Id'] = 'driver_demo_1';
        headers['X-Demo-Email'] = 'driver1@demo.parkshare.com';
        headers['X-Demo-Name'] = 'Demo Driver Arjun';
        headers['X-Demo-Role'] = 'DRIVER';
      }
    } else {
      headers['X-Demo-User-Id'] = 'driver_demo_1';
      headers['X-Demo-Email'] = 'driver1@demo.parkshare.com';
      headers['X-Demo-Name'] = 'Demo Driver Arjun';
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const errorCode = responseData?.error?.code || `HTTP_${response.status}`;
        const errorMessage = responseData?.error?.message || response.statusText || 'Request failed';
        throw new ApiError(errorMessage, errorCode, response.status, responseData?.error?.details);
      }

      if (responseData && responseData.success === false) {
        throw new ApiError(
          responseData.error?.message || 'Operation failed',
          responseData.error?.code || 'OPERATION_FAILED',
          response.status,
          responseData.error?.details
        );
      }

      return responseData as ApiResponse<T>;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 15s', 'TIMEOUT_ERROR', 408);
      }
      throw new ApiError(error.message || 'Network request failed', 'NETWORK_ERROR', 0);
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
