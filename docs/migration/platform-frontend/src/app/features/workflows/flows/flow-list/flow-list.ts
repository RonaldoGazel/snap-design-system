import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsFlow, BpmsDocumentType } from '../../models/bpms.model';
import { FlowStatus } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule,
    TranslateModule
  ],
  templateUrl: './flow-list.html',
  styleUrl: './flow-list.css',
})
export class FlowListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly flows = signal<BpmsFlow[]>([]);
  readonly docTypes = signal<BpmsDocumentType[]>([]);
  readonly searchText = signal('');
  readonly filterStatus = signal<string | null>(null);
  readonly filterDocTypeId = signal<string | null>(null);

  readonly statusOptions = [
    { label: 'Todos', value: null },
    { label: this.translate.instant('workflows.status.draft'), value: FlowStatus.DRAFT },
    { label: this.translate.instant('workflows.status.published'), value: FlowStatus.PUBLISHED },
    { label: this.translate.instant('workflows.status.archived'), value: FlowStatus.ARCHIVED }
  ];

  readonly filteredFlows = computed(() => {
    const search = this.searchText().toLowerCase();
    const status = this.filterStatus();
    const docTypeId = this.filterDocTypeId();
    return this.flows().filter(f => {
      if (search && !f.code.toLowerCase().includes(search) && !f.name.toLowerCase().includes(search)) return false;
      if (status && f.status !== status) return false;
      if (docTypeId) {
        const linked = f.flow_doc_types?.some(fdt => fdt.document_type.id === docTypeId) ?? false;
        if (!linked) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getFlows().subscribe(data => this.flows.set(data));
    this.api.getDocumentTypes().subscribe(data => this.docTypes.set(data));
  }

  navigateToNew(): void { this.router.navigate(['/intelligence/workflows/flows/new']); }
  navigateToDetail(flow: BpmsFlow): void { this.router.navigate(['/intelligence/workflows/flows', flow.id]); }
  navigateToEdit(flow: BpmsFlow): void { this.router.navigate(['/intelligence/workflows/flows', flow.id]); }

  duplicateFlow(flow: BpmsFlow): void {
    this.api.duplicateFlow(flow.id).subscribe(newFlow => {
      this.flows.update(list => [...list, newFlow]);
    });
  }

  statusSeverity(status: string): 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' {
    const map: Record<string, 'warn' | 'success' | 'danger'> = { RASCUNHO: 'warn', ATIVO: 'success', INATIVO: 'danger' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { RASCUNHO: 'workflows.status.draft', ATIVO: 'workflows.status.published', INATIVO: 'workflows.status.archived' };
    return map[status] ?? status;
  }

  docTypeNames(flow: BpmsFlow): string {
    return flow.flow_doc_types?.map(fdt => fdt.document_type.code).join(', ') ?? '—';
  }

  versionsCount(flow: BpmsFlow): number {
    return flow.versions?.length ?? 0;
  }
}
