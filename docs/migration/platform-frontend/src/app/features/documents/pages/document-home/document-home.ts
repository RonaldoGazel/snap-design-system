import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { WorkflowApiBaseService } from '../../../workflows/services/workflow-api-base.service';
import { WorkQueueApiService, WorkQueueItem } from '../services/work-queue-api.service';

export interface KpiCard {
  label: string;
  value: number;
  icon: string;
  route?: string[];
}

/** Enriched work queue item with resolved names. */
export interface EnrichedWorkQueueItem extends WorkQueueItem {
  documentTitle: string;
  documentTypeName: string;
}

/** Item for "My Initiated Documents" tracking list. */
export interface MyDocumentItem {
  documentId: string;
  documentTitle: string;
  currentStepName: string;
  status: string;
  priority: string;
  createdAt: string;
}

/**
 * Document home — dashboard showing work queue items and KPIs.
 *
 * Replaces the old IndexedDB-based local documents list and
 * tramitation-based pending items with the real work queue API.
 */
@Component({
  selector: 'app-document-home',
  standalone: true,
  imports: [TableModule, ButtonModule, ToastModule, TagModule, DateFormatPipe],
  providers: [MessageService],
  templateUrl: './document-home.html',
  styleUrl: './document-home.css',
})
export class DocumentHomeComponent implements OnInit {
  private readonly workQueueApi = inject(WorkQueueApiService);
  private readonly workflowApi = inject(WorkflowApiBaseService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  kpis = signal<KpiCard[]>([]);
  workQueueItems = signal<EnrichedWorkQueueItem[]>([]);
  myDocuments = signal<MyDocumentItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
    this.loadMyDocuments();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.workQueueApi.getWorkQueue({ limit: 10, sortBy: 'priority' }).subscribe({
      next: (response) => {
        // Enrich items with document titles resolved from document-service
        const items = response.items;
        const enriched: EnrichedWorkQueueItem[] = items.map((i) => ({
          ...i,
          documentTitle: i.documentId.slice(0, 8) + '…', // placeholder
          documentTypeName: i.documentType,
        }));
        this.workQueueItems.set(enriched);
        this.kpis.set([
          { label: 'Tarefas Pendentes', value: response.totalCount, icon: 'pi pi-list-check' },
          {
            label: 'Revisões',
            value: items.filter((i) => i.expectedAction === 'REVIEW').length,
            icon: 'pi pi-check-circle',
          },
          {
            label: 'Aprovações',
            value: items.filter((i) => i.expectedAction === 'APPROVE').length,
            icon: 'pi pi-verified',
          },
          {
            label: 'Produção',
            value: items.filter(
              (i) => i.expectedAction === 'PRODUCE' || i.expectedAction === 'CLASSIFY',
            ).length,
            icon: 'pi pi-pencil',
          },
        ]);
        this.loading.set(false);

        // Resolve document titles in background (non-blocking)
        this.resolveDocumentDetails(enriched);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Falha ao carregar fila de trabalho.');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar fila de trabalho.',
          life: 5000,
        });
      },
    });
  }

  private resolveDocumentDetails(items: EnrichedWorkQueueItem[]): void {
    // Get unique document IDs
    const docIds = [...new Set(items.map((i) => i.documentId))];
    if (docIds.length === 0) return;

    // Fetch each document's title (parallel, non-blocking)
    for (const docId of docIds) {
      this.workflowApi.documentGet<any>(`/${docId}`).subscribe({
        next: (res) => {
          const doc = res.data;
          if (!doc) return;
          const title = doc.title ?? doc.id;
          // Update all items with this document ID
          const current = this.workQueueItems();
          const updated = current.map((item) =>
            item.documentId === docId ? { ...item, documentTitle: title } : item,
          );
          this.workQueueItems.set(updated);
        },
        error: () => {
          // Non-fatal — keep the truncated ID as fallback
        },
      });
    }

    // Also resolve document type names
    this.workflowApi.documentTypeGet<any>('').subscribe({
      next: (res) => {
        const types = (res.data as any)?.items ?? res.data ?? [];
        if (!Array.isArray(types) || types.length === 0) return;
        const typeMap = new Map<string, string>();
        for (const t of types) {
          typeMap.set(t.id, t.name);
        }
        const current = this.workQueueItems();
        const updated = current.map((item) => ({
          ...item,
          documentTypeName: typeMap.get(item.documentType) ?? item.documentType,
        }));
        this.workQueueItems.set(updated);
      },
      error: () => {},
    });
  }

  navigateToNewDocument(): void {
    this.router.navigate(['/intelligence', 'documents', 'new']);
  }

  navigateToInbox(): void {
    this.router.navigate(['/intelligence', 'documents', 'inbox']);
  }

  onWorkQueueItemClick(item: WorkQueueItem | MyDocumentItem): void {
    const docId = 'documentId' in item ? item.documentId : (item as MyDocumentItem).documentId;
    this.router.navigate(['/intelligence', 'documents', docId]);
  }

  prioritySeverity(priority: string): 'danger' | 'warn' | 'info' | 'secondary' {
    switch (priority) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warn';
      case 'normal':
        return 'info';
      default:
        return 'secondary';
    }
  }

  onKpiClick(kpi: KpiCard): void {
    if (kpi.route) {
      this.router.navigate(kpi.route);
    }
  }

  private loadMyDocuments(): void {
    this.workflowApi
      .documentGet<any>('', {
        params: new HttpParams().set('page_size', '10').set('mine_only', 'true'),
      })
      .subscribe({
        next: (res) => {
          // wrap() extracts the data field — for paginated responses,
          // res.data is the items array directly (wrap sees {data:[...]} and extracts it)
          const docs = Array.isArray(res.data) ? res.data : [];
          if (docs.length === 0) return;

          const items: MyDocumentItem[] = docs.map((doc: any) => ({
            documentId: doc.id,
            documentTitle: doc.title,
            currentStepName: '—',
            status: doc.status,
            priority: 'normal',
            createdAt: doc.created_at ?? doc.createdAt,
          }));
          this.myDocuments.set(items);

          // Resolve current step names from workflow instances
          for (const item of items) {
            if (!item.documentId) continue;
            this.workflowApi
              .workflowGet<any>('/instances', {
                params: new HttpParams().set('document_id', item.documentId).set('limit', '1'),
              })
              .subscribe({
                next: (instRes) => {
                  const instData = instRes.data as any;
                  const instances = instData?.items ?? (Array.isArray(instData) ? instData : []);
                  if (instances.length === 0) return;
                  const inst = instances[0];
                  const stepId = inst.current_step_id;
                  if (!stepId || !inst.definition_id) return;
                  this.workflowApi
                    .workflowGet<any>(`/definitions/${inst.definition_id}`)
                    .subscribe({
                      next: (defRes) => {
                        const def = defRes.data;
                        const steps = def?.steps ?? [];
                        const step = steps.find((s: any) => s.id === stepId);
                        if (!step) return;
                        const current = this.myDocuments();
                        this.myDocuments.set(
                          current.map((d) =>
                            d.documentId === item.documentId
                              ? {
                                  ...d,
                                  currentStepName: step.name,
                                  priority: inst.priority ?? 'normal',
                                }
                              : d,
                          ),
                        );
                      },
                      error: () => {},
                    });
                },
                error: () => {},
              });
          }
        },
        error: () => {},
      });
  }
}
