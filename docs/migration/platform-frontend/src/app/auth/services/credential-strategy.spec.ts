import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { BearerTokenStrategy, BffCookieStrategy } from './credential-strategy';
import { TokenStoreService } from './token-store.service';

describe('BearerTokenStrategy', () => {
  let strategy: BearerTokenStrategy;
  let tokenStoreMock: { access: string | null };

  beforeEach(() => {
    tokenStoreMock = { access: null };

    TestBed.configureTestingModule({
      providers: [
        BearerTokenStrategy,
        { provide: TokenStoreService, useValue: tokenStoreMock },
      ],
    });

    strategy = TestBed.inject(BearerTokenStrategy);
  });

  it('should attach Authorization header when token is available', () => {
    tokenStoreMock.access = 'my-access-token';
    const req = new HttpRequest('GET' as const, 'http://localhost:8080/api/data');

    const result = strategy.attachCredentials(req);

    expect(result.headers.get('Authorization')).toBe('Bearer my-access-token');
    expect(result.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it('should not attach Authorization header when token is null', () => {
    tokenStoreMock.access = null;
    const req = new HttpRequest('GET' as const, 'http://localhost:8080/api/data');

    const result = strategy.attachCredentials(req);

    expect(result.headers.has('Authorization')).toBe(false);
    expect(result.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it('should always attach X-Requested-With header', () => {
    const req = new HttpRequest('POST' as const, 'http://localhost:8080/api/data', null);

    const result = strategy.attachCredentials(req);

    expect(result.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });
});

describe('BffCookieStrategy', () => {
  let strategy: BffCookieStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BffCookieStrategy],
    });

    strategy = TestBed.inject(BffCookieStrategy);
  });

  it('should not attach Authorization header', () => {
    const req = new HttpRequest('GET' as const, 'http://localhost:8080/api/data');

    const result = strategy.attachCredentials(req);

    expect(result.headers.has('Authorization')).toBe(false);
  });

  it('should attach X-Requested-With header', () => {
    const req = new HttpRequest('GET' as const, 'http://localhost:8080/api/data');

    const result = strategy.attachCredentials(req);

    expect(result.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });
});
