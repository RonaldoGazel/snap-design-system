import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type MessageSeverity = 'success' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  private readonly messageService = inject(MessageService);

  success(summary: string, detail?: string, life: number = 5000): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }

  error(summary: string, detail?: string, life: number = 5000): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life,
    });
  }

  info(summary: string, detail?: string, life: number = 5000): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life,
    });
  }

  warn(summary: string, detail?: string, life: number = 5000): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life,
    });
  }

  clear(): void {
    this.messageService.clear();
  }
}
