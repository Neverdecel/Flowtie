export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface CreatePromptRequest {
  name: string;
  description?: string;
  content: string;
  variables?: Record<string, any>;
  projectId: string;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  content?: string;
  variables?: Record<string, any>;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateABTestRequest {
  name: string;
  description?: string;
  projectId: string;
  variants: {
    name: string;
    promptId: string;
    traffic: number;
  }[];
}

export interface PromptUsageEvent {
  promptId: string;
  sessionId: string;
  success: boolean;
  latency?: number;
  tokens?: number;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface ABTestResultEvent {
  abTestId: string;
  variantId: string;
  sessionId: string;
  userId?: string;
  success: boolean;
  latency?: number;
  feedback?: Record<string, any>;
  metadata?: Record<string, any>;
}