import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { TabsModule } from 'primeng/tabs';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TreeNode, MenuItem, MessageService } from 'primeng/api';

import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { RoutingHistoryComponent } from '../shared/routing-history/routing-history';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ProcessService } from '../services/process.service';
import { DocumentService } from '../services/document.service';
import { Process, Document } from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

@Component({
  selector: 'app-process-detail',
  standalone: true,
  imports: [
    FormsModule,
    TreeModule,
    TabsModule,
    MenuModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    ClassificationBadgeComponent,
    StatusBadgeComponent,
    RoutingHistoryComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.css',
})
export class ProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly processService = inject(ProcessService);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);

  process = signal<Process | null>(null);
  documents = signal<Document[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  tramitationDialogVisible = signal(false);
  tramitationPayload = signal<{ toSectorId: string; observation: string }>({
    toSectorId: '',
    observation: '',
  });

  documentTree = computed<TreeNode[]>(() => this.buildTree(this.documents()));

  actionMenuItems: MenuItem[] = [
    {
      label: 'Novo Documento',
      icon: 'pi pi-file-plus',
      command: () => this.navigateToNewDocument(),
    },
    {
      label: 'Tramitar',
      icon: 'pi pi-send',
      command: () => this.tramitationDialogVisible.set(true),
    },
    { label: 'Arquivar', icon: 'pi pi-box' },
    { label: 'Cancelar', icon: 'pi pi-times' },
  ];

  sectorOptions = [
    { label: 'Setor A', value: 'sector-a' },
    { label: 'Setor B', value: 'sector-b' },
    { label: 'Setor C', value: 'sector-c' },
  ];

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadProcess(id);
          this.loadDocuments(id);
        }
      });
    });
  }

  private loadProcess(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.processService.getProcess(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.process.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Processo não encontrado.');
        handleDocumentError(err, this.messageService, this.router);
      },
    });
  }

  private loadDocuments(processId: string): void {
    this.documentService.getDocuments(processId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.documents.set(res.data.items);
        }
      },
    });
  }

  buildTree(docs: Document[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const doc of docs) {
      map.set(doc.id, {
        key: doc.id,
        label: doc.title,
        data: doc,
        children: [],
        styleClass: doc.isActive ? 'doc-active' : 'doc-archived',
      });
    }

    for (const doc of docs) {
      const node = map.get(doc.id)!;
      if (doc.parentId && map.has(doc.parentId)) {
        map.get(doc.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    this.sortChildren(roots);
    return roots;
  }

  private sortChildren(nodes: TreeNode[]): void {
    nodes.sort((a, b) => (a.data as Document).orderIndex - (b.data as Document).orderIndex);
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortChildren(node.children);
      }
    }
  }

  onNodeSelect(event: { node: TreeNode }): void {
    const doc = event.node.data as Document;
    this.router.navigate(['/intelligence', 'documentos', 'editor', doc.id]);
  }

  navigateToNewDocument(): void {
    this.router.navigate(['/intelligence', 'documentos', 'new']);
  }

  navigateToProcessList(): void {
    this.router.navigate(['/intelligence', 'documentos', 'processes']);
  }

  submitTramitation(): void {
    const proc = this.process();
    const payload = this.tramitationPayload();
    if (!proc || !payload.toSectorId) return;

    // Tramitation is now handled via workflow dissemination.
    // This will be fully implemented when the dissemination panel is wired.
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Use a difusão do documento para encaminhar.',
      life: 5000,
    });
    this.tramitationDialogVisible.set(false);
    this.tramitationPayload.set({ toSectorId: '', observation: '' });
  }
}
