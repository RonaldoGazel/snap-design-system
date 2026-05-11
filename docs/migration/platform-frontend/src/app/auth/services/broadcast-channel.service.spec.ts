import { TestBed } from '@angular/core/testing';
import { BroadcastChannelService, AuthBroadcastMessage } from './broadcast-channel.service';

describe('BroadcastChannelService', () => {
  let service: BroadcastChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BroadcastChannelService);
  });

  afterEach(() => {
    service.destroy();
  });

  /** Simulate an incoming message by directly invoking the channel's onmessage handler.
   *  BroadcastChannel spec delivers messages only to *other* instances on the same name,
   *  so postMessage on the same instance won't trigger onmessage in jsdom. */
  function simulateIncoming(data: unknown): void {
    const channel = (service as any).channel as BroadcastChannel | null;
    if (channel?.onmessage) {
      channel.onmessage(new MessageEvent('message', { data }));
    }
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('message validation', () => {
    it('should accept valid logout message', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'logout', reason: 'user', timestamp: Date.now() });

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('logout');
    });

    it('should accept valid token_refreshed message', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'token_refreshed', timestamp: Date.now(), generation: 5 });

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('token_refreshed');
    });

    it('should accept valid user_active message', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'user_active', timestamp: Date.now() });

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('user_active');
    });

    it('should silently reject malformed messages', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      // Missing timestamp
      simulateIncoming({ type: 'logout', reason: 'user' });
      // Unknown type
      simulateIncoming({ type: 'unknown', timestamp: Date.now() });
      // Not an object
      simulateIncoming('garbage');
      // Null
      simulateIncoming(null);

      expect(received.length).toBe(0);
    });

    it('should reject logout with invalid reason', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'logout', reason: 'invalid', timestamp: Date.now() });

      expect(received.length).toBe(0);
    });

    it('should reject token_refreshed without generation', () => {
      const received: AuthBroadcastMessage[] = [];
      service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'token_refreshed', timestamp: Date.now() });

      expect(received.length).toBe(0);
    });
  });

  describe('acquireRefreshLock()', () => {
    it('should execute the provided function', async () => {
      const result = await service.acquireRefreshLock(async () => 42);
      expect(result).toBe(42);
    });
  });

  describe('destroy()', () => {
    it('should clear listeners and close channel', () => {
      service.onMessage(() => {});
      service.destroy();
      expect((service as any).listeners.length).toBe(0);
      expect((service as any).channel).toBeNull();
    });
  });

  describe('onMessage() unsubscribe', () => {
    it('should return an unsubscribe function that removes the listener', () => {
      const received: AuthBroadcastMessage[] = [];
      const unsub = service.onMessage(msg => received.push(msg));

      simulateIncoming({ type: 'user_active', timestamp: Date.now() });
      expect(received.length).toBe(1);

      unsub();

      simulateIncoming({ type: 'user_active', timestamp: Date.now() });
      expect(received.length).toBe(1); // no new message after unsubscribe
    });

    it('should only remove the specific listener, not others', () => {
      const received1: AuthBroadcastMessage[] = [];
      const received2: AuthBroadcastMessage[] = [];
      const unsub1 = service.onMessage(msg => received1.push(msg));
      service.onMessage(msg => received2.push(msg));

      unsub1();

      simulateIncoming({ type: 'user_active', timestamp: Date.now() });
      expect(received1.length).toBe(0);
      expect(received2.length).toBe(1);
    });
  });
});
