export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    prompts: number;
    abTests: number;
  };
}

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables: Record<string, any>;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  parent?: {
    id: string;
    name: string;
    version: number;
  };
  versions?: {
    id: string;
    version: number;
    status: string;
    createdAt: string;
  }[];
  _count: {
    versions: number;
    usageLogs: number;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  trafficSplit: Record<string, number>;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  variants: ABTestVariant[];
  _count: {
    results: number;
  };
}

export interface ABTestVariant {
  id: string;
  name: string;
  traffic: number;
  createdAt: string;
  updatedAt: string;
  prompt: {
    id: string;
    name: string;
    version: number;
    content?: string;
  };
  _count: {
    results: number;
  };
}

export interface ABTestAnalytics {
  variantId: string;
  variantName: string;
  promptName: string;
  totalResults: number;
  successCount: number;
  successRate: number;
  avgLatency: number;
}