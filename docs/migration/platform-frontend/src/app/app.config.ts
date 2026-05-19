import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { HttpBackend } from '@angular/common/http';
import { MultiFileTranslateLoader } from './services/multi-file-translate-loader';
import { ApoloPreset } from './themes/apolo-preset';

import { routes } from './app.routes';
import { AuthService } from './auth/services/auth.service';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import {
  CREDENTIAL_STRATEGY,
  BearerTokenStrategy,
  BffCookieStrategy,
} from './auth/services/credential-strategy';
import { TOKEN_PROVIDER } from './auth/services/token-provider';
import { StandaloneTokenProvider } from './auth/services/standalone-token-provider';
import { environment } from '../environments/environment';
import { RuntimeConfigService } from './services/runtime-config.service';

function initializeApp(
  configService: RuntimeConfigService,
  authService: AuthService,
): () => Promise<void> {
  return async () => {
    await configService.load();
    await authService.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: ApoloPreset,
        options: {
          darkModeSelector: '.p-dark',
        },
      },
    }),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: (httpBackend: HttpBackend) =>
          new MultiFileTranslateLoader(httpBackend, './locales/', [
            'common',
            'auth',
            'shell',
            'admin',
            'audit',
            'snap',
            'documents',
            'person',
            'workflows',
            'tasks',
          ]),
        deps: [HttpBackend],
      },
      fallbackLang: 'en',
      lang: 'en',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [RuntimeConfigService, AuthService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: CREDENTIAL_STRATEGY,
      useClass:
        environment.credentialStrategy === 'bearer' ? BearerTokenStrategy : BffCookieStrategy,
    },
    {
      provide: TOKEN_PROVIDER,
      useClass: StandaloneTokenProvider,
    },
    MessageService,
    ConfirmationService,
  ],
};
