import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-idle-warning',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toast],
  providers: [MessageService],
  template: `<p-toast position="top-center" />`,
})
export class IdleWarningComponent {
  private readonly messageService = inject(MessageService);

  showWarning(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: message,
      life: 120_000,
    });
  }
}
