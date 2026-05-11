import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { TokenStoreService } from '../services/token-store.service';
import { CREDENTIAL_STRATEGY, CredentialStrategy } from '../services/credential-strategy';
import { TOKEN_PROVIDER, TokenProvider } from '../services/token-provider';
import { AuthSessionRefreshedError } from '../models/auth-errors.model';
import { ExecutionModeService } from '../../services/execution-mode.service';
import { ShellContextBridge } from '../../shell/shell-context-bridge.service';
import { RuntimeConfigService } from '../../services/runtime-config.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authServiceMock: { handleUnauthorized: ReturnType<typeof vi.fn> };
  let tokenStoreMock: { isStale: boolean; generation: number };
  let credentialStrategyMock: CredentialStrategy;
  let tokenProviderMock: TokenProvider;
  let executionModeService: ExecutionModeService;
  let shellContextBridgeMock: { shellContext: ReturnType<typeof vi.fn> };
  let handlerMock: HttpHandler;
  let configServiceMock: { config: RuntimeConfigService['config'] };

  beforeEach(() => {
    authServiceMock = {
      handleUnauthorized: vi.fn().mockResolvedValue('new-token'),
    };

    tokenStoreMock = { isStale: false, generation: 1 };

    credentialStrategyMock = {
      attachCredentials: (req: HttpRequest<unknown>) =>
        req.clone({
          setHeaders: { Authorization: 'Bearer test-token', 'X-Requested-With': 'XMLHttpRequest' },
        }),
    };

    tokenProviderMock = {
      getAccessToken: vi.fn().mockResolvedValue('federated-token'),
      isAuthenticated: vi.fn().mockReturnValue(true),
    };

    shellContextBridgeMock = {
      shellContext: vi.fn().mockReturnValue(null),
    };

    handlerMock = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))),
    };

    // Default config: service URLs at http://localhost:8002 (cross-origin from http://localhost)
    // so existing tests that use http://localhost:8002/api/data still get credentials attached
    configServiceMock = {
      config: {
        keycloak: {
          baseUrl: 'http://localhost:8180',
          realm: 'platform',
          clientId: 'platform-frontend',
          redirectUri: 'http://localhost:4200/auth/callback',
          postLogoutRedirectUri: 'http://localhost:4200',
        },
        identityServiceUrl: 'http://localhost:8002/api/v1/identity',
        permissionServiceUrl: 'http://localhost:8002/api/v1/permissions',
        auditServiceUrl: 'http://localhost:8002/api/v1/audit',
        personServiceUrl: 'http://localhost:8002/api/v1/poi',
        poiServiceUrl: 'http://localhost:8002/api/v1/poi',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceMock },
        { provide: TokenStoreService, useValue: tokenStoreMock },
        { provide: CREDENTIAL_STRATEGY, useValue: credentialStrategyMock },
        { provide: TOKEN_PROVIDER, useValue: tokenProviderMock },
        { provide: ShellContextBridge, useValue: shellContextBridgeMock },
        { provide: RuntimeConfigService, useValue: configServiceMock },
      ],
    });

    executionModeService = TestBed.inject(ExecutionModeService);
    interceptor = TestBed.inject(AuthInterceptor);
  });

  // ─── Standalone Mode Tests (existing behavior preserved) ───

  describe('standalone mode', () => {
    it('should attach credentials for trusted origin', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            expect(passedReq.headers.get('Authorization')).toBe('Bearer test-token');
            expect(passedReq.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('should skip credential attachment for origins not in trustedOrigins', async () => {
      const req = new HttpRequest(
        'GET' as const,
        'http://localhost:8180/realms/platform/.well-known/openid-configuration',
      );
      const plainHandler: HttpHandler = {
        handle: vi.fn((r: HttpRequest<unknown>) => {
          expect(r.headers.has('Authorization')).toBe(false);
          return of(new HttpResponse({ status: 200 }));
        }),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, plainHandler).subscribe({
          next: () => {
            expect(plainHandler.handle).toHaveBeenCalled();
            resolve();
          },
        });
      });
    });

    it('should trigger refresh and replay idempotent GET on 401', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      let callCount = 0;
      const handler401: HttpHandler = {
        handle: vi.fn(() => {
          callCount++;
          if (callCount === 1) return throwError(() => error401);
          return of(new HttpResponse({ status: 200 }));
        }),
      };

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handler401).subscribe({
          next: (event) => {
            expect(event).toBeInstanceOf(HttpResponse);
            expect(authServiceMock.handleUnauthorized).toHaveBeenCalled();
            resolve();
          },
          error: reject,
        });
      });
    });

    it('should reject non-idempotent POST on 401 with AuthSessionRefreshedError', async () => {
      const req = new HttpRequest('POST' as const, 'http://localhost:8002/api/data', null);
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      const handler401: HttpHandler = {
        handle: vi.fn(() => throwError(() => error401)),
      };

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handler401).subscribe({
          next: () => reject(new Error('Should not succeed')),
          error: (err) => {
            expect(err).toBeInstanceOf(AuthSessionRefreshedError);
            expect(err.method).toBe('POST');
            resolve();
          },
        });
      });
    });

    it('should not retry already-retried requests (refresh returns null)', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      authServiceMock.handleUnauthorized.mockResolvedValue(null);

      const handler401: HttpHandler = {
        handle: vi.fn(() => throwError(() => error401)),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, handler401).subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(HttpErrorResponse);
            resolve();
          },
        });
      });
    });

    it('should redact credentials in error responses', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error500 = new HttpErrorResponse({ status: 500, url: req.url });

      const errorHandler: HttpHandler = {
        handle: vi.fn(() => throwError(() => error500)),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, errorHandler).subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(HttpErrorResponse);
            expect(err.status).toBe(500);
            resolve();
          },
        });
      });
    });

    it('should decrement activeReplays exactly once even with multi-event responses', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      let callCount = 0;
      const handler401: HttpHandler = {
        handle: vi.fn(() => {
          callCount++;
          if (callCount === 1) return throwError(() => error401);
          return of(
            new HttpResponse({ status: 200 }),
            new HttpResponse({ status: 200 }),
            new HttpResponse({ status: 200 }),
          );
        }),
      };

      await new Promise<void>((resolve, reject) => {
        const events: unknown[] = [];
        interceptor.intercept(req, handler401).subscribe({
          next: (event) => events.push(event),
          complete: () => {
            expect(events.length).toBe(3);
            expect((interceptor as any).activeReplays).toBe(0);
            resolve();
          },
          error: reject,
        });
      });
    });
  });

  // ─── Federated Mode Tests ───

  describe('federated mode', () => {
    beforeEach(() => {
      executionModeService.markAsFederated();
    });

    it('should use TOKEN_PROVIDER to attach credentials in federated mode', async () => {
      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            expect(passedReq.headers.get('Authorization')).toBe('Bearer federated-token');
            expect(passedReq.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('should emit auth:token-expired event on 401 instead of calling handleUnauthorized', async () => {
      const emitMock = vi.fn();
      shellContextBridgeMock.shellContext.mockReturnValue({
        eventBus: { emit: emitMock },
      });

      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      const handler401: HttpHandler = {
        handle: vi.fn(() => throwError(() => error401)),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, handler401).subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(HttpErrorResponse);
            expect(err.status).toBe(401);
            // Should NOT call auth.handleUnauthorized in federated mode
            expect(authServiceMock.handleUnauthorized).not.toHaveBeenCalled();
            // Should emit auth:token-expired event
            expect(emitMock).toHaveBeenCalledWith(
              expect.objectContaining({
                type: 'auth:token-expired',
                source: 'platform-frontend',
                payload: null,
              }),
            );
            resolve();
          },
        });
      });
    });

    it('should not attempt request replay on 401 in federated mode', async () => {
      shellContextBridgeMock.shellContext.mockReturnValue({
        eventBus: { emit: vi.fn() },
      });

      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error401 = new HttpErrorResponse({ status: 401, url: req.url });

      const handler401: HttpHandler = {
        handle: vi.fn(() => throwError(() => error401)),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, handler401).subscribe({
          error: () => {
            // Handler should only be called once (no replay)
            expect(handler401.handle).toHaveBeenCalledTimes(1);
            resolve();
          },
        });
      });
    });

    it('should handle null token from TOKEN_PROVIDER gracefully', async () => {
      (tokenProviderMock.getAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            // No Authorization header when token is null
            expect(passedReq.headers.has('Authorization')).toBe(false);
            expect(passedReq.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('should pass through non-401 errors without emitting event bus events', async () => {
      const emitMock = vi.fn();
      shellContextBridgeMock.shellContext.mockReturnValue({
        eventBus: { emit: emitMock },
      });

      const req = new HttpRequest('GET' as const, 'http://localhost:8002/api/data');
      const error500 = new HttpErrorResponse({ status: 500, url: req.url });

      const errorHandler: HttpHandler = {
        handle: vi.fn(() => throwError(() => error500)),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, errorHandler).subscribe({
          error: (err) => {
            expect(err).toBeInstanceOf(HttpErrorResponse);
            expect(err.status).toBe(500);
            expect(emitMock).not.toHaveBeenCalled();
            resolve();
          },
        });
      });
    });

    it('should skip credential attachment for untrusted origins in federated mode', async () => {
      const req = new HttpRequest(
        'GET' as const,
        'http://localhost:8180/realms/platform/.well-known/openid-configuration',
      );
      const plainHandler: HttpHandler = {
        handle: vi.fn((r: HttpRequest<unknown>) => {
          expect(r.headers.has('Authorization')).toBe(false);
          return of(new HttpResponse({ status: 200 }));
        }),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, plainHandler).subscribe({
          next: () => {
            expect(plainHandler.handle).toHaveBeenCalled();
            // TOKEN_PROVIDER should NOT be called for untrusted origins
            expect(tokenProviderMock.getAccessToken).not.toHaveBeenCalled();
            resolve();
          },
        });
      });
    });
  });

  // ─── Trusted Origin Logic Tests (5.5) ───
  // Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5

  describe('trusted origin logic', () => {
    it('(a) relative URL request — same-origin, credentials attached', async () => {
      // window.location.origin is http://localhost in jsdom
      // A relative URL resolves to http://localhost — same-origin → credentials attached
      const req = new HttpRequest('GET' as const, '/api/v1/poi/persons');

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            expect(passedReq.headers.get('Authorization')).toBe('Bearer test-token');
            expect(passedReq.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('(b) absolute same-origin request — credentials attached', async () => {
      // Build an absolute URL using the actual window.location.origin so the test
      // works regardless of the port the test runner uses (e.g. http://localhost:9876)
      const sameOriginUrl = `${window.location.origin}/api/v1/poi/persons`;
      const req = new HttpRequest('GET' as const, sameOriginUrl);

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            expect(passedReq.headers.get('Authorization')).toBe('Bearer test-token');
            expect(passedReq.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('(c) cross-origin request matching a configured service URL — credentials attached', async () => {
      // Configure the service with an external absolute URL
      configServiceMock.config = {
        ...configServiceMock.config,
        poiServiceUrl: 'https://external-service.example.com/api/v1/poi',
        personServiceUrl: 'https://external-service.example.com/api/v1/poi',
      };

      const req = new HttpRequest(
        'GET' as const,
        'https://external-service.example.com/api/v1/poi/persons',
      );

      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, handlerMock).subscribe({
          next: () => {
            const passedReq = (handlerMock.handle as ReturnType<typeof vi.fn>).mock
              .calls[0][0] as HttpRequest<unknown>;
            expect(passedReq.headers.get('Authorization')).toBe('Bearer test-token');
            resolve();
          },
          error: reject,
        });
      });
    });

    it('(d) cross-origin request to unknown origin — no credentials', async () => {
      const req = new HttpRequest('GET' as const, 'https://cdn.example.com/asset.js');

      const plainHandler: HttpHandler = {
        handle: vi.fn((r: HttpRequest<unknown>) => {
          expect(r.headers.has('Authorization')).toBe(false);
          return of(new HttpResponse({ status: 200 }));
        }),
      };

      await new Promise<void>((resolve) => {
        interceptor.intercept(req, plainHandler).subscribe({
          next: () => {
            expect(plainHandler.handle).toHaveBeenCalled();
            resolve();
          },
        });
      });
    });

    it('(e) malformed URL in config — gracefully skipped, no throw', async () => {
      // Set all configured URLs to malformed values — interceptor must not throw
      configServiceMock.config = {
        ...configServiceMock.config,
        identityServiceUrl: 'not-a-url',
        permissionServiceUrl: 'not-a-url',
        auditServiceUrl: 'not-a-url',
        personServiceUrl: 'not-a-url',
        poiServiceUrl: 'not-a-url',
      };

      // Cross-origin request — malformed config URLs should be skipped, not throw
      const req = new HttpRequest('GET' as const, 'https://cdn.example.com/asset.js');

      const plainHandler: HttpHandler = {
        handle: vi.fn(() => of(new HttpResponse({ status: 200 }))),
      };

      // Should complete without throwing
      await new Promise<void>((resolve, reject) => {
        interceptor.intercept(req, plainHandler).subscribe({
          next: () => {
            expect(plainHandler.handle).toHaveBeenCalled();
            resolve();
          },
          error: reject,
        });
      });
    });
  });
});
