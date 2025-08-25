import { FlowTieAPI } from './client/api';
import { RealtimeClient } from './client/realtime';
import { PromptCache } from './utils/cache';
import { TemplateEngine } from './utils/template';
import {
  FlowTieConfig,
  Prompt,
  ABTest,
  PromptOptions,
  ABTestResult,
  UsageEvent,
  ABTestResultEvent,
  PromptEvent,
  ABTestEvent,
} from './types';

export class FlowTie {
  private api: FlowTieAPI;
  private realtime: RealtimeClient | null = null;
  private cache: PromptCache | null = null;
  private config: FlowTieConfig;

  constructor(config: FlowTieConfig) {
    this.config = config;
    this.api = new FlowTieAPI(config.apiUrl, config.apiKey, config.projectId);

    if (config.enableRealtime) {
      this.realtime = new RealtimeClient(config.apiUrl, config.apiKey, config.projectId);
    }

    if (config.cachePrompts) {
      this.cache = new PromptCache();
      this.setupCacheInvalidation();
    }
  }

  async initialize(): Promise<void> {
    if (this.realtime) {
      await this.realtime.connect();
    }

    if (this.cache) {
      await this.refreshCache();
    }
  }

  async getPrompt(nameOrId: string, options: PromptOptions = {}): Promise<string> {
    const startTime = Date.now();
    let prompt: Prompt | null = null;

    if (this.cache) {
      prompt = this.cache.getPrompt(nameOrId) || this.cache.getPromptByName(nameOrId);
    }

    if (!prompt) {
      try {
        const prompts = await this.api.getPrompts();
        const foundPrompt = prompts.find(p => p.id === nameOrId || p.name === nameOrId);
        
        if (!foundPrompt) {
          throw new Error(`Prompt '${nameOrId}' not found`);
        }

        prompt = foundPrompt;

        if (this.cache) {
          this.cache.setPrompt(prompt);
        }
      } catch (error) {
        this.recordUsage({
          promptId: nameOrId,
          sessionId: options.sessionId || this.generateSessionId(),
          success: false,
          latency: Date.now() - startTime,
          metadata: { error: (error as Error).message, ...options.metadata },
        });
        throw error;
      }
    }

    const variables = { ...prompt.variables, ...options.variables };
    const interpolatedContent = TemplateEngine.interpolate(prompt.content, variables);

    this.recordUsage({
      promptId: prompt.id,
      sessionId: options.sessionId || this.generateSessionId(),
      success: true,
      latency: Date.now() - startTime,
      metadata: options.metadata,
    });

    return interpolatedContent;
  }

  async getABTestPrompt(abTestName: string, options: PromptOptions = {}): Promise<ABTestResult> {
    const startTime = Date.now();
    const sessionId = options.sessionId || this.generateSessionId();

    try {
      let abTest: ABTest | null = null;

      if (this.cache) {
        const abTests = await this.api.getABTests();
        abTest = abTests.find(test => test.name === abTestName) || null;
      } else {
        const abTests = await this.api.getABTests();
        abTest = abTests.find(test => test.name === abTestName) || null;
      }

      if (!abTest || abTest.status !== 'RUNNING') {
        throw new Error(`A/B test '${abTestName}' not found or not running`);
      }

      const selectedVariant = this.selectVariant(abTest.variants, sessionId);
      const prompt = await this.getPromptById(selectedVariant.promptId);

      const variables = { ...prompt.variables, ...options.variables };
      const interpolatedContent = TemplateEngine.interpolate(prompt.content, variables);

      const result: ABTestResult = {
        variantId: selectedVariant.id,
        promptContent: interpolatedContent,
        variables,
      };

      this.recordABTestResult(abTest.id, {
        abTestId: abTest.id,
        variantId: selectedVariant.id,
        sessionId,
        userId: options.userId,
        success: true,
        latency: Date.now() - startTime,
        metadata: options.metadata,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async recordFeedback(
    abTestId: string,
    variantId: string,
    success: boolean,
    feedback?: Record<string, any>,
    sessionId?: string
  ): Promise<void> {
    await this.recordABTestResult(abTestId, {
      abTestId,
      variantId,
      sessionId: sessionId || this.generateSessionId(),
      success,
      feedback,
    });
  }

  on(event: 'prompt-created' | 'prompt-updated' | 'prompt-deleted', handler: (event: PromptEvent) => void): void;
  on(event: 'ab-test-created' | 'ab-test-updated' | 'ab-test-deleted', handler: (event: ABTestEvent) => void): void;
  on(event: string, handler: Function): void {
    if (!this.realtime) {
      throw new Error('Real-time features are disabled. Enable them in config.');
    }
    this.realtime.on(event as any, handler as any);
  }

  off(event: string, handler?: Function): void {
    if (this.realtime) {
      this.realtime.off(event, handler);
    }
  }

  disconnect(): void {
    if (this.realtime) {
      this.realtime.disconnect();
    }
  }

  private async getPromptById(id: string): Promise<Prompt> {
    if (this.cache) {
      const cached = this.cache.getPrompt(id);
      if (cached) return cached;
    }

    return await this.api.getPrompt(id);
  }

  private selectVariant(variants: any[], sessionId: string): any {
    const hash = this.hashString(sessionId);
    const normalizedHash = (hash % 1000) / 1000;

    let cumulativeTraffic = 0;
    for (const variant of variants) {
      cumulativeTraffic += variant.traffic;
      if (normalizedHash <= cumulativeTraffic) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async recordUsage(event: UsageEvent): Promise<void> {
    try {
      await this.api.recordUsage(event);
    } catch (error) {
      console.warn('Failed to record usage:', error);
    }
  }

  private async recordABTestResult(abTestId: string, result: ABTestResultEvent): Promise<void> {
    try {
      await this.api.recordABTestResult(abTestId, result);
    } catch (error) {
      console.warn('Failed to record A/B test result:', error);
    }
  }

  private async refreshCache(): Promise<void> {
    if (!this.cache) return;

    try {
      const [prompts, abTests] = await Promise.all([
        this.api.getPrompts(),
        this.api.getABTests(),
      ]);

      prompts.forEach(prompt => this.cache!.setPrompt(prompt));
      abTests.forEach(abTest => this.cache!.setABTest(abTest));
    } catch (error) {
      console.warn('Failed to refresh cache:', error);
    }
  }

  private setupCacheInvalidation(): void {
    if (!this.realtime || !this.cache) return;

    this.realtime.on('prompt-updated', (event) => {
      if (event.prompt) {
        this.cache!.setPrompt(event.prompt);
      }
    });

    this.realtime.on('prompt-deleted', (event) => {
      if (event.promptId) {
        this.cache!.invalidatePrompt(event.promptId);
      }
    });

    this.realtime.on('ab-test-updated', (event) => {
      if (event.abTest) {
        this.cache!.setABTest(event.abTest);
      }
    });
  }
}

export * from './types';
export { TemplateEngine };
export default FlowTie;