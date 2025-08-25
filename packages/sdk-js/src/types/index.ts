export interface FlowTieConfig {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  enableRealtime?: boolean;
  cachePrompts?: boolean;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  variables: Record<string, any>;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface ABTest {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  variants: ABTestVariant[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  promptId: string;
  traffic: number;
}

export interface PromptOptions {
  variables?: Record<string, any>;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ABTestResult {
  variantId: string;
  promptContent: string;
  variables: Record<string, any>;
}

export interface UsageEvent {
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

export interface PromptEvent {
  type: 'prompt-created' | 'prompt-updated' | 'prompt-deleted';
  prompt?: Prompt;
  promptId?: string;
}

export interface ABTestEvent {
  type: 'ab-test-created' | 'ab-test-updated' | 'ab-test-deleted';
  abTest?: ABTest;
  abTestId?: string;
}