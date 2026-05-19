import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ButtonModule, TranslateModule],
  template: `
    <div class="flex align-items-center justify-content-center" style="margin-top: 4rem">
      <p-card>
        <ng-template #title>
          <i class="pi pi-lock" style="font-size: 2rem; margin-right: 0.5rem"></i>
        </ng-template>
        <p>{{ messageKey() | translate }}</p>
        <ng-template #footer>
          <p-button
            [label]="'audit.error.forbiddenAction' | translate"
            severity="secondary"
            (onClick)="onGoHome()"
          />
        </ng-template>
      </p-card>
    </div>
  `,
})
export class ForbiddenViewComponent {
  private readonly router = inject(Router);

  readonly messageKey = input<string>('shared.error.forbidden');

  onGoHome(): void {
    this.router.navigate(['/']);
  }
}
