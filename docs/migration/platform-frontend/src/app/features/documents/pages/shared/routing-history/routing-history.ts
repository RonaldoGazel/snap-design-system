import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { Tag } from 'primeng/tag';

import { Tramitation, TramitationStatus } from '../../models/document.models';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

type TagSeverity = 'success' | 'warn' | 'danger';

const STATUS_SEVERITY_MAP: Record<string, TagSeverity> = {
  RECEIVED: 'success',
  PENDING: 'warn',
  REJECTED: 'danger',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  RECEIVED: 'RECEBIDO',
  PENDING: 'PENDENTE',
  REJECTED: 'REJEITADO',
};

@Component({
  selector: 'app-routing-history',
  standalone: true,
  imports: [CommonModule, TimelineModule, Tag, DateFormatPipe],
  templateUrl: './routing-history.html',
  styleUrl: './routing-history.css',
})
export class RoutingHistoryComponent {
  processId = input<string>();

  tramitations = signal<Tramitation[]>([]);
  loading = signal(false);

  sortedTramitations = computed(() =>
    [...this.tramitations()].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    ),
  );

  constructor() {
    effect(() => {
      const pid = this.processId();
      if (pid) {
        this.loadHistory(pid);
      }
    });
  }

  private loadHistory(processId: string): void {
    // Routing history is now tracked via workflow step logs.
    // This component will be rewired to use the workflow timeline endpoint.
    this.loading.set(false);
    this.tramitations.set([]);
  }

  getStatusColorClass(status: TramitationStatus): string {
    switch (status) {
      case 'RECEIVED':
        return 'routing-history__card--received';
      case 'PENDING':
        return 'routing-history__card--pending';
      case 'REJECTED':
        return 'routing-history__card--rejected';
      default:
        return '';
    }
  }

  getStatusSeverity(status: TramitationStatus): TagSeverity | undefined {
    return STATUS_SEVERITY_MAP[status];
  }

  getStatusLabel(status: TramitationStatus): string {
    return STATUS_LABEL_MAP[status] ?? status;
  }
}
