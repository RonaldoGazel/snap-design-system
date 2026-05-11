import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { OidcDiscoveryService } from '../../services/oidc-discovery.service';

@Component({
  selector: 'app-auth-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ButtonModule, TranslateModule],
  template: `
    <div class="flex align-items-center justify-content-center" style="height: 100vh">
      <p-card>
        <ng-template #title>{{ 'auth.error.title' | translate }}</ng-template>
        <p>{{ 'auth.error.message' | translate }}</p>
        <ng-template #footer>
          <p-button
            [label]="'auth.error.retryButton' | translate"
            [loading]="retrying()"
            (onClick)="onRetry()"
          />
        </ng-template>
      </p-card>
    </div>
  `,
})
export class AuthErrorComponent {
  private readonly oidcDiscovery = inject(OidcDiscoveryService);
  private readonly router = inject(Router);

  readonly retrying = signal(false);

  async onRetry(): Promise<void> {
    this.retrying.set(true);
    try {
      await this.oidcDiscovery.discover();
      this.router.navigateByUrl('/');
    } catch {
      this.retrying.set(false);
    }
  }
}
