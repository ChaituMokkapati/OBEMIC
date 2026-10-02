const API_BASE = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`;
    }
  }

  private clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Strict';
    }
  }

  public async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE}${endpoint}`;
    
    // Setup Headers
    const headers = new Headers(options.headers || {});
    const token = this.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    // Skip token refresh logic for login endpoints
    if (endpoint.includes('/login')) {
      return response;
    }

    // Automatic Token Refresh Logic
    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include' 
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        if (data.accessToken) {
          this.setAccessToken(data.accessToken);
          
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          config.headers = headers;
          response = await fetch(url, config);
        }
      } else {
        // Refresh failed, logout user
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  }

  public async get(endpoint: string, options: RequestInit = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  public async post(endpoint: string, body?: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public async put(endpoint: string, body?: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public async patch(endpoint: string, body?: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public async delete(endpoint: string, options: RequestInit = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
