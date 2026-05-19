import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { UserResponse, OrganizationResponse } from '../../models/identity.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

type UserStatus = 'active' | 'inactive' | 'locked';
type TagSeverity = 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger';

const STATUS_SEVERITY: Record<UserStatus, TagSeverity> = {
  active: 'success',
  inactive: 'secondary',
  locked: 'danger',
};

@Component({
  selector: 'app-all-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    ButtonModule,
    Select,
    Message,
    InputTextModule,
    Tag,
    TranslateModule,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="all-users">
        <h2>{{ 'admin.allUsers.title' | translate }}</h2>

        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'admin.allUsers.error.retry' | translate"
                severity="secondary"
                size="small"
                [style]="{ 'margin-left': '1rem' }"
                (onClick)="onRetry()"
              />
            }
          </p-message>
        }

        <div
          class="filter-panel"
          style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-bottom: 1rem;"
        >
          <div class="filter-field">
            <label>{{ 'admin.allUsers.filter.organization' | translate }}</label>
            <p-select
              [(ngModel)]="filterOrgId"
              [options]="orgOptions()"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'admin.allUsers.filter.organization' | translate"
              [showClear]="true"
              (ngModelChange)="onApplyFilters()"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'admin.allUsers.filter.status' | translate }}</label>
            <p-select
              [(ngModel)]="filterStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'admin.allUsers.filter.status' | translate"
              [showClear]="true"
              (ngModelChange)="onApplyFilters()"
            />
          </div>
          <div class="filter-field">
            <label>{{ 'admin.allUsers.filter.search' | translate }}</label>
            <input
              pInputText
              [(ngModel)]="filterSearch"
              [placeholder]="'admin.allUsers.filter.searchPlaceholder' | translate"
              (keyup.enter)="onApplyFilters()"
            />
          </div>
        </div>

        <p-table
          [value]="users()"
          [lazy]="true"
          [totalRecords]="totalRecords()"
          [rows]="limit()"
          [first]="offset()"
          [rowsPerPageOptions]="rowsPerPageOptions"
          [paginator]="true"
          [loading]="loading()"
          (onLazyLoad)="onLazyLoad($event)"
          [style]="{ width: '100%' }"
        >
          <ng-template #header>
            <tr>
              <th>{{ 'admin.allUsers.table.displayName' | translate }}</th>
              <th>{{ 'admin.allUsers.table.email' | translate }}</th>
              <th>{{ 'admin.allUsers.table.status' | translate }}</th>
              <th>{{ 'admin.allUsers.table.organizationId' | translate }}</th>
              <th>{{ 'admin.allUsers.table.clearanceLevel' | translate }}</th>
              <th>{{ 'admin.allUsers.table.createdAt' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-user>
            <tr>
              <td>{{ user.display_name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <p-tag
                  [value]="'admin.allUsers.status.' + user.status | translate"
                  [severity]="getStatusSeverity(user.status)"
                />
              </td>
              <td>{{ user.organization_id }}</td>
              <td>{{ user.clearance_level }}</td>
              <td>{{ user.created_at | date: 'short' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" style="text-align: center;">
                {{ 'admin.allUsers.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: [
    `
      .all-users {
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
    `,
  ],
})
export class AllUsersPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly orgService = inject(OrganizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  readonly users = signal<UserResponse[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);

  // Pagination
  readonly limit = signal<number>(50);
  readonly offset = signal<number>(0);
  readonly rowsPerPageOptions = [20, 50, 100];

  // Filters
  filterOrgId: string | null = null;
  filterStatus: UserStatus | null = null;
  filterSearch = '';

  // Org options for filter dropdown
  readonly orgOptions = signal<{ label: string; value: string }[]>([]);

  get statusOptions(): { label: string; value: string }[] {
    return [
      { label: this.translate.instant('admin.allUsers.status.active'), value: 'active' },
      { label: this.translate.instant('admin.allUsers.status.inactive'), value: 'inactive' },
      { label: this.translate.instant('admin.allUsers.status.locked'), value: 'locked' },
    ];
  }

  getStatusSeverity(status: UserStatus): TagSeverity {
    return STATUS_SEVERITY[status] ?? 'info';
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['limit']) this.limit.set(Number(params['limit']));
    if (params['offset']) this.offset.set(Number(params['offset']));
    if (params['organization_id']) this.filterOrgId = params['organization_id'];
    if (params['status']) this.filterStatus = params['status'];
    if (params['search']) this.filterSearch = params['search'];

    this.loadOrganizations();
    this.fetchUsers();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.offset.set(event.first ?? 0);
    this.limit.set(event.rows ?? this.limit());
    this.syncQueryParams();
    this.fetchUsers();
  }

  onApplyFilters(): void {
    this.offset.set(0);
    this.syncQueryParams();
    this.fetchUsers();
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchUsers();
  }

  private loadOrganizations(): void {
    this.orgService.listOrganizations({ limit: 1000, offset: 0 }).subscribe({
      next: (response) => {
        this.orgOptions.set(
          response.items.map((org: OrganizationResponse) => ({ label: org.name, value: org.id })),
        );
      },
    });
  }

  private fetchUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    const params: Record<string, string | number> = {
      limit: this.limit(),
      offset: this.offset(),
    };
    if (this.filterOrgId) params['organization_id'] = this.filterOrgId;
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterSearch.trim()) params['search'] = this.filterSearch.trim();

    this.userService.listUsers(params as any).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.totalRecords.set(response.total_count);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleListError(err);
      },
    });
  }

  private syncQueryParams(): void {
    const queryParams: Record<string, string | null> = {
      limit: String(this.limit()),
      offset: String(this.offset()),
      organization_id: this.filterOrgId || null,
      status: this.filterStatus || null,
      search: this.filterSearch.trim() || null,
    };

    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value != null) cleanParams[key] = value;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams,
      replaceUrl: true,
    });
  }

  private readonly handleListError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showRetry,
      forbidden: this.forbidden,
    },
    { i18nPrefix: 'admin.allUsers', translate: this.translate },
  );
}
