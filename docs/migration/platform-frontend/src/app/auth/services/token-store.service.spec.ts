import { TestBed } from '@angular/core/testing';
import { TokenStoreService } from './token-store.service';

describe('TokenStoreService', () => {
  let service: TokenStoreService;

  const mockTokens = {
    access_token: 'access-123',
    refresh_token: 'refresh-456',
    id_token: 'id-789',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('store()', () => {
    it('should set all tokens', () => {
      service.store(mockTokens);
      expect(service.access).toBe('access-123');
      expect(service.refresh).toBe('refresh-456');
      expect(service.id).toBe('id-789');
    });

    it('should increment generation on each store call', () => {
      expect(service.generation).toBe(0);
      service.store(mockTokens);
      expect(service.generation).toBe(1);
      service.store(mockTokens);
      expect(service.generation).toBe(2);
    });

    it('should set sessionStartTimestamp only on first store call', () => {
      expect(service.sessionStart).toBeNull();
      service.store(mockTokens);
      const firstStart = service.sessionStart;
      expect(firstStart).toBeGreaterThan(0);

      service.store(mockTokens);
      expect(service.sessionStart).toBe(firstStart);
    });

    it('should generate authSessionId on first store call', () => {
      expect(service.authSessionId).toBeNull();
      service.store(mockTokens);
      expect(service.authSessionId).toBeTruthy();
      expect(typeof service.authSessionId).toBe('string');
    });

    it('should set hasTokens to true', () => {
      expect(service.hasTokens).toBe(false);
      service.store(mockTokens);
      expect(service.hasTokens).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should reset all fields to null/initial', () => {
      service.store(mockTokens);
      service.markStale();
      service.clear();

      expect(service.access).toBeNull();
      expect(service.refresh).toBeNull();
      expect(service.id).toBeNull();
      expect(service.sessionStart).toBeNull();
      expect(service.hasTokens).toBe(false);
      expect(service.isStale).toBe(false);
      expect(service.generation).toBe(0);
      expect(service.authSessionId).toBeNull();
    });
  });

  describe('markStale() / clearStale()', () => {
    it('should toggle isStale flag', () => {
      expect(service.isStale).toBe(false);
      service.markStale();
      expect(service.isStale).toBe(true);
      service.clearStale();
      expect(service.isStale).toBe(false);
    });
  });

  describe('generation monotonicity', () => {
    it('should be monotonically increasing across multiple store calls', () => {
      const generations: number[] = [];
      for (let i = 0; i < 5; i++) {
        service.store(mockTokens);
        generations.push(service.generation);
      }
      for (let i = 1; i < generations.length; i++) {
        expect(generations[i]).toBeGreaterThan(generations[i - 1]);
      }
    });
  });
});
