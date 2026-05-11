import { Component, ChangeDetectionStrategy, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { SectionService } from '../../services/section.service';
import { ClearanceLevelService } from '../../services/clearance-level.service';
import { OrgContextSwitcherComponent } from '../../components/org-context-switcher/org-context-switcher.component';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { UserResponse, CreateUserRequest, SectionResponse } from '../../models/identity.model';
import { RoleResponse } from '../../models/permission.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';
import { extractErrorCode, extractErrorMessage } from '../../../../shared/utils/request-state';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    ButtonModule,
    Select,
    Message,
    Dialog,
    InputTextModule,
    TranslateModule,
    OrgContextSwitcherComponent,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="user-list">
        <app-org-context-switcher />

        <h2>{{ 'admin.users.title' | translate }}</h2>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'admin.users.error.retry' | translate"
                severity="secondary"
                size="small"
                [style]="{ 'margin-left': '1rem' }"
                (onClick)="onRetry()"
              />
            }
          </p-message>
        }

        <!-- Filter panel -->
        <div
          class="filter-panel"
          style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-bottom: 1rem;"
        >
          <div class="filter-field">
            <label>{{ 'admin.users.filter.status' | translate }}</label>
            <p-select
              [(ngModel)]="filterStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'admin.users.filter.status' | translate"
              [showClear]="true"
              (ngModelChange)="onApplyFilters()"
            />
          </div>
          @if (activeOrg.canMutate()) {
            <div
              class="filter-actions"
              style="display: flex; gap: 0.5rem; align-items: flex-end; margin-left: auto;"
            >
              <p-button
                data-testid="iam-user-create-btn"
                [label]="'admin.users.create' | translate"
                icon="pi pi-plus"
                (onClick)="onOpenCreateDialog()"
              />
            </div>
          }
        </div>

        <!-- Table -->
        <p-table
          data-testid="iam-user-table"
          [value]="users()"
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
              <th>{{ 'admin.users.table.displayName' | translate }}</th>
              <th>{{ 'admin.users.table.email' | translate }}</th>
              <th>{{ 'admin.users.table.status' | translate }}</th>
              <th>{{ 'admin.users.table.clearanceLevel' | translate }}</th>
              <th>{{ 'admin.users.table.createdAt' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-user>
            <tr (click)="onRowClick(user)" style="cursor: pointer;">
              <td>{{ user.display_name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  class="status-badge"
                  [class.status-active]="user.status === 'active'"
                  [class.status-inactive]="user.status === 'inactive'"
                  [class.status-locked]="user.status === 'locked'"
                >
                  {{ 'admin.users.status.' + user.status | translate }}
                </span>
              </td>
              <td>{{ user.clearance_level }}</td>
              <td>{{ user.created_at | date: 'short' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" style="text-align: center;">
                {{ 'admin.users.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create User Dialog -->
      <p-dialog
        data-testid="iam-user-create-dialog"
        [header]="'admin.users.createDialog.title' | translate"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        (onHide)="onCancelCreate()"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          @if (createError()) {
            <p-message severity="error" [style]="{ width: '100%' }">
              <span>{{ createError() }}</span>
            </p-message>
          }
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.username' | translate }} *</label>
            <input pInputText data-testid="iam-user-username-input" [(ngModel)]="createForm.username" style="width: 100%;" />
            @if (createForm.username.length > 0 && createForm.username.length < 3) {
              <small class="field-hint">{{
                'admin.users.createDialog.usernameHint' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.password' | translate }} *</label>
            <input
              pInputText
              data-testid="iam-user-password-input"
              [(ngModel)]="createForm.password"
              type="password"
              style="width: 100%;"
            />
            @if (createForm.password.length > 0 && createForm.password.length < 8) {
              <small class="field-hint">{{
                'admin.users.createDialog.passwordHint' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.email' | translate }} *</label>
            <input pInputText data-testid="iam-user-email-input" [(ngModel)]="createForm.email" type="email" style="width: 100%;" />
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.displayName' | translate }} *</label>
            <input pInputText data-testid="iam-user-display-name-input" [(ngModel)]="createForm.display_name" style="width: 100%;" />
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.clearanceLevel' | translate }}</label>
            <p-select
              data-testid="iam-user-clearance-select"
              [(ngModel)]="createForm.clearance_level"
              [options]="clearanceLevelOptions()"
              optionLabel="name"
              optionValue="level"
              [style]="{ width: '100%' }"
              appendTo="body"
            />
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.role' | translate }} *</label>
            <p-select
              data-testid="iam-user-role-select"
              [(ngModel)]="createForm.role_id"
              [options]="roleOptions()"
              optionLabel="name"
              optionValue="id"
              [placeholder]="'admin.users.createDialog.selectRole' | translate"
              [style]="{ width: '100%' }"
              appendTo="body"
              [filter]="true"
              filterBy="name"
            />
          </div>
          <div class="form-field">
            <label>{{ 'admin.users.createDialog.group' | translate }} *</label>
            <p-select
              data-testid="iam-user-section-select"
              [(ngModel)]="createForm.section_id"
              [options]="sectionOptions()"
              optionLabel="name"
              optionValue="id"
              [placeholder]="'admin.users.createDialog.selectGroup' | translate"
              [style]="{ width: '100%' }"
              appendTo="body"
              [filter]="true"
              filterBy="name"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            data-testid="iam-user-cancel-btn"
            [label]="'admin.users.createDialog.cancel' | translate"
            severity="secondary"
            (onClick)="onCancelCreate()"
          />
          <p-button
            data-testid="iam-user-submit-btn"
            [label]="'admin.users.createDialog.save' | translate"
            (onClick)="onCreateUser()"
            [loading]="creating()"
            [disabled]="!isCreateFormValid()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .user-list {
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
      .filter-field label,
      .form-field label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--p-text-color);
      }
      .field-hint {
        color: var(--p-orange-500);
        font-size: 0.8rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .status-active {
        background-color: color-mix(in srgb, var(--p-green-500) 15%, transparent);
        color: var(--p-green-500);
      }
      .status-inactive {
        background-color: color-mix(in srgb, var(--p-surface-500) 15%, transparent);
        color: var(--p-surface-500);
      }
      .status-locked {
        background-color: color-mix(in srgb, var(--p-red-500) 15%, transparent);
        color: var(--p-red-500);
      }
    `,
  ],
})
export class UserListPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly sectionService = inject(SectionService);
  private readonly clearanceLevelService = inject(ClearanceLevelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly users = signal<UserResponse[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);

  // Pagination signals
  readonly limit = signal<number>(50);
  readonly offset = signal<number>(0);
  readonly rowsPerPageOptions = [20, 50, 100];

  // Filter
  filterStatus: 'active' | 'inactive' | 'locked' | null = null;

  // Create dialog
  readonly showCreateDialog = signal<boolean>(false);
  readonly creating = signal<boolean>(false);
  readonly createError = signal<string | null>(null);
  createForm: {
    username: string;
    password: string;
    email: string;
    display_name: string;
    clearance_level: number;
    role_id: string | null;
    section_id: string | null;
  } = {
    username: '',
    password: '',
    email: '',
    display_name: '',
    clearance_level: 0,
    role_id: null,
    section_id: null,
  };

  // Role, section, and clearance level options for create dialog
  readonly roleOptions = signal<RoleResponse[]>([]);
  readonly sectionOptions = signal<SectionResponse[]>([]);
  readonly clearanceLevelOptions = signal<{ level: number; name: string }[]>([]);

  // Status select options
  get statusOptions(): { label: string; value: string }[] {
    return [
      { label: this.translate.instant('admin.users.status.active'), value: 'active' },
      { label: this.translate.instant('admin.users.status.inactive'), value: 'inactive' },
      { label: this.translate.instant('admin.users.status.locked'), value: 'locked' },
    ];
  }

  constructor() {
    effect(() => {
      const orgId = this.activeOrg.activeOrganizationId();
      if (orgId !== null) {
        // Reset state when org changes — the p-table will fire onLazyLoad
        // which calls fetchUsers(). Do NOT call fetchUsers() here directly
        // because it reads offset()/limit() signals, making them tracked
        // dependencies of this effect. That causes a loop: onLazyLoad sets
        // offset → effect re-runs → resets offset to 0 → fetches page 1.
        untracked(() => {
          this.users.set([]);
          this.offset.set(0);
          this.fetchUsers();
        });
      }
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    if (params['limit']) {
      this.limit.set(Number(params['limit']));
    }
    if (params['offset']) {
      this.offset.set(Number(params['offset']));
    }
    if (params['status']) {
      this.filterStatus = params['status'];
    }
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limit();

    this.offset.set(first);
    this.limit.set(rows);
    this.syncQueryParams();
    this.fetchUsers();
  }

  onApplyFilters(): void {
    this.offset.set(0);
    this.syncQueryParams();
    this.fetchUsers();
  }

  onRowClick(user: UserResponse): void {
    this.router.navigate(['/admin/users', user.id]);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchUsers();
  }

  onOpenCreateDialog(): void {
    this.showCreateDialog.set(true);
    this.fetchRolesAndSections();
  }

  onCreateUser(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId || !this.isCreateFormValid()) return;

    this.creating.set(true);
    this.createError.set(null);

    const body: CreateUserRequest = {
      username: this.createForm.username,
      password: this.createForm.password,
      email: this.createForm.email,
      display_name: this.createForm.display_name,
      clearance_level: this.createForm.clearance_level,
      organization_id: orgId,
    };

    const roleId = this.createForm.role_id!;
    const sectionId = this.createForm.section_id!;

    this.userService
      .createUser(body)
      .pipe(
        switchMap((user) => {
          // Chain role assignment and section assignment in parallel
          const assignRole$ = this.roleService.assignRole(roleId, {
            subject_id: user.id,
            scope_type: 'ORGANIZATION',
            scope_id: orgId,
          });
          const assignSection$ = this.sectionService.assignUserToSection(user.id, {
            section_id: sectionId,
          });
          return forkJoin([assignRole$, assignSection$]);
        }),
      )
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateDialog.set(false);
          this.resetCreateForm();
          this.fetchUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.creating.set(false);
          const code = extractErrorCode(err) ?? extractErrorMessage(err, 'USER_CREATION_FAILED');
          const translationKey = `admin.users.keycloakError.${code}`;
          const translated = this.translate.instant(translationKey);
          this.createError.set(
            translated !== translationKey ? translated : extractErrorMessage(err, code),
          );
        },
      });
  }

  isCreateFormValid(): boolean {
    return (
      this.createForm.username.trim().length >= 3 &&
      this.createForm.password.trim().length >= 8 &&
      this.createForm.email.trim().length > 0 &&
      this.createForm.display_name.trim().length > 0 &&
      this.createForm.role_id !== null &&
      this.createForm.section_id !== null
    );
  }

  onCancelCreate(): void {
    this.showCreateDialog.set(false);
    this.resetCreateForm();
  }

  private fetchUsers(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    const params: Record<string, string | number> = {
      limit: this.limit(),
      offset: this.offset(),
      organization_id: orgId,
    };

    if (this.filterStatus) {
      params['status'] = this.filterStatus;
    }

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
      status: this.filterStatus || null,
    };

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

  private resetCreateForm(): void {
    this.createError.set(null);
    this.createForm = {
      username: '',
      password: '',
      email: '',
      display_name: '',
      clearance_level: 0,
      role_id: null,
      section_id: null,
    };
  }

  private fetchRolesAndSections(): void {
    this.roleService.listRoles({ limit: 200, offset: 0 }).subscribe({
      next: (res) => this.roleOptions.set(res.items),
    });
    const orgId = this.activeOrg.activeOrganizationId();
    if (orgId) {
      this.sectionService.listSections(orgId, { limit: 200, offset: 0 }).subscribe({
        next: (res) => this.sectionOptions.set(res.items),
      });
    }
    this.clearanceLevelService.listClearanceLevels().subscribe({
      next: (levels) => this.clearanceLevelOptions.set(levels),
    });
  }

  private readonly handleListError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showRetry,
      forbidden: this.forbidden,
    },
    { i18nPrefix: 'admin.users', translate: this.translate },
  );
}
