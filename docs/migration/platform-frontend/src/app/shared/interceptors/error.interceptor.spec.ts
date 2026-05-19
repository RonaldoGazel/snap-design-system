import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthStateService } from '../services/auth-state.service';
import { ToastService } from '../services/toast.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authState: AuthStateService;
  let toast: ToastService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthStateService,
          useValue: { clearSession: vi.fn() },
        },
        {
          provide: ToastService,
          useValue: { error: vi.fn() },
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  it('should clear session, navigate to /login, and show toast on 401', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/test').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authState.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(toast.error).toHaveBeenCalledWith('Sessão expirada', 'Faça login novamente');
  });

  it('should show access denied toast on 403', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/test').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(toast.error).toHaveBeenCalledWith(
      'Acesso negado',
      'Você não tem permissão para esta ação',
    );
  });

  it('should show not found toast on 404', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/test').flush(null, { status: 404, statusText: 'Not Found' });

    expect(toast.error).toHaveBeenCalledWith(
      'Não encontrado',
      'O recurso solicitado não foi encontrado',
    );
  });

  it('should show server error toast on 500', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting
      .expectOne('/api/test')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(toast.error).toHaveBeenCalledWith('Erro no servidor', 'Tente novamente mais tarde');
  });

  it('should show server error toast on 503', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting
      .expectOne('/api/test')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(toast.error).toHaveBeenCalledWith('Erro no servidor', 'Tente novamente mais tarde');
  });

  it('should show connection error toast on status 0', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting
      .expectOne('/api/test')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(toast.error).toHaveBeenCalledWith(
      'Erro de conexão',
      'Verifique sua conexão com o servidor',
    );
  });

  it('should show error message from response body for other errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting
      .expectOne('/api/test')
      .flush({ message: 'Dados inválidos' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(toast.error).toHaveBeenCalledWith('Erro', 'Dados inválidos');
  });

  it('should re-throw the error to the subscriber', () => {
    const errorSpy = vi.fn();

    http.get('/api/test').subscribe({ error: errorSpy });

    httpTesting.expectOne('/api/test').flush(null, { status: 500, statusText: 'Server Error' });

    expect(errorSpy).toHaveBeenCalled();
  });
});
