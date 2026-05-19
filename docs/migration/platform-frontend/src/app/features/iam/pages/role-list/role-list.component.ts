import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { RoleService } from '../../services/role.service';
import { PermissionCatalogService } from '../../services/permission-catalog.service';
import { OrgContextSwitcherComponent } from '../../components/org-context-switcher/org-context-switcher.component';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { RoleResponse, PermissionCatalogResponse } from '../../models/permission.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

interface PermissionEntry {
  resource_type: string;
  action: string;
}

interface RoleTypeOption {
  label: string;
  value: 'platform' | 'service';
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    ButtonModule,
    Message,
    Dialog,
    InputTextModule,
    SelectModule,
    TranslateModule,
    OrgContextSwitcherComponent,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="role-list">
        <app-org-context-switcher />

        <h2>{{ 'admin.roles.title' | translate }}</h2>

        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'admin.roles.error.retry' | translate"
                severity="secondary"
                size="small"
                [style]="{ 'margin-left': '1rem' }"
                (onClick)="onRetry()"
              />
            }
          </p-message>
        }

        <div
          class="action-bar"
          style="display: flex; justify-content: flex-end; margin-bottom: 1rem;"
        >
          @if (activeOrg.canMutate()) {
            <p-button
              data-testid="iam-role-create-btn"
              [label]="'admin.roles.create' | translate"
              icon="pi pi-plus"
              (onClick)="onOpenCreateDialog()"
            />
          }
        </div>

        <p-table
          data-testid="iam-role-table"
          [value]="roles()"
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
              <th>{{ 'admin.roles.table.name' | translate }}</th>
              <th>{{ 'admin.roles.table.type' | translate }}</th>
              <th>{{ 'admin.roles.table.permissionCount' | translate }}</th>
              <th>{{ 'admin.roles.table.version' | translate }}</th>
              <th>{{ 'admin.roles.table.createdAt' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-role>
            <tr (click)="onRowClick(role)" style="cursor: pointer;">
              <td>{{ role.name }}</td>
              <td>{{ 'admin.roles.type.' + role.type | translate }}</td>
              <td>{{ role.permissions?.length ?? 0 }}</td>
              <td>{{ role.version }}</td>
              <td>{{ role.created_at | date: 'short' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" style="text-align: center;">
                {{ 'admin.roles.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Role Dialog -->
      <p-dialog
        data-testid="iam-role-create-dialog"
        [header]="'admin.roles.createDialog.title' | translate"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [style]="{ width: '550px' }"
        (onHide)="onCancelCreate()"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          <div class="form-field">
            <label>{{ 'admin.roles.createDialog.name' | translate }}</label>
            <input pInputText data-testid="iam-role-name-input" [(ngModel)]="createForm.name" style="width: 100%;" />
          </div>
          <div class="form-field">
            <label>{{ 'admin.roles.createDialog.type' | translate }}</label>
            <p-select
              data-testid="iam-role-type-select"
              [options]="roleTypeOptions()"
              [(ngModel)]="createForm.type"
              optionLabel="label"
              optionValue="value"
              [disabled]="!activeOrg.isPlatformAdmin()"
              [style]="{ width: '100%' }"
              appendTo="body"
              (onChange)="onCreateRoleTypeChange()"
            />
          </div>

          <!-- Permissions -->
          <div class="form-field">
            <label>{{ 'admin.roles.createDialog.permissions' | translate }}</label>
            @if (catalogFailed()) {
              <p-message severity="warn" [style]="{ width: '100%', 'margin-bottom': '0.5rem' }">
                <span>{{ 'admin.roles.detail.permissions.catalogUnavailable' | translate }}</span>
                <p-button
                  [label]="'admin.roles.detail.permissions.retryCatalog' | translate"
                  severity="secondary"
                  size="small"
                  [style]="{ 'margin-left': '0.5rem' }"
                  (onClick)="onRefreshCatalog()"
                />
              </p-message>
            }
            @for (perm of createForm.permissions; track $index) {
              <div class="permission-row">
                @if (catalogFailed()) {
                  <input
                    pInputText
                    [(ngModel)]="perm.resource_type"
                    [placeholder]="'admin.roles.createDialog.resourceType' | translate"
                    style="flex: 1;"
                  />
                  <input
                    pInputText
                    [(ngModel)]="perm.action"
                    [placeholder]="'admin.roles.createDialog.action' | translate"
                    style="flex: 1;"
                  />
                } @else {
                  <p-select
                    [options]="getResourceTypeOptions()"
                    [(ngModel)]="perm.resource_type"
                    [placeholder]="'admin.roles.createDialog.resourceType' | translate"
                    (onChange)="onCreateResourceTypeChange($index)"
                    [style]="{ flex: '1' }"
                    appendTo="body"
                  />
                  <p-select
                    [options]="getActionOptionsForCreate($index)"
                    [(ngModel)]="perm.action"
                    [placeholder]="'admin.roles.createDialog.action' | translate"
                    [disabled]="!perm.resource_type"
                    [style]="{ flex: '1' }"
                    appendTo="body"
                  />
                }
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  size="small"
                  (onClick)="onRemovePermission($index)"
                  [disabled]="createForm.permissions.length <= 1"
                />
              </div>
            }
            <p-button
              [label]="'admin.roles.createDialog.addPermission' | translate"
              icon="pi pi-plus"
              severity="secondary"
              size="small"
              [text]="true"
              (onClick)="onAddPermission()"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            data-testid="iam-role-cancel-btn"
            [label]="'admin.roles.createDialog.cancel' | translate"
            severity="secondary"
            (onClick)="onCancelCreate()"
          />
          <p-button
            data-testid="iam-role-submit-btn"
            [label]="'admin.roles.createDialog.save' | translate"
            (onClick)="onCreateRole()"
            [loading]="creating()"
            [disabled]="!isCreateFormValid()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .role-list {
        padding: 1.5rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .form-field label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--p-text-color);
      }
      .permission-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class RoleListPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly roleService = inject(RoleService);
  private readonly catalogService = inject(PermissionCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly roles = signal<RoleResponse[]>([]);
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

  // Create dialog
  readonly showCreateDialog = signal<boolean>(false);
  readonly creating = signal<boolean>(false);
  createForm: { name: string; type: 'platform' | 'service'; permissions: PermissionEntry[] } = {
    name: '',
    type: 'service',
    permissions: [{ resource_type: '', action: '' }],
  };

  readonly roleTypeOptions = signal<RoleTypeOption[]>([]);

  // Permission catalog state
  readonly catalog = signal<PermissionCatalogResponse | null>(null);
  readonly catalogFailed = signal<boolean>(false);

  /** Resource type options derived from catalog.
   *  Platform-scoped permissions are only shown when the role type is 'platform'. */
  getResourceTypeOptions(): string[] {
    const c = this.catalog();
    if (!c) return [];
    const showPlatform = this.createForm.type === 'platform';
    return c.entries
      .filter((e) => showPlatform || e.scope !== 'platform')
      .map((e) => e.resource_type);
  }

  constructor() {
    effect(() => {
      const orgId = this.activeOrg.activeOrganizationId();
      if (orgId !== null) {
        untracked(() => {
          this.roles.set([]);
          this.offset.set(0);
          this.fetchRoles();
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

    this.buildRoleTypeOptions();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limit();

    this.offset.set(first);
    this.limit.set(rows);
    this.syncQueryParams();
    this.fetchRoles();
  }

  onRowClick(role: RoleResponse): void {
    this.router.navigate(['/admin/roles', role.id]);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchRoles();
  }

  onAddPermission(): void {
    this.createForm.permissions = [
      ...this.createForm.permissions,
      { resource_type: '', action: '' },
    ];
  }

  onRemovePermission(index: number): void {
    if (this.createForm.permissions.length <= 1) return;
    this.createForm.permissions = this.createForm.permissions.filter((_, i) => i !== index);
  }

  onOpenCreateDialog(): void {
    this.fetchCatalog();
    this.showCreateDialog.set(true);
  }

  onRefreshCatalog(): void {
    this.catalogService.refreshCatalog().subscribe({
      next: (c) => {
        this.catalog.set(c);
        this.catalogFailed.set(false);
      },
      error: () => {
        this.catalogFailed.set(true);
      },
    });
  }

  onCreateRoleTypeChange(): void {
    // When switching from platform to service, clear any platform-scoped
    // permissions that are no longer valid for the selected role type.
    if (this.createForm.type === 'service') {
      const c = this.catalog();
      if (!c) return;
      const platformTypes = new Set(
        c.entries.filter((e) => e.scope === 'platform').map((e) => e.resource_type),
      );
      for (const perm of this.createForm.permissions) {
        if (platformTypes.has(perm.resource_type)) {
          perm.resource_type = '';
          perm.action = '';
        }
      }
    }
  }

  onCreateResourceTypeChange(index: number): void {
    const perm = this.createForm.permissions[index];
    const c = this.catalog();
    if (!c || !perm) return;
    const entry = c.entries.find((e) => e.resource_type === perm.resource_type);
    if (!entry || !entry.actions.includes(perm.action)) {
      perm.action = '';
    }
  }

  getActionOptionsForCreate(index: number): string[] {
    const perm = this.createForm.permissions[index];
    if (!perm?.resource_type) return [];
    const c = this.catalog();
    if (!c) return [];
    return c.entries.find((e) => e.resource_type === perm.resource_type)?.actions ?? [];
  }

  isCreateFormValid(): boolean {
    if (!this.createForm.name.trim()) return false;
    if (this.createForm.permissions.length === 0) return false;
    return this.createForm.permissions.every(
      (p) => p.resource_type.trim() !== '' && p.action.trim() !== '',
    );
  }

  onCreateRole(): void {
    if (!this.isCreateFormValid()) return;

    this.creating.set(true);
    this.errorMessage.set(null);

    this.roleService
      .createRole({
        name: this.createForm.name.trim(),
        type: this.createForm.type,
        permissions: this.createForm.permissions.map((p) => ({
          resource_type: p.resource_type.trim(),
          action: p.action.trim(),
        })),
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateDialog.set(false);
          this.resetCreateForm();
          this.fetchRoles();
        },
        error: (err: HttpErrorResponse) => {
          this.creating.set(false);
          this.handleError(err);
        },
      });
  }

  onCancelCreate(): void {
    this.showCreateDialog.set(false);
    this.resetCreateForm();
  }

  private fetchRoles(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    this.roleService.listRoles({ limit: this.limit(), offset: this.offset() }).subscribe({
      next: (response) => {
        // Filter out platform-admin role for non-platform-admin users
        const isPlatformAdmin = this.activeOrg.isPlatformAdmin();
        const filtered = isPlatformAdmin
          ? response.items
          : response.items.filter((r) => r.type !== 'platform');
        this.roles.set(filtered);
        this.totalRecords.set(isPlatformAdmin ? response.total_count : filtered.length);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      },
    });
  }

  private readonly handleError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showRetry,
      forbidden: this.forbidden,
    },
    { i18nPrefix: 'admin.roles', translate: this.translate },
  );

  private fetchCatalog(): void {
    this.catalogService.getCatalog().subscribe({
      next: (c) => {
        this.catalog.set(c);
        this.catalogFailed.set(false);
      },
      error: () => {
        this.catalogFailed.set(true);
      },
    });
  }

  private syncQueryParams(): void {
    const queryParams: Record<string, string> = {
      limit: String(this.limit()),
      offset: String(this.offset()),
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  private resetCreateForm(): void {
    this.createForm = {
      name: '',
      type: this.activeOrg.isPlatformAdmin() ? 'service' : 'service',
      permissions: [{ resource_type: '', action: '' }],
    };
  }

  private buildRoleTypeOptions(): void {
    const options: RoleTypeOption[] = [];

    if (this.activeOrg.isPlatformAdmin()) {
      options.push({
        label: this.translate.instant('admin.roles.type.platform') as string,
        value: 'platform',
      });
    }

    options.push({
      label: this.translate.instant('admin.roles.type.service') as string,
      value: 'service',
    });

    this.roleTypeOptions.set(options);
  }
}
