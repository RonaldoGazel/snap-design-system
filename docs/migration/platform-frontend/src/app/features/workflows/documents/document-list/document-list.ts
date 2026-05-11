import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsDocumentInstance, BpmsTemplate, BpmsDocumentType } from '../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bpms-document-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule,
    TranslateModule
  ],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly instances = signal<BpmsDocumentInstance[]>([]);
  readonly templates = signal<BpmsTemplate[]>([]);
  readonly docTypes = signal<BpmsDocumentType[]>([]);
  readonly searchText = signal('');
  readonly filterStatus = signal<string | null>(null);
  readonly filterDocTypeId = signal<string | null>(null);

  readonly statusOptions = [
    { label: 'Todos', value: null },
    { label: this.translate.instant('workflows.docStatus.inProduction'), value: 'EM_PRODUCAO' },
    { label: this.translate.instant('workflows.docStatus.inReview'), value: 'EM_REVISAO' },
    { label: this.translate.instant('workflows.docStatus.awaitingFormalization'), value: 'EM_FORMALIZACAO' },
    { label: this.translate.instant('workflows.docStatus.formalized'), value: 'FORMALIZADO' },
    { label: this.translate.instant('workflows.docStatus.disseminatedInternal'), value: 'EM_DIFUSAO' },
    { label: this.translate.instant('workflows.processStatus.ENCERRADO'), value: 'ENCERRADO' }
  ];

  readonly docTypeOptions = computed(() => [
    { label: 'Todos', value: null },
    ...this.docTypes().map(dt => ({ label: dt.name, value: dt.id }))
  ]);

  readonly filteredInstances = computed(() => {
    const search = this.searchText().toLowerCase();
    const status = this.filterStatus();
    const docTypeId = this.filterDocTypeId();
    return this.instances().filter(inst => {
      if (search) {
        const title = inst.title?.toLowerCase() ?? '';
        const nup = inst.nup?.toLowerCase() ?? '';
        const templateName = inst.template?.name?.toLowerCase() ?? '';
        const docTypeName = inst.template?.name?.toLowerCase() ?? '';
        if (!title.includes(search) && !nup.includes(search) && !templateName.includes(search) && !docTypeName.includes(search)) return false;
      }
      if (status && inst.status !== status) return false;
      if (docTypeId && inst.template?.name !== docTypeId) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getDocumentInstances().subscribe(data => this.instances.set(data));
    this.api.getTemplates().subscribe(data => this.templates.set(data));
    this.api.getDocumentTypes().subscribe(data => this.docTypes.set(data));
  }

  navigateToNew(): void { this.router.navigate(['/intelligence/workflows/documents/new']); }
  navigateToDetail(inst: BpmsDocumentInstance): void { this.router.navigate(['/intelligence/workflows/documents', inst.id]); }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = { FORMALIZADO: 'success', ENCERRADO: 'secondary', EM_PRODUCAO: 'info', EM_REVISAO: 'warn', EM_FORMALIZACAO: 'warn', EM_DIFUSAO: 'info' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { EM_PRODUCAO: 'workflows.docStatus.inProduction', EM_REVISAO: 'workflows.docStatus.inReview', EM_FORMALIZACAO: 'workflows.docStatus.awaitingFormalization', FORMALIZADO: 'workflows.docStatus.formalized', EM_DIFUSAO: 'Em Difusão', ENCERRADO: 'workflows.processStatus.ENCERRADO' };
    return map[status] ?? status;
  }
}
