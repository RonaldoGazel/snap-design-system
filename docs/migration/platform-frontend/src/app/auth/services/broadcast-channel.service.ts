import { Injectable, OnDestroy } from '@angular/core';

export type AuthBroadcastMessage =
  | { type: 'logout'; reason: 'user' | 'expired'; timestamp: number }
  | { type: 'token_refreshed'; timestamp: number; generation: number }
  | { type: 'user_active'; timestamp: number };

@Injectable({ providedIn: 'root' })
export class BroadcastChannelService implements OnDestroy {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(msg: AuthBroadcastMessage) => void> = [];

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('auth_sync');
      this.channel.onmessage = (event: MessageEvent) => {
        const msg = this.validate(event.data);
        if (msg) {
          this.listeners.forEach(cb => cb(msg));
        }
      };
    }
  }

  broadcast(message: AuthBroadcastMessage): void {
    this.channel?.postMessage(message);
  }

  onMessage(callback: (msg: AuthBroadcastMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  async acquireRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request('auth_token_refresh', fn);
    }
    return fn();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy(): void {
    this.channel?.close();
    this.channel = null;
    this.listeners = [];
  }

  private validate(data: unknown): AuthBroadcastMessage | null {
    if (!data || typeof data !== 'object') return null;
    const msg = data as Record<string, unknown>;

    if (typeof msg['timestamp'] !== 'number') return null;

    switch (msg['type']) {
      case 'logout':
        if (msg['reason'] === 'user' || msg['reason'] === 'expired') {
          return msg as AuthBroadcastMessage;
        }
        return null;
      case 'token_refreshed':
        if (typeof msg['generation'] === 'number') {
          return msg as AuthBroadcastMessage;
        }
        return null;
      case 'user_active':
        return msg as AuthBroadcastMessage;
      default:
        return null;
    }
  }
}
