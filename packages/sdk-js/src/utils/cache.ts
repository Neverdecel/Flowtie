import { Prompt, ABTest } from '../types';

export class PromptCache {
  private prompts: Map<string, Prompt> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private promptsByName: Map<string, Prompt> = new Map();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  setPrompt(prompt: Prompt): void {
    this.prompts.set(prompt.id, { ...prompt, _cachedAt: Date.now() } as any);
    this.promptsByName.set(prompt.name, { ...prompt, _cachedAt: Date.now() } as any);
  }

  getPrompt(id: string): Prompt | null {
    const prompt = this.prompts.get(id);
    if (!prompt) return null;

    if (this.isExpired((prompt as any)._cachedAt)) {
      this.prompts.delete(id);
      this.promptsByName.delete(prompt.name);
      return null;
    }

    return prompt;
  }

  getPromptByName(name: string): Prompt | null {
    const prompt = this.promptsByName.get(name);
    if (!prompt) return null;

    if (this.isExpired((prompt as any)._cachedAt)) {
      this.prompts.delete(prompt.id);
      this.promptsByName.delete(name);
      return null;
    }

    return prompt;
  }

  setABTest(abTest: ABTest): void {
    this.abTests.set(abTest.id, { ...abTest, _cachedAt: Date.now() } as any);
  }

  getABTest(id: string): ABTest | null {
    const abTest = this.abTests.get(id);
    if (!abTest) return null;

    if (this.isExpired((abTest as any)._cachedAt)) {
      this.abTests.delete(id);
      return null;
    }

    return abTest;
  }

  invalidatePrompt(id: string): void {
    const prompt = this.prompts.get(id);
    if (prompt) {
      this.prompts.delete(id);
      this.promptsByName.delete(prompt.name);
    }
  }

  invalidateABTest(id: string): void {
    this.abTests.delete(id);
  }

  clear(): void {
    this.prompts.clear();
    this.promptsByName.clear();
    this.abTests.clear();
  }

  private isExpired(cachedAt: number): boolean {
    return Date.now() - cachedAt > this.ttl;
  }
}