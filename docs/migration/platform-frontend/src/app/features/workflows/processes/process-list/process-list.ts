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
import { BpmsProcess } from '../../models/bpms.model';
import { ProcessStatus } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bpms-process-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule,
    TranslateModule
  ],
  templateUrl: './process-list.html',
  styleUrl: './process-list.css',
})
export class ProcessListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly processes = signal<BpmsProcess[]>([]);
  readonly searchText = signal('');
  readonly filterStatus = signal<string | null>(null);

  readonly statusOptions = [
    { label: 'Todos', value: null },
    { label: this.translate.instant('workflows.processStatus.ABERTO'), value: ProcessStatus.OPEN },
    { label: this.translate.instant('workflows.processStatus.ENCERRADO'), value: ProcessStatus.CLOSED },
    { label: this.translate.instant('workflows.processStatus.CANCELADO'), value: ProcessStatus.CANCELLED }
  ];

  readonly filteredProcesses = computed(() => {
    const search = this.searchText().toLowerCase();
    const status = this.filterStatus();
    return this.processes().filter(p => {
      if (search && !p.identifier.toLowerCase().includes(search) && !p.subject.toLowerCase().includes(search)) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getProcesses().subscribe(data => this.processes.set(data));
  }

  navigateToNew(): void { this.router.navigate(['/intelligence/workflows/processes/new']); }
  navigateToDetail(p: BpmsProcess): void { this.router.navigate(['/intelligence/workflows/processes', p.id]); }

  statusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary'> = { ABERTO: 'success', ENCERRADO: 'secondary', CANCELADO: 'danger' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ABERTO: 'workflows.processStatus.ABERTO', ENCERRADO: 'workflows.processStatus.ENCERRADO', CANCELADO: 'workflows.processStatus.CANCELADO' };
    return map[status] ?? status;
  }

  documentCount(p: BpmsProcess): number { return p.document_instances?.length ?? 0; }
}
