import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsInstanceStateService } from '../../services/bpms-instance-state.service';
import { BpmsPendingTask } from '../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pending-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule, TableModule, TagModule, ButtonModule, SelectModule, BadgeModule, InputTextModule,
    TranslateModule
  ],
  templateUrl: './pending-task-list.html',
  styleUrl: './pending-task-list.css',
})
export class PendingTaskListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly stateService = inject(BpmsInstanceStateService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly selectedUnitId = signal<string>('');
  readonly selectedProfileId = signal<string>('');
  readonly filterAction = signal<string | null>(null);
  readonly pendingTasks = this.stateService.pendingTasks;
  readonly pendingCount = this.stateService.pendingCount;
  private readonly apiTasks = signal<BpmsPendingTask[]>([]);

  private readonly effectiveTasks = computed<BpmsPendingTask[]>(() => {
    const unitId = this.selectedUnitId();
    const profileId = this.selectedProfileId();
    return unitId || profileId ? this.apiTasks() : this.pendingTasks();
  });

  readonly filteredTasks = computed<BpmsPendingTask[]>(() => {
    const action = this.filterAction();
    const tasks = this.effectiveTasks();
    if (!action) return tasks;
    return tasks.filter(t => t.expected_action === action);
  });

  readonly actionOptions = [
    { label: 'Todas', value: null },
    { label: 'Revisar', value: 'REVISAR' },
    { label: 'Aprovar', value: 'APROVAR' },
    { label: 'Formalizar', value: 'FORMALIZAR' },
    { label: 'Difundir', value: 'DIFUNDIR' }
  ];

  ngOnInit(): void { this.stateService.loadAll(); }

  loadTasks(): void {
    const unitId = this.selectedUnitId() || undefined;
    const profileId = this.selectedProfileId() || undefined;
    if (unitId || profileId) {
      this.api.getPendingTasks(unitId, profileId).subscribe(tasks => this.apiTasks.set(tasks));
    } else {
      this.apiTasks.set([]);
    }
  }

  navigateToDocument(id: string): void { this.router.navigate(['/intelligence/workflows/documents', id]); }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = { RASCUNHO: 'secondary', EM_PRODUCAO: 'info', EM_REVISAO: 'warn', FORMALIZADO: 'success', CANCELADO: 'danger' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { RASCUNHO: 'workflows.status.draft', EM_PRODUCAO: 'workflows.docStatus.inProduction', EM_REVISAO: 'workflows.docStatus.inReview', FORMALIZADO: 'workflows.docStatus.formalized', CANCELADO: 'workflows.processStatus.CANCELADO' };
    return map[status] ?? status;
  }
}
