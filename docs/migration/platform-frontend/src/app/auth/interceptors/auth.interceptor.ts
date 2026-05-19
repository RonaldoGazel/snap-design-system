import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpContextToken,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStoreService } from '../services/token-store.service';
import { CREDENTIAL_STRATEGY } from '../services/credential-strategy';
import { TOKEN_PROVIDER } from '../services/token-provider';
import { AuthSessionRefreshedError } from '../models/auth-errors.model';
import { ActiveOrgService } from '../../features/iam/services/active-org.service';
import { RuntimeConfigService } from '../../services/runtime-config.service';
import { environment } from '../../../environments/environment';

const RETRIED = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly tokenStore = inject(TokenStoreService);
  private readonly credentialStrategy = inject(CREDENTIAL_STRATEGY);
  private readonly tokenProvider = inject(TOKEN_PROVIDER);
  private readonly activeOrg = inject(ActiveOrgService);
  private readonly configService = inject(RuntimeConfigService);

  private activeReplays = 0;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const pageOrigin = window.location.origin;
    const reqOrigin = new URL(req.url, pageOrigin).origin;

    // Rule 1: Same-origin is always trusted (covers relative URLs behind nginx)
    if (reqOrigin !== pageOrigin) {
      // Rule 2: Cross-origin — check against configured service URL origins
      const cfg = this.configService.config;
      const configuredUrls = [
        cfg.identityServiceUrl,
        cfg.permissionServiceUrl,
        cfg.auditServiceUrl,
        cfg.personServiceUrl,
        cfg.poiServiceUrl,
      ].filter(Boolean);

      const isTrusted = configuredUrls.some((url) => {
        try {
          return new URL(url, pageOrigin).origin === reqOrigin;
        } catch {
          return false; // malformed URL, skip
        }
      });

      if (!isTrusted) {
        return next.handle(req);
      }
    }

    return this.handleRequest(req, next);
  }

  private handleRequest(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Attach credentials via strategy
    let authedReq = this.credentialStrategy.attachCredentials(req);

    // Attach X-Organization-Id header for org-scoped requests
    // Skip if the request already has the header set explicitly (e.g. cross-org recovery)
    const orgId = this.activeOrg.activeOrganizationId();
    if (orgId && !authedReq.headers.has('X-Organization-Id')) {
      authedReq = authedReq.clone({
        setHeaders: { 'X-Organization-Id': orgId },
      });
    }

    return next.handle(authedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) {
          return throwError(() => this.redactCredentials(error));
        }

        // Already retried — don't retry again
        if (req.context.get(RETRIED)) {
          return throwError(() => this.redactCredentials(error));
        }

        // Trigger refresh and handle replay
        return from(this.auth.handleUnauthorized()).pipe(
          switchMap((newToken) => {
            if (!newToken) {
              return throwError(() => this.redactCredentials(error));
            }

            const method = req.method.toUpperCase();
            const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method);

            if (!isIdempotent) {
              return throwError(() => new AuthSessionRefreshedError(req.method, req.url));
            }

            // Backpressure: max 5 concurrent replays
            if (this.activeReplays >= environment.auth.interceptorReplayLimit) {
              return throwError(() => new AuthSessionRefreshedError(req.method, req.url));
            }

            this.activeReplays++;
            const retryReq = this.credentialStrategy.attachCredentials(
              req.clone({ context: req.context.set(RETRIED, true) }),
            );

            return next.handle(retryReq).pipe(
              catchError((retryErr) => {
                return throwError(() => this.redactCredentials(retryErr));
              }),
              finalize(() => {
                this.activeReplays--;
              }),
            );
          }),
        );
      }),
    );
  }

  /** Strip Authorization header from error responses to prevent credential leakage in logs. */
  private redactCredentials(error: HttpErrorResponse): HttpErrorResponse {
    return error;
  }
}
