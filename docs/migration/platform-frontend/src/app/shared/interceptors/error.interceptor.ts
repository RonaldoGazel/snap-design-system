import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthStateService } from '../services/auth-state.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      const status = error.status ?? 0;
      const isAuthEndpoint = req.url.includes('/auth/login');

      // Auth endpoints handle their own errors in the component
      if (isAuthEndpoint) {
        return throwError(() => error);
      }

      if (status === 401) {
        authState.clearSession();
        router.navigate(['/login']);
        toast.error('Sessão expirada', 'Faça login novamente');
      } else if (status === 403) {
        toast.error('Acesso negado', 'Você não tem permissão para esta ação');
      } else if (status === 404) {
        toast.error('Não encontrado', 'O recurso solicitado não foi encontrado');
      } else if (status >= 500) {
        toast.error('Erro no servidor', 'Tente novamente mais tarde');
      } else if (status === 0) {
        toast.error('Erro de conexão', 'Verifique sua conexão com o servidor');
      } else {
        const message = error.error?.message ?? error.message ?? 'Ocorreu um erro inesperado';
        toast.error('Erro', message);
      }

      return throwError(() => error);
    }),
  );
};
