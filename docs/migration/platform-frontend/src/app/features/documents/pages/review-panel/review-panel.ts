import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { WorkQueueApiService, WorkQueueItem } from '../services/work-queue-api.service';

/**
 * Review panel — filtered work queue view showing only REVIEW actions.
 *
 * This is a convenience entry point. The actual review actions (approve,
 * return, reject) happen in the document view via workflow transitions.
 */
@Component({
  selector: 'app-review-panel',
  standalone: true,
  imports: [TableModule, ButtonModule, TagModule, SlicePipe, ToastModule, DateFormatPipe],
  providers: [MessageService],
  templateUrl: './review-panel.html',
  styleUrl: './review-panel.css',
})
export class ReviewPanelComponent implements OnInit {
  private readonly workQueueApi = inject(WorkQueueApiService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  items = signal<WorkQueueItem[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadReviewItems();
  }

  loadReviewItems(): void {
    this.loading.set(true);
    this.workQueueApi.getWorkQueue({ actionType: 'REVIEW', limit: 50 }).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar revisões pendentes.',
          life: 5000,
        });
      },
    });
  }

  openDocument(item: WorkQueueItem): void {
    this.router.navigate(['/intelligence', 'documents', item.documentId]);
  }
}
