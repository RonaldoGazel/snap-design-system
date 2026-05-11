import { UpperCasePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { Tag } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TaskService } from '../../services/task.service';
import { OrgContextSwitcherComponent } from '../../../iam/components/org-context-switcher/org-context-switcher.component';
import { ActiveOrgService } from '../../../iam/services/active-org.service';
import { TaskResponse } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    Select,
    DatePicker,
    Message,
    Tooltip,
    Tag,
    UpperCasePipe,
    TranslateModule,
    OrgContextSwitcherComponent,
  ],
  template: `
    <div class="task-list">
      <app-org-context-switcher />
      <h2>{{ 'tasks.page.title' | translate }}</h2>

      @if (errorMessage()) {
        <p-message severity="error" [style]="{ 'margin-bottom': '1rem', width: '100%' }">
          <span>{{ errorMessage() }}</span>
          <p-button label="Retry" severity="secondary" size="small"
            [style]="{ 'margin-left': '1rem' }" (onClick)="onRetry()" />
        </p-message>
      }

      <!-- Filters -->
      <div class="filter-panel">
        <div class="filter-field">
          <label>{{ 'tasks.filter.status' | translate }}</label>
          <p-select [(ngModel)]="filterStatus" [options]="statusOptions"
            optionLabel="label" optionValue="value"
            [placeholder]="'tasks.filter.status' | translate" [showClear]="true" />
        </div>
        <div class="filter-field">
          <label>{{ 'tasks.filter.sourceType' | translate }}</label>
          <p-select [(ngModel)]="filterSourceType" [options]="sourceTypeOptions"
            optionLabel="label" optionValue="value"
            [placeholder]="'tasks.filter.sourceType' | translate" [showClear]="true" />
        </div>
        <div class="filter-field">
          <label>{{ 'tasks.filter.createdAfter' | translate }}</label>
          <p-datepicker [(ngModel)]="filterCreatedAfter" [showTime]="true" [showIcon]="true" />
        </div>
        <div class="filter-field">
          <label>{{ 'tasks.filter.createdBefore' | translate }}</label>
          <p-datepicker [(ngModel)]="filterCreatedBefore" [showTime]="true" [showIcon]="true" />
        </div>
        <div class="filter-actions">
          <p-button [label]="'tasks.filter.apply' | translate" (onClick)="onApplyFilters()" />
          <p-button [label]="'tasks.filter.clear' | translate" severity="secondary" (onClick)="onClearFilters()" />
        </div>
      </div>

      <!-- Table -->
      <p-table
        [value]="tasks()"
        [lazy]="true"
        [totalRecords]="totalRecords()"
        [rows]="limit()"
        [first]="offset()"
        [rowsPerPageOptions]="[20, 50, 100]"
        [paginator]="true"
        [loading]="loading()"
        (onLazyLoad)="onLazyLoad($event)"
        [rowHover]="true"
        [style]="{ width: '100%' }">
        <ng-template #header>
          <tr>
            <th>{{ 'tasks.table.createdAt' | translate }}</th>
            <th>{{ 'tasks.table.description' | translate }}</th>
            <th>{{ 'tasks.table.status' | translate }}</th>
            <th>{{ 'tasks.table.sourceType' | translate }}</th>
            <th>{{ 'tasks.table.requestedBy' | translate }}</th>
            <th>{{ 'tasks.table.duration' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template #body let-task>
          <tr>
            <td>{{ formatDate(task.created_at) }}</td>
            <td>{{ task.description || '-' }}</td>
            <td>
              <p-tag [value]="'tasks.status.' + task.status | translate" [severity]="statusSeverity(task.status)" />
            </td>
            <td>{{ task.source_type | uppercase }}</td>
            <td [pTooltip]="task.requested_by || ''" tooltipPosition="top">
              {{ truncateUuid(task.requested_by) }}
            </td>
            <td>{{ calcDuration(task.created_at, task.updated_at) }}</td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6" style="text-align: center;">
              {{ 'tasks.table.empty' | translate }}
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .task-list { padding: 1.5rem; }
    .filter-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-end;
      margin-bottom: 1rem;
      padding: 1rem;
      border: 1px solid var(--p-content-border-color);
      border-radius: 8px;
      background: var(--p-content-background);
    }
    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .filter-field label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--p-text-color);
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }
  `],
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly tasks = signal<TaskResponse[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly limit = signal<number>(50);
  readonly offset = signal<number>(0);

  filterStatus: string | null = null;
  filterSourceType: string | null = null;
  filterCreatedAfter: Date | null = null;
  filterCreatedBefore: Date | null = null;

  readonly statusOptions = [
    { label: 'ACCEPTED', value: 'ACCEPTED' },
    { label: 'FETCHING_SOURCE', value: 'FETCHING_SOURCE' },
    { label: 'UPLOADING_REPORT', value: 'UPLOADING_REPORT' },
    { label: 'QUEUED_FOR_INGESTION', value: 'QUEUED_FOR_INGESTION' },
    { label: 'INGESTING', value: 'INGESTING' },
    { label: 'COMPLETED', value: 'COMPLETED' },
    { label: 'FAILED', value: 'FAILED' },
  ];

  readonly sourceTypeOptions = [
    { label: 'SNAP', value: 'snap' },
    { label: 'SIPEN', value: 'sipen' },
  ];

  constructor() {
    effect(() => {
      this.activeOrg.activeOrganizationId();
      this.tasks.set([]);
      this.offset.set(0);
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['limit']) this.limit.set(Number(params['limit']));
    if (params['offset']) this.offset.set(Number(params['offset']));
    this.filterStatus = params['status'] ?? null;
    this.filterSourceType = params['source_type'] ?? null;
    if (params['created_after']) this.filterCreatedAfter = new Date(params['created_after']);
    if (params['created_before']) this.filterCreatedBefore = new Date(params['created_before']);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.offset.set(event.first ?? 0);
    this.limit.set(event.rows ?? this.limit());
    this.syncQueryParams();
    this.fetchTasks();
  }

  onApplyFilters(): void {
    this.offset.set(0);
    this.syncQueryParams();
    this.fetchTasks();
  }

  onClearFilters(): void {
    this.filterStatus = null;
    this.filterSourceType = null;
    this.filterCreatedAfter = null;
    this.filterCreatedBefore = null;
    this.offset.set(0);
    this.syncQueryParams();
    this.fetchTasks();
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.fetchTasks();
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(this.translate.currentLang || 'pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  truncateUuid(value: string | null): string {
    if (!value) return '-';
    if (value.length <= 8) return value;
    return value.substring(0, 8) + '…';
  }

  calcDuration(start: string, end: string): string {
    if (!start || !end) return '-';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return '-';
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      case 'ACCEPTED': return 'info';
      case 'FETCHING_SOURCE':
      case 'UPLOADING_REPORT':
      case 'QUEUED_FOR_INGESTION':
      case 'INGESTING':
        return 'warn';
      default: return 'secondary';
    }
  }

  private fetchTasks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.taskService.getTasks({
      limit: this.limit(),
      offset: this.offset(),
      status: this.filterStatus,
      source_type: this.filterSourceType,
      created_after: this.filterCreatedAfter?.toISOString() ?? null,
      created_before: this.filterCreatedBefore?.toISOString() ?? null,
    }).subscribe({
      next: (response) => {
        this.tasks.set(response.items);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Failed to load tasks');
      },
    });
  }

  private syncQueryParams(): void {
    const qp: Record<string, string> = {
      limit: String(this.limit()),
      offset: String(this.offset()),
    };
    if (this.filterStatus) qp['status'] = this.filterStatus;
    if (this.filterSourceType) qp['source_type'] = this.filterSourceType;
    if (this.filterCreatedAfter) qp['created_after'] = this.filterCreatedAfter.toISOString();
    if (this.filterCreatedBefore) qp['created_before'] = this.filterCreatedBefore.toISOString();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      replaceUrl: true,
    });
  }
}
