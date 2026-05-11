import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import {
  DisseminationInboxService,
  ReceivedDissemination,
} from '../services/dissemination-inbox.service';
import { handleDocumentError } from '../services/error-handler.util';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    FormsModule,
    TabsModule,
    TableModule,
    PaginatorModule,
    DialogModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './inbox.html',
  styleUrl: './inbox.css',
})
export class InboxComponent implements OnInit {
  private readonly disseminationService = inject(DisseminationInboxService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  activeTab = signal(0);
  error = signal<string | null>(null);

  // Received disseminations
  receivedItems = signal<ReceivedDissemination[]>([]);
  receivedLoading = signal(false);

  ngOnInit(): void {
    this.loadReceived();
  }

  onTabChange(value: string | number | undefined): void {
    this.activeTab.set(Number(value ?? 0));
  }

  loadReceived(): void {
    this.receivedLoading.set(true);
    this.disseminationService.getReceivedDisseminations().subscribe({
      next: (items) => {
        this.receivedItems.set(items);
        this.receivedLoading.set(false);
      },
      error: () => {
        this.receivedLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar difusões recebidas.',
          life: 5000,
        });
      },
    });
  }

  openDocument(item: ReceivedDissemination): void {
    this.router.navigate(['/intelligence', 'documents', 'inbox', 'document'], {
      queryParams: {
        documentId: item.documentId,
        title: item.documentTitle || 'Documento',
        protocol: item.protocolReference || '',
        receivedAt: item.createdAt,
      },
    });
  }
}
