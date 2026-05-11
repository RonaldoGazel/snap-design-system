import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-expired',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ButtonModule, TranslateModule],
  template: `
    <div class="flex align-items-center justify-content-center" style="height: 100vh">
      <p-card>
        <ng-template #title>{{ 'auth.sessionExpired.title' | translate }}</ng-template>
        <p>{{ 'auth.sessionExpired.message' | translate }}</p>
        <ng-template #footer>
          <p-button
            [label]="'auth.sessionExpired.loginButton' | translate"
            (onClick)="onLogin()"
          />
        </ng-template>
      </p-card>
    </div>
  `,
})
export class SessionExpiredComponent {
  private readonly auth = inject(AuthService);

  onLogin(): void {
    this.auth.login();
  }
}
