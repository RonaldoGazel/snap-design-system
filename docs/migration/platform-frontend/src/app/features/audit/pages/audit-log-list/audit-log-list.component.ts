import { Component, ChangeDetectionStrategy, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuditLogService } from '../../services/audit-log.service';
import { ForbiddenViewComponent } from '../../components/forbidden-view/forbidden-view.component';
import { ExportButtonComponent } from '../../components/export-button/export-button.component';
import { OrgContextSwitcherComponent } from '../../../iam/components/org-context-switcher/org-context-switcher.component';
import { ActiveOrgService } from '../../../iam/services/active-org.service';
import { formatAuditDate } from '../../utils/date-format.util';
import {
  AuditLogResponse,
  AuditLogQueryParams,
  AuditLogFilterParams,
} from '../../models/audit-log.model';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Select,
    DatePicker,
    Message,
    Tooltip,
    TranslateModule,
    ForbiddenViewComponent,
    ExportButtonComponent,
    OrgContextSwitcherComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="audit-log-list">
        <app-org-context-switcher />
        <h2>{{ 'audit.page.title' | translate }}</h2>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'audit.error.retry' | translate"
                severity="secondary"
                size="small"
                [style]="{ 'margin-left': '1rem' }"
                (onClick)="onRetry()"
              />
            }
          </p-message>
        }

        <!-- Date validation message -->
        @if (dateValidationError()) {
          <p-message severity="warn" [style]="{ 'margin-bottom': '1rem', width: '100%' }">
            <span>{{ 'audit.filter.dateValidation' | translate }}</span>
          </p-message>
        }

        <!-- Filter panel -->
        <div
          class="filter-panel"
          style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-bottom: 1rem;"
        >
          <div class="filter-field">
            <label>{{ 'audit.filter.eventType' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterEventType"
              [placeholder]="'audit.filter.eventType' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.resourceType' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterResourceType"
              [placeholder]="'audit.filter.resourceType' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.outcome' | translate }}</label>
            <p-select
              [(ngModel)]="filterOutcome"
              [options]="outcomeOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'audit.filter.outcome' | translate"
              [showClear]="true"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.producer' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterProducer"
              [placeholder]="'audit.filter.producer' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.actorId' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterActorId"
              [placeholder]="'audit.filter.actorId' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.correlationId' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterCorrelationId"
              [placeholder]="'audit.filter.correlationId' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.resourceId' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterResourceId"
              [placeholder]="'audit.filter.resourceId' | translate"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.occurredAfter' | translate }}</label>
            <p-datepicker [(ngModel)]="filterOccurredAfter" [showTime]="true" [showIcon]="true" />
          </div>
          <div class="filter-field">
            <label>{{ 'audit.filter.occurredBefore' | translate }}</label>
            <p-datepicker [(ngModel)]="filterOccurredBefore" [showTime]="true" [showIcon]="true" />
          </div>
          <div class="filter-actions" style="display: flex; gap: 0.5rem; align-items: flex-end;">
            <p-button [label]="'audit.filter.apply' | translate" (onClick)="onApplyFilters()" />
            <p-button
              [label]="'audit.filter.clear' | translate"
              severity="secondary"
              (onClick)="onClearFilters()"
            />
            <app-export-button [filters]="currentFilters()" />
          </div>
        </div>

        <!-- Table -->
        <p-table
          [value]="logs()"
          [lazy]="true"
          [totalRecords]="totalRecords()"
          [rows]="limit()"
          [first]="offset()"
          [rowsPerPageOptions]="rowsPerPageOptions"
          [paginator]="true"
          [loading]="loading()"
          (onLazyLoad)="onLazyLoad($event)"
          [rowHover]="true"
          [style]="{ width: '100%' }"
        >
          <ng-template #header>
            <tr>
              <th>{{ 'audit.table.occurredAt' | translate }}</th>
              <th>{{ 'audit.table.eventType' | translate }}</th>
              <th>{{ 'audit.table.actorId' | translate }}</th>
              <th>{{ 'audit.table.action' | translate }}</th>
              <th>{{ 'audit.table.resourceType' | translate }}</th>
              <th>{{ 'audit.table.resourceId' | translate }}</th>
              <th>{{ 'audit.table.outcome' | translate }}</th>
              <th>{{ 'audit.table.producer' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-log>
            <tr (click)="onRowClick(log)" style="cursor: pointer;">
              <td>{{ formatDate(log.occurred_at) }}</td>
              <td>{{ log.event_type }}</td>
              <td [pTooltip]="log.actor_id" tooltipPosition="top">
                {{ truncateUuid(log.actor_id) }}
              </td>
              <td>{{ log.action }}</td>
              <td>{{ log.resource_type }}</td>
              <td [pTooltip]="log.resource_id" tooltipPosition="top">
                {{ truncateUuid(log.resource_id) }}
              </td>
              <td>
                <span
                  class="outcome-badge"
                  [class.outcome-success]="log.outcome === 'success'"
                  [class.outcome-failure]="log.outcome === 'failure'"
                >
                  {{ 'audit.outcome.' + log.outcome | translate }}
                </span>
              </td>
              <td>{{ log.producer }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="8" style="text-align: center;">
                {{ 'audit.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: [
    `
      .audit-log-list {
        padding: 1.5rem;
      }
      .filter-panel {
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
      .outcome-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .outcome-success {
        background-color: color-mix(in srgb, var(--p-green-500) 15%, transparent);
        color: var(--p-green-500);
      }
      .outcome-failure {
        background-color: color-mix(in srgb, var(--p-red-500) 15%, transparent);
        color: var(--p-red-500);
      }
    `,
  ],
})
export class AuditLogListComponent implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly logs = signal<AuditLogResponse[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);

  constructor() {
    // Re-fetch when org context changes (platform-admin switching orgs)
    effect(() => {
      this.activeOrg.activeOrganizationId();
      // Reset and re-fetch
      untracked(() => {
        this.logs.set([]);
        this.offset.set(0);
      });
    });
  }

  // Pagination signals
  readonly limit = signal<number>(50);
  readonly offset = signal<number>(0);
  readonly rowsPerPageOptions = [20, 50, 100];

  // Filter form fields (two-way bound via ngModel)
  filterEventType = '';
  filterResourceType = '';
  filterOutcome: 'success' | 'failure' | null = null;
  filterProducer = '';
  filterActorId = '';
  filterCorrelationId = '';
  filterResourceId = '';
  filterOccurredAfter: Date | null = null;
  filterOccurredBefore: Date | null = null;

  // Date validation
  readonly dateValidationError = signal<boolean>(false);

  // Outcome select options — labels resolved via i18n
  get outcomeOptions(): { label: string; value: string }[] {
    return [
      { label: this.translate.instant('audit.outcome.success'), value: 'success' },
      { label: this.translate.instant('audit.outcome.failure'), value: 'failure' },
    ];
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    // Restore pagination from query params
    if (params['limit']) {
      this.limit.set(Number(params['limit']));
    }
    if (params['offset']) {
      this.offset.set(Number(params['offset']));
    }

    // Restore filters from query params
    this.filterEventType = params['event_type'] ?? '';
    this.filterResourceType = params['resource_type'] ?? '';
    this.filterOutcome = params['outcome'] ?? null;
    this.filterProducer = params['producer'] ?? '';
    this.filterActorId = params['actor_id'] ?? '';
    this.filterCorrelationId = params['correlation_id'] ?? '';
    this.filterResourceId = params['resource_id'] ?? '';

    if (params['occurred_after']) {
      this.filterOccurredAfter = new Date(params['occurred_after']);
    }
    if (params['occurred_before']) {
      this.filterOccurredBefore = new Date(params['occurred_before']);
    }
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limit();

    this.offset.set(first);
    this.limit.set(rows);
    this.syncQueryParams();
    this.fetchLogs();
  }

  onApplyFilters(): void {
    // Validate date range
    if (
      this.filterOccurredAfter &&
      this.filterOccurredBefore &&
      this.filterOccurredBefore.getTime() <= this.filterOccurredAfter.getTime()
    ) {
      this.dateValidationError.set(true);
      return;
    }
    this.dateValidationError.set(false);

    this.offset.set(0);
    this.syncQueryParams();
    this.fetchLogs();
  }

  onClearFilters(): void {
    this.filterEventType = '';
    this.filterResourceType = '';
    this.filterOutcome = null;
    this.filterProducer = '';
    this.filterActorId = '';
    this.filterCorrelationId = '';
    this.filterResourceId = '';
    this.filterOccurredAfter = null;
    this.filterOccurredBefore = null;
    this.dateValidationError.set(false);

    this.offset.set(0);
    this.syncQueryParams();
    this.fetchLogs();
  }

  onRowClick(log: AuditLogResponse): void {
    this.router.navigate(['/audit-logs', log.event_id]);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchLogs();
  }

  formatDate(isoDate: string): string {
    return formatAuditDate(isoDate, this.translate.currentLang || 'en');
  }

  truncateUuid(uuid: string): string {
    if (!uuid || uuid.length <= 8) {
      return uuid;
    }
    return uuid.substring(0, 8) + '…';
  }

  currentFilters(): Partial<AuditLogFilterParams> {
    const filters: Partial<AuditLogFilterParams> = {};

    if (this.filterEventType) filters.event_type = this.filterEventType;
    if (this.filterResourceType) filters.resource_type = this.filterResourceType;
    if (this.filterOutcome) filters.outcome = this.filterOutcome;
    if (this.filterProducer) filters.producer = this.filterProducer;
    if (this.filterActorId) filters.actor_id = this.filterActorId;
    if (this.filterCorrelationId) filters.correlation_id = this.filterCorrelationId;
    if (this.filterResourceId) filters.resource_id = this.filterResourceId;
    if (this.filterOccurredAfter) {
      filters.occurred_after = this.filterOccurredAfter.toISOString();
    }
    if (this.filterOccurredBefore) {
      filters.occurred_before = this.filterOccurredBefore.toISOString();
    }

    return filters;
  }

  private buildQueryParams(): AuditLogQueryParams {
    const filters: AuditLogQueryParams = {
      limit: this.limit(),
      offset: this.offset(),
    };

    if (this.filterEventType) filters.event_type = this.filterEventType;
    if (this.filterResourceType) filters.resource_type = this.filterResourceType;
    if (this.filterOutcome) filters.outcome = this.filterOutcome;
    if (this.filterProducer) filters.producer = this.filterProducer;
    if (this.filterActorId) filters.actor_id = this.filterActorId;
    if (this.filterCorrelationId) filters.correlation_id = this.filterCorrelationId;
    if (this.filterResourceId) filters.resource_id = this.filterResourceId;
    if (this.filterOccurredAfter) {
      filters.occurred_after = this.filterOccurredAfter.toISOString();
    }
    if (this.filterOccurredBefore) {
      filters.occurred_before = this.filterOccurredBefore.toISOString();
    }

    return filters;
  }

  private fetchLogs(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    const params = this.buildQueryParams();

    this.auditLogService.getAuditLogs(params).subscribe({
      next: (response) => {
        this.logs.set(response.items);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        if (err.status === 403) {
          this.forbidden.set(true);
          return;
        }

        if (err.status === 400) {
          this.errorMessage.set('audit.error.badRequest');
          this.errorSeverity.set('error');
          this.showRetry.set(false);
          return;
        }

        if (err.status === 503) {
          this.errorMessage.set('audit.error.serviceUnavailable');
          this.errorSeverity.set('warn');
          this.showRetry.set(true);
          return;
        }

        // Network error (status 0) or other
        this.errorMessage.set('audit.error.networkError');
        this.errorSeverity.set('error');
        this.showRetry.set(true);
      },
    });
  }

  private syncQueryParams(): void {
    const queryParams: Record<string, string | null> = {
      limit: String(this.limit()),
      offset: String(this.offset()),
      event_type: this.filterEventType || null,
      resource_type: this.filterResourceType || null,
      outcome: this.filterOutcome || null,
      producer: this.filterProducer || null,
      actor_id: this.filterActorId || null,
      correlation_id: this.filterCorrelationId || null,
      resource_id: this.filterResourceId || null,
      occurred_after: this.filterOccurredAfter?.toISOString() ?? null,
      occurred_before: this.filterOccurredBefore?.toISOString() ?? null,
    };

    // Remove null entries
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value != null) {
        cleanParams[key] = value;
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams,
      replaceUrl: true,
    });
  }
}
