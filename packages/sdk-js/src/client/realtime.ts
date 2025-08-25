import { io, Socket } from 'socket.io-client';
import { PromptEvent, ABTestEvent } from '../types';

export class RealtimeClient {
  private socket: Socket | null = null;
  private apiUrl: string;
  private apiKey: string;
  private projectId: string;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(apiUrl: string, apiKey: string, projectId: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.apiUrl, {
        auth: {
          token: this.apiKey,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        this.socket!.emit('join-project', this.projectId);
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-project', this.projectId);
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  on(event: 'prompt-created' | 'prompt-updated' | 'prompt-deleted', handler: (event: PromptEvent) => void): void;
  on(event: 'ab-test-created' | 'ab-test-updated' | 'ab-test-deleted', handler: (event: ABTestEvent) => void): void;
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler?: Function): void {
    if (!handler) {
      this.eventHandlers.delete(event);
      return;
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('prompt-created', (data) => {
      this.emit('prompt-created', { type: 'prompt-created', prompt: data.prompt });
    });

    this.socket.on('prompt-updated', (data) => {
      this.emit('prompt-updated', { type: 'prompt-updated', prompt: data.prompt });
    });

    this.socket.on('prompt-deleted', (data) => {
      this.emit('prompt-deleted', { type: 'prompt-deleted', promptId: data.promptId });
    });

    this.socket.on('ab-test-created', (data) => {
      this.emit('ab-test-created', { type: 'ab-test-created', abTest: data.abTest });
    });

    this.socket.on('ab-test-updated', (data) => {
      this.emit('ab-test-updated', { type: 'ab-test-updated', abTest: data.abTest });
    });
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}