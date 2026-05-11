import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressSpinner],
  template: `
    <div class="flex align-items-center justify-content-center" style="height: 100vh">
      <p-progressspinner ariaLabel="Authenticating" />
    </div>
  `,
})
export class CallbackComponent {}
