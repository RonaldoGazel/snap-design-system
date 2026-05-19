import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

import { ActiveOrgService } from '../../services/active-org.service';
import { RoleService } from '../../services/role.service';
import { UserService } from '../../services/user.service';
import { PermissionCatalogService } from '../../services/permission-catalog.service';
import { UserPickerComponent } from '../../components/user-picker/user-picker.component';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import {
  RoleResponse,
  RoleAssignmentResponse,
  PermissionCatalogResponse,
} from '../../models/permission.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';
import { extractErrorMessage } from '../../../../shared/utils/request-state';

interface PermissionEntry {
  resource_type: string;
  action: string;
}

interface ScopeTypeOption {
  label: string;
  value: 'GLOBAL' | 'ORGANIZATION';
}

@Component({
  selector: 'app-role-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    Message,
    InputTextModule,
    SelectModule,
    TableModule,
    Tag,
    Tooltip,
    TranslateModule,
    UserPickerComponent,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else if (notFound()) {
      <div class="role-detail">
        <p-message severity="error" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
          <span>{{ 'admin.roles.detail.notFound' | translate }}</span>
        </p-message>
        <p-button
          [label]="'admin.roles.detail.back' | translate"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onBack()"
        />
      </div>
    } @else {
      <div class="role-detail">
        <div class="header-row">
          <p-button
            [label]="'admin.roles.detail.back' | translate"
            icon="pi pi-arrow-left"
            severity="secondary"
            [text]="true"
            (onClick)="onBack()"
          />
          <h2>{{ 'admin.roles.detail.title' | translate }}</h2>
        </div>

        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ width: '100%', 'margin-bottom': '1rem' }"
          >
            <span>{{ errorMessage() }}</span>
            @if (showReload()) {
              <p-button
                [label]="'admin.roles.detail.reload' | translate"
                severity="secondary"
                size="small"
                [style]="{ 'margin-left': '1rem' }"
                (onClick)="onReload()"
              />
            }
          </p-message>
        }

        @if (loading()) {
          <p>Loading...</p>
        }

        @if (role(); as r) {
          @if (!editing()) {
            <!-- Read-only view -->
            <div class="detail-grid">
              <div class="detail-field">
                <label>{{ 'admin.roles.detail.field.name' | translate }}</label>
                <span>{{ r.name }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.roles.detail.field.type' | translate }}</label>
                <p-tag
                  [value]="'admin.roles.type.' + r.type | translate"
                  [severity]="r.type === 'platform' ? 'info' : 'success'"
                />
              </div>
              <div class="detail-field">
                <label>{{ 'admin.roles.detail.field.version' | translate }}</label>
                <span>{{ r.version }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.roles.detail.field.createdAt' | translate }}</label>
                <span>{{ r.created_at | date: 'medium' }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.roles.detail.field.updatedAt' | translate }}</label>
                <span>{{ r.updated_at | date: 'medium' }}</span>
              </div>
            </div>

            <!-- Permissions section -->
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
              <h3 style="margin: 0;">{{ 'admin.roles.detail.permissions.title' | translate }}</h3>
              <p-button
                icon="pi pi-refresh"
                severity="secondary"
                [text]="true"
                size="small"
                [loading]="catalogRefreshing()"
                (onClick)="onRefreshCatalog()"
                [pTooltip]="'admin.roles.detail.permissions.refreshCatalog' | translate"
              />
            </div>
            @if (catalogFailed()) {
              <p-message
                severity="warn"
                [style]="{ width: '100%', 'margin-bottom': '0.5rem', 'margin-top': '0.5rem' }"
              >
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
            @if (r.permissions.length === 0) {
              <p>{{ 'admin.roles.detail.permissions.empty' | translate }}</p>
            } @else {
              <div class="permissions-list">
                @for (perm of r.permissions; track perm.id) {
                  <div class="permission-chip">
                    <span class="perm-resource">{{ perm.resource_type }}</span>
                    <span class="perm-separator">:</span>
                    <span class="perm-action">{{ perm.action }}</span>
                  </div>
                }
              </div>
            }

            @if (activeOrg.canMutate()) {
              <div class="action-row">
                <p-button
                  [label]="'admin.roles.detail.edit' | translate"
                  icon="pi pi-pencil"
                  (onClick)="onStartEdit()"
                />
                <p-button
                  [label]="'admin.roles.detail.delete' | translate"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="onDelete()"
                />
              </div>
            }
          } @else {
            <!-- Edit form -->
            <div class="edit-form">
              <div class="form-field">
                <label>{{ 'admin.roles.detail.field.name' | translate }}</label>
                <input pInputText [(ngModel)]="editForm.name" style="width: 100%;" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.roles.detail.field.type' | translate }}</label>
                <p-select
                  [options]="editTypeOptions()"
                  [(ngModel)]="editForm.type"
                  optionLabel="label"
                  optionValue="value"
                  [disabled]="!activeOrg.isPlatformAdmin()"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              </div>

              <!-- Permissions editor -->
              <div class="form-field">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <label>{{ 'admin.roles.detail.permissions.title' | translate }}</label>
                  <p-button
                    icon="pi pi-refresh"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    [loading]="catalogRefreshing()"
                    (onClick)="onRefreshCatalog()"
                    [pTooltip]="'admin.roles.detail.permissions.refreshCatalog' | translate"
                  />
                </div>
                @if (catalogFailed()) {
                  <p-message severity="warn" [style]="{ width: '100%', 'margin-bottom': '0.5rem' }">
                    <span>{{
                      'admin.roles.detail.permissions.catalogUnavailable' | translate
                    }}</span>
                    <p-button
                      [label]="'admin.roles.detail.permissions.retryCatalog' | translate"
                      severity="secondary"
                      size="small"
                      [style]="{ 'margin-left': '0.5rem' }"
                      (onClick)="onRefreshCatalog()"
                    />
                  </p-message>
                }
                @for (perm of editForm.permissions; track $index) {
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
                        (onChange)="onEditResourceTypeChange($index)"
                        [style]="{ flex: '1' }"
                        appendTo="body"
                      />
                      <p-select
                        [options]="getActionOptionsForEdit($index)"
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
                      (onClick)="onRemoveEditPermission($index)"
                      [disabled]="editForm.permissions.length <= 1"
                    />
                  </div>
                }
                <p-button
                  [label]="'admin.roles.createDialog.addPermission' | translate"
                  icon="pi pi-plus"
                  severity="secondary"
                  size="small"
                  [text]="true"
                  (onClick)="onAddEditPermission()"
                />
              </div>

              <div class="action-row">
                <p-button
                  [label]="'admin.roles.detail.save' | translate"
                  icon="pi pi-check"
                  (onClick)="onSave()"
                  [loading]="saving()"
                />
                <p-button
                  [label]="'admin.roles.detail.cancel' | translate"
                  icon="pi pi-times"
                  severity="secondary"
                  (onClick)="onCancelEdit()"
                />
              </div>
            </div>
          }

          <!-- Assignment Management Section -->
          <h3 style="margin-top: 2rem;">
            {{ 'admin.roles.detail.assignments.title' | translate }}
          </h3>

          <!-- Assign Role Form -->
          @if (activeOrg.canMutate()) {
            <div class="assign-form">
              <div class="form-field">
                <label>{{ 'admin.roles.detail.assignments.user' | translate }}</label>
                <app-user-picker (userSelected)="onUserSelected($event)" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.roles.detail.assignments.scopeType' | translate }}</label>
                <p-select
                  [options]="scopeTypeOptions()"
                  [(ngModel)]="assignForm.scope_type"
                  optionLabel="label"
                  optionValue="value"
                  [disabled]="isScopeTypeLocked()"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              </div>
              @if (assignForm.scope_type === 'ORGANIZATION') {
                <div class="form-field">
                  <label>{{ 'admin.roles.detail.assignments.scopeId' | translate }}</label>
                  <input
                    pInputText
                    [ngModel]="activeOrg.activeOrganizationId()"
                    [disabled]="true"
                    style="width: 100%;"
                  />
                </div>
              }
              <div class="action-row" style="margin-top: 0.5rem;">
                <p-button
                  [label]="'admin.roles.detail.assignments.assign' | translate"
                  icon="pi pi-plus"
                  (onClick)="onAssignRole()"
                  [loading]="assigning()"
                  [disabled]="!assignForm.subject_id.trim()"
                />
              </div>
            </div>
          }

          <!-- Assignments Table -->
          <p-table
            [value]="assignments()"
            [lazy]="true"
            [totalRecords]="assignmentTotalRecords()"
            [rows]="assignmentLimit()"
            [first]="assignmentOffset()"
            [rowsPerPageOptions]="assignmentRowsPerPageOptions"
            [paginator]="true"
            [loading]="assignmentsLoading()"
            (onLazyLoad)="onAssignmentLazyLoad($event)"
            [style]="{ width: '100%', 'margin-top': '1rem' }"
          >
            <ng-template #header>
              <tr>
                <th>{{ 'admin.roles.detail.assignments.displayName' | translate }}</th>
                <th>{{ 'admin.roles.detail.assignments.email' | translate }}</th>
                <th>{{ 'admin.roles.detail.assignments.scopeType' | translate }}</th>
                <th>{{ 'admin.roles.detail.assignments.scopeId' | translate }}</th>
                <th>{{ 'admin.roles.detail.assignments.createdAt' | translate }}</th>
                @if (activeOrg.canMutate()) {
                  <th>{{ 'admin.roles.detail.assignments.actions' | translate }}</th>
                }
              </tr>
            </ng-template>
            <ng-template #body let-assignment>
              <tr>
                <td>{{ assignment._displayName || assignment.subject_id }}</td>
                <td>{{ assignment._email || '—' }}</td>
                <td>{{ assignment.scope_type }}</td>
                <td>{{ assignment.scope_id ?? '—' }}</td>
                <td>{{ assignment.created_at | date: 'short' }}</td>
                @if (activeOrg.canMutate()) {
                  <td>
                    <p-button
                      [label]="'admin.roles.detail.assignments.revoke' | translate"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [text]="true"
                      (onClick)="onRevokeAssignment(assignment)"
                    />
                  </td>
                }
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td [attr.colspan]="activeOrg.canMutate() ? 6 : 5" style="text-align: center;">
                  {{ 'admin.roles.detail.assignments.empty' | translate }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    }
  `,
  styles: [
    `
      .role-detail {
        padding: 1.5rem;
      }
      .header-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .header-row h2 {
        margin: 0;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.25rem;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        background: var(--p-content-background);
        margin-bottom: 1rem;
      }
      .detail-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .detail-field label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--p-text-muted-color);
      }
      .permissions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .permission-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.35rem 0.75rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 6px;
        background: var(--p-content-background);
        font-size: 0.85rem;
      }
      .perm-resource {
        font-weight: 600;
      }
      .perm-separator {
        color: var(--p-text-muted-color);
      }
      .perm-action {
        color: var(--p-text-muted-color);
      }
      .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 600px;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        background: var(--p-content-background);
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
      .assign-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-width: 500px;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        background: var(--p-content-background);
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class RoleDetailPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly catalogService = inject(PermissionCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // Role state
  readonly role = signal<RoleResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly notFound = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showReload = signal<boolean>(false);
  readonly editing = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  // Permission catalog state
  readonly catalog = signal<PermissionCatalogResponse | null>(null);
  readonly catalogFailed = signal<boolean>(false);
  readonly catalogRefreshing = signal<boolean>(false);

  /** Resource type options derived from catalog.
   *  Platform-scoped permissions are only shown when the role type is 'platform'. */
  getResourceTypeOptions(): string[] {
    const c = this.catalog();
    if (!c) return [];
    const showPlatform = this.editForm.type === 'platform';
    return c.entries
      .filter((e) => showPlatform || e.scope !== 'platform')
      .map((e) => e.resource_type);
  }

  // Edit form
  editForm: { name: string; type: 'platform' | 'service'; permissions: PermissionEntry[] } = {
    name: '',
    type: 'service',
    permissions: [],
  };

  // Edit type options
  readonly editTypeOptions = signal<{ label: string; value: string }[]>([]);

  // Assignment state
  readonly assignments = signal<
    (RoleAssignmentResponse & { _displayName?: string; _email?: string })[]
  >([]);
  readonly assignmentTotalRecords = signal<number>(0);
  readonly assignmentsLoading = signal<boolean>(false);
  readonly assignmentLimit = signal<number>(50);
  readonly assignmentOffset = signal<number>(0);
  readonly assignmentRowsPerPageOptions = [20, 50, 100];

  // Assign form
  assignForm: { subject_id: string; scope_type: 'GLOBAL' | 'ORGANIZATION' } = {
    subject_id: '',
    scope_type: 'ORGANIZATION',
  };
  readonly assigning = signal<boolean>(false);

  /**
   * Scope type options derived from role type and user role.
   * Property 11: role type determines scope. Property 12: user role restricts options.
   */
  readonly scopeTypeOptions = computed<ScopeTypeOption[]>(() => {
    const r = this.role();
    if (!r) return [];

    const isPlatformAdmin = this.activeOrg.isPlatformAdmin();

    // Property 11: platform role → GLOBAL only, service role → ORGANIZATION only
    if (r.type === 'platform') {
      return [{ label: 'GLOBAL', value: 'GLOBAL' as const }];
    }
    if (r.type === 'service') {
      return [{ label: 'ORGANIZATION', value: 'ORGANIZATION' as const }];
    }

    // Fallback (shouldn't happen with typed roles)
    if (!isPlatformAdmin) {
      return [{ label: 'ORGANIZATION', value: 'ORGANIZATION' as const }];
    }
    return [
      { label: 'GLOBAL', value: 'GLOBAL' as const },
      { label: 'ORGANIZATION', value: 'ORGANIZATION' as const },
    ];
  });

  /**
   * Whether scope_type selector is locked (single option).
   * Locked when role type constrains to exactly one scope, or non-admin user.
   */
  readonly isScopeTypeLocked = computed<boolean>(() => {
    return this.scopeTypeOptions().length <= 1;
  });

  private get roleId(): string {
    return this.route.snapshot.params['roleId'];
  }

  ngOnInit(): void {
    this.buildEditTypeOptions();
    this.fetchCatalog();
    this.fetchRole();
    this.fetchAssignments();
  }

  onBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  onReload(): void {
    this.errorMessage.set(null);
    this.showReload.set(false);
    this.fetchRole();
  }

  // --- Edit ---

  onStartEdit(): void {
    const r = this.role();
    if (!r) return;
    this.editForm = {
      name: r.name,
      type: r.type,
      permissions: r.permissions.map((p) => ({
        resource_type: p.resource_type,
        action: p.action,
      })),
    };
    if (this.editForm.permissions.length === 0) {
      this.editForm.permissions = [{ resource_type: '', action: '' }];
    }
    this.editing.set(true);
  }

  onCancelEdit(): void {
    this.editing.set(false);
  }

  onAddEditPermission(): void {
    this.editForm.permissions = [...this.editForm.permissions, { resource_type: '', action: '' }];
  }

  onRemoveEditPermission(index: number): void {
    if (this.editForm.permissions.length <= 1) return;
    this.editForm.permissions = this.editForm.permissions.filter((_, i) => i !== index);
  }

  onSave(): void {
    const r = this.role();
    if (!r) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.showReload.set(false);

    this.roleService
      .updateRole(this.roleId, {
        name: this.editForm.name,
        type: this.editForm.type,
        permissions: this.editForm.permissions
          .filter((p) => p.resource_type.trim() && p.action.trim())
          .map((p) => ({ resource_type: p.resource_type.trim(), action: p.action.trim() })),
        version: r.version,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(false);
          this.fetchRole();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === 409) {
            this.errorMessage.set(this.translate.instant('admin.roles.detail.error.conflict'));
            this.errorSeverity.set('warn');
            this.showReload.set(true);
            return;
          }
          this.handleError(err);
        },
      });
  }

  // --- Delete ---

  onDelete(): void {
    const r = this.role();
    if (!r) return;

    this.confirmationService.confirm({
      header: this.translate.instant('admin.roles.detail.confirmDelete'),
      message: this.translate.instant('admin.roles.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.roles.detail.delete'),
      rejectLabel: this.translate.instant('admin.roles.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.roleService.deleteRole(this.roleId, r.version).subscribe({
          next: () => this.router.navigate(['/admin/roles']),
          error: (err: HttpErrorResponse) => {
            if (err.status === 409) {
              this.errorMessage.set(
                this.translate.instant('admin.roles.detail.error.activeAssignments'),
              );
              this.errorSeverity.set('warn');
              this.showReload.set(false);
              return;
            }
            this.handleError(err);
          },
        });
      },
    });
  }

  // --- Assignments ---

  onAssignmentLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.assignmentLimit();

    this.assignmentOffset.set(first);
    this.assignmentLimit.set(rows);
    this.fetchAssignments();
  }

  onAssignRole(): void {
    const subjectId = this.assignForm.subject_id.trim();
    if (!subjectId) return;

    this.assigning.set(true);
    this.errorMessage.set(null);
    this.showReload.set(false);

    // Property 13: GLOBAL → null scope_id, ORG → non-null scope_id
    // Property 28: ORG scope_id auto-filled from activeOrganizationId, read-only
    const scopeType = this.assignForm.scope_type;
    const scopeId = scopeType === 'GLOBAL' ? null : this.activeOrg.activeOrganizationId();

    this.roleService
      .assignRole(this.roleId, {
        subject_id: subjectId,
        scope_type: scopeType,
        scope_id: scopeId,
      })
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.assignForm = { subject_id: '', scope_type: this.getDefaultScopeType() };
          this.fetchAssignments();
        },
        error: (err: HttpErrorResponse) => {
          this.assigning.set(false);
          if (err.status === 403) {
            this.errorMessage.set(
              this.translate.instant('admin.roles.detail.error.globalForbidden'),
            );
            this.errorSeverity.set('error');
            this.showReload.set(false);
            return;
          }
          if (err.status === 409) {
            this.errorMessage.set(
              this.translate.instant('admin.roles.detail.error.duplicateAssignment'),
            );
            this.errorSeverity.set('warn');
            this.showReload.set(false);
            return;
          }
          if (err.status === 422) {
            const message = extractErrorMessage(err, 'admin.roles.error.badRequest');
            this.errorMessage.set(message);
            this.errorSeverity.set('error');
            this.showReload.set(false);
            return;
          }
          this.handleError(err);
        },
      });
  }

  onRevokeAssignment(assignment: RoleAssignmentResponse): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.roles.detail.assignments.confirmRevoke'),
      message: this.translate.instant('admin.roles.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.roles.detail.assignments.revoke'),
      rejectLabel: this.translate.instant('admin.roles.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.roleService.revokeAssignment(this.roleId, assignment.subject_id).subscribe({
          next: () => this.fetchAssignments(),
          error: (err: HttpErrorResponse) => {
            if (err.status === 409) {
              const detail = err.error?.detail || err.error?.message;
              this.errorMessage.set(
                detail || this.translate.instant('admin.roles.detail.error.lastOwner'),
              );
              this.errorSeverity.set('warn');
              this.showReload.set(false);
              return;
            }
            this.handleError(err);
          },
        });
      },
    });
  }

  // --- Catalog ---

  onRefreshCatalog(): void {
    this.catalogRefreshing.set(true);
    this.catalogService.refreshCatalog().subscribe({
      next: (c) => {
        this.catalog.set(c);
        this.catalogFailed.set(false);
        this.catalogRefreshing.set(false);
      },
      error: () => {
        this.catalogFailed.set(true);
        this.catalogRefreshing.set(false);
      },
    });
  }

  onEditResourceTypeChange(index: number): void {
    const perm = this.editForm.permissions[index];
    const c = this.catalog();
    if (!c || !perm) return;
    const entry = c.entries.find((e) => e.resource_type === perm.resource_type);
    if (!entry || !entry.actions.includes(perm.action)) {
      perm.action = '';
    }
  }

  getActionOptionsForEdit(index: number): string[] {
    const perm = this.editForm.permissions[index];
    if (!perm?.resource_type) return [];
    const c = this.catalog();
    if (!c) return [];
    return c.entries.find((e) => e.resource_type === perm.resource_type)?.actions ?? [];
  }

  // --- UserPicker ---

  onUserSelected(userId: string): void {
    this.assignForm.subject_id = userId;
  }

  // --- Private ---

  private fetchRole(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.showReload.set(false);

    this.roleService.getRole(this.roleId).subscribe({
      next: (r) => {
        this.role.set(r);
        this.loading.set(false);
        // Update assign form scope_type default based on role type
        this.assignForm.scope_type = this.getDefaultScopeType();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      },
    });
  }

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

  private fetchAssignments(): void {
    this.assignmentsLoading.set(true);

    this.roleService
      .listAssignments(this.roleId, {
        limit: this.assignmentLimit(),
        offset: this.assignmentOffset(),
      })
      .subscribe({
        next: (response) => {
          const enriched = response.items.map((a) => ({
            ...a,
            _displayName: undefined as string | undefined,
            _email: undefined as string | undefined,
          }));
          this.assignments.set(enriched);
          this.assignmentTotalRecords.set(response.total_count);
          this.assignmentsLoading.set(false);

          // Resolve user names in background
          for (let i = 0; i < enriched.length; i++) {
            const assignment = enriched[i];
            this.userService.getUser(assignment.subject_id).subscribe({
              next: (user) => {
                const current = this.assignments();
                const updated = current.map((a) =>
                  a.id === assignment.id
                    ? { ...a, _displayName: user.display_name, _email: user.email }
                    : a,
                );
                this.assignments.set(updated);
              },
              error: () => {
                // Keep subject_id as fallback
              },
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.assignmentsLoading.set(false);
          this.handleError(err);
        },
      });
  }

  /**
   * Get default scope_type based on role type (Property 11).
   * platform → GLOBAL, service → ORG
   */
  private getDefaultScopeType(): 'GLOBAL' | 'ORGANIZATION' {
    const r = this.role();
    if (!r) return 'ORGANIZATION';
    return r.type === 'platform' ? 'GLOBAL' : 'ORGANIZATION';
  }

  private readonly handleError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showReload,
      forbidden: this.forbidden,
      notFound: this.notFound,
    },
    { i18nPrefix: 'admin.roles', translate: this.translate },
  );

  private buildEditTypeOptions(): void {
    const options: { label: string; value: string }[] = [];

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

    this.editTypeOptions.set(options);
  }
}
