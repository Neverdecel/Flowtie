const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    this.setToken(response.token);
    return response;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.post('/auth/register', { name, email, password });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    this.clearToken();
  }

  async getMe() {
    return this.get('/auth/me');
  }

  async getProjects() {
    return this.get('/projects');
  }

  async createProject(data: { name: string; description?: string }) {
    return this.post('/projects', data);
  }

  async getProject(id: string) {
    return this.get(`/projects/${id}`);
  }

  async updateProject(id: string, data: { name?: string; description?: string }) {
    return this.put(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.delete(`/projects/${id}`);
  }

  async getPrompts(projectId: string) {
    return this.get(`/prompts/project/${projectId}`);
  }

  async createPrompt(data: {
    name: string;
    description?: string;
    content: string;
    variables?: Record<string, any>;
    projectId: string;
  }) {
    return this.post('/prompts', data);
  }

  async getPrompt(id: string) {
    return this.get(`/prompts/${id}`);
  }

  async updatePrompt(id: string, data: {
    name?: string;
    description?: string;
    content?: string;
    variables?: Record<string, any>;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }) {
    return this.put(`/prompts/${id}`, data);
  }

  async deletePrompt(id: string) {
    return this.delete(`/prompts/${id}`);
  }

  async getPromptVersions(id: string) {
    return this.get(`/prompts/${id}/versions`);
  }

  async getABTests(projectId: string) {
    return this.get(`/ab-tests/project/${projectId}`);
  }

  async createABTest(data: {
    name: string;
    description?: string;
    projectId: string;
    variants: {
      name: string;
      promptId: string;
      traffic: number;
    }[];
  }) {
    return this.post('/ab-tests', data);
  }

  async getABTest(id: string) {
    return this.get(`/ab-tests/${id}`);
  }

  async updateABTest(id: string, data: {
    name?: string;
    description?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
    trafficSplit?: Record<string, number>;
  }) {
    return this.put(`/ab-tests/${id}`, data);
  }

  async deleteABTest(id: string) {
    return this.delete(`/ab-tests/${id}`);
  }

  async getABTestAnalytics(id: string) {
    return this.get(`/ab-tests/${id}/analytics`);
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.put('/auth/profile', data);
  }

  async regenerateApiKey(projectId: string) {
    return this.post(`/projects/${projectId}/regenerate-key`, {});
  }
}

export const apiClient = new ApiClient(API_BASE_URL);