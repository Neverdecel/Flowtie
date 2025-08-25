import axios, { AxiosInstance } from 'axios';
import { Prompt, ABTest, UsageEvent, ABTestResultEvent } from '../types';

export class FlowTieAPI {
  private client: AxiosInstance;
  private apiKey: string;
  private projectId: string;

  constructor(apiUrl: string, apiKey: string, projectId: string) {
    this.apiKey = apiKey;
    this.projectId = projectId;
    
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getPrompts(): Promise<Prompt[]> {
    const response = await this.client.get(`/api/prompts/project/${this.projectId}`);
    return response.data.prompts;
  }

  async getPrompt(id: string): Promise<Prompt> {
    const response = await this.client.get(`/api/prompts/${id}`);
    return response.data.prompt;
  }

  async getABTests(): Promise<ABTest[]> {
    const response = await this.client.get(`/api/ab-tests/project/${this.projectId}`);
    return response.data.abTests;
  }

  async getABTest(id: string): Promise<ABTest> {
    const response = await this.client.get(`/api/ab-tests/${id}`);
    return response.data.abTest;
  }

  async recordUsage(event: UsageEvent): Promise<void> {
    await this.client.post('/api/usage', event);
  }

  async recordABTestResult(abTestId: string, result: ABTestResultEvent): Promise<void> {
    await this.client.post(`/api/ab-tests/${abTestId}/results`, result);
  }

  async getABTestAnalytics(abTestId: string) {
    const response = await this.client.get(`/api/ab-tests/${abTestId}/analytics`);
    return response.data.analytics;
  }
}