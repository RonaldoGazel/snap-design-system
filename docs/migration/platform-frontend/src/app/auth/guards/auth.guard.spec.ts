import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ExecutionModeService } from '../../services/execution-mode.service';
import { SessionState } from '../models/session-state.model';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let executionModeService: ExecutionModeService;
  let authServiceMock: {
    snapshot: SessionState;
    sessionState$: BehaviorSubject<SessionState>;
    login: ReturnType<typeof vi.fn>;
  };

  const mockRoute = {} as ActivatedRouteSnapshot;

  function mockState(url: string): RouterStateSnapshot {
    return { url } as RouterStateSnapshot;
  }

  function createSessionState(status: SessionState['status']): SessionState {
    return { status, user: null, isRefreshing: false, isStale: false };
  }

  beforeEach(() => {
    authServiceMock = {
      snapshot: createSessionState('unauthenticated'),
      sessionState$: new BehaviorSubject<SessionState>(createSessionState('unauthenticated')),
      login: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        ExecutionModeService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    executionModeService = TestBed.inject(ExecutionModeService);
  });

  it('should allow navigation when authenticated', async () => {
    authServiceMock.snapshot = createSessionState('authenticated');
    const result = await guard.canActivate(mockRoute, mockState('/dashboard'));
    expect(result).toBe(true);
  });

  it('should deny navigation and call login when unauthenticated', async () => {
    authServiceMock.snapshot = createSessionState('unauthenticated');
    const result = await guard.canActivate(mockRoute, mockState('/dashboard'));
    expect(result).toBe(false);
    expect(authServiceMock.login).toHaveBeenCalledWith('/dashboard');
  });

  it('should wait for initialization to complete before evaluating', async () => {
    authServiceMock.snapshot = createSessionState('initializing');
    authServiceMock.sessionState$ = new BehaviorSubject<SessionState>(
      createSessionState('initializing'),
    );

    const promise = guard.canActivate(mockRoute, mockState('/'));

    // Simulate initialization completing
    setTimeout(() => {
      authServiceMock.snapshot = createSessionState('authenticated');
      authServiceMock.sessionState$.next(createSessionState('authenticated'));
    }, 10);

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should pass current URL to login for return URL storage', async () => {
    authServiceMock.snapshot = createSessionState('unauthenticated');
    await guard.canActivate(mockRoute, mockState('/protected/page'));
    expect(authServiceMock.login).toHaveBeenCalledWith('/protected/page');
  });

  describe('federated mode', () => {
    beforeEach(() => {
      executionModeService.markAsFederated();
    });

    it('should allow navigation immediately without checking auth status', async () => {
      authServiceMock.snapshot = createSessionState('unauthenticated');
      const result = await guard.canActivate(mockRoute, mockState('/app/intelligence/person'));
      expect(result).toBe(true);
    });

    it('should not call login in federated mode', async () => {
      authServiceMock.snapshot = createSessionState('unauthenticated');
      await guard.canActivate(mockRoute, mockState('/app/intelligence/person'));
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should not wait for initialization in federated mode', async () => {
      authServiceMock.snapshot = createSessionState('initializing');
      const result = await guard.canActivate(mockRoute, mockState('/app/snap'));
      expect(result).toBe(true);
    });
  });
});
