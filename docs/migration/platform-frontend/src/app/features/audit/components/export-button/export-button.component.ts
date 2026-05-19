import {
  Component,
  ChangeDetectionStrategy,
  Input,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { Message } from 'primeng/message';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogFilterParams } from '../../models/audit-log.model';

@Component({
  selector: 'app-export-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, Menu, Message, TranslateModule],
  template: `
    <div class="export-button-container">
      <p-button
        [label]="'audit.export.button' | translate"
        icon="pi pi-download"
        [loading]="exporting()"
        [disabled]="exporting()"
        (onClick)="menu.toggle($event)"
      />
      <p-menu #menu [model]="exportOptions" [popup]="true" />

      @if (error()) {
        <p-message
          severity="error"
          [style]="{ 'margin-top': '0.5rem' }"
        >
          <span>{{ error()! | translate }}</span>
        </p-message>
      }
    </div>
  `,
  styles: [`
    .export-button-container {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
    }
  `],
})
export class ExportButtonComponent {
  private readonly auditLogService = inject(AuditLogService);

  @Input() filters: Partial<AuditLogFilterParams> = {};

  readonly exporting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly exportOptions: MenuItem[] = [
    {
      label: 'CSV',
      icon: 'pi pi-file',
      command: () => this.export('csv'),
    },
    {
      label: 'JSON',
      icon: 'pi pi-file',
      command: () => this.export('json'),
    },
  ];

  export(format: 'csv' | 'json'): void {
    this.exporting.set(true);
    this.error.set(null);

    this.auditLogService.exportAuditLogs(this.filters, format).subscribe({
      next: ({ blob, filename }) => {
        this.downloadBlob(blob, filename);
        this.exporting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.exporting.set(false);
        this.error.set(this.mapErrorToI18nKey(err));
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private mapErrorToI18nKey(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return 'audit.error.badRequest';
      case 401:
        return 'audit.error.unauthorized';
      case 403:
        return 'audit.error.forbidden';
      case 503:
        return 'audit.error.serviceUnavailable';
      default:
        return 'audit.export.error';
    }
  }
}
