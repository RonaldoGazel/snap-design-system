import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

import { ActiveOrgService } from '../../services/active-org.service';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { EffectivePermissionsService } from '../../services/effective-permissions.service';
import { SectionService } from '../../services/section.service';
import { ClearanceLevelService } from '../../services/clearance-level.service';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import {
  UserResponse,
  UpdateUserRequest,
  ClearanceLevelResponse,
  SectionResponse,
} from '../../models/identity.model';
import { EffectivePermissionsResponse } from '../../models/permission.model';
import {
  createRequestState,
  executeRequest,
  isLoading,
} from '../../../../shared/utils/request-state';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    Message,
    InputTextModule,
    Select,
    Tag,
    Dialog,
    TranslateModule,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else if (notFound()) {
      <div class="user-detail">
        <p-message severity="error" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
          <span>{{ 'admin.users.detail.notFound' | translate }}</span>
        </p-message>
        <p-button
          [label]="'admin.users.detail.back' | translate"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onBack()"
        />
      </div>
    } @else {
      <div class="user-detail">
        <div class="header-row">
          <p-button
            [label]="'admin.users.detail.back' | translate"
            icon="pi pi-arrow-left"
            severity="secondary"
            [text]="true"
            (onClick)="onBack()"
          />
          <h2>{{ 'admin.users.detail.title' | translate }}</h2>
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ width: '100%', 'margin-bottom': '1rem' }"
          >
            <span>{{ errorMessage() }}</span>
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

        @if (loading()) {
          <p>Loading...</p>
        }

        @if (user(); as u) {
          <!-- Business rule messages -->
          @if (u.organization_id === null) {
            <p-message severity="info" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
              <span>{{ 'admin.users.detail.noOrg' | translate }}</span>
            </p-message>
          }
          <!-- TODO: Wire ADM-045 message when role assignment data is available from permission-service -->

          @if (!editing()) {
            <!-- Read-only view -->
            <div class="detail-grid">
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.displayName' | translate }}</label>
                <span>{{ u.display_name }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.email' | translate }}</label>
                <span>{{ u.email }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.status' | translate }}</label>
                <p-tag
                  [value]="'admin.users.status.' + u.status | translate"
                  [severity]="statusSeverity(u.status)"
                />
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.clearanceLevel' | translate }}</label>
                <span>{{ u.clearance_level }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.externalAuthId' | translate }}</label>
                <span>{{ u.external_auth_id }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.organizationId' | translate }}</label>
                <span>{{ u.organization_id ?? '—' }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.identityVersion' | translate }}</label>
                <span>{{ u.identity_version }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.createdAt' | translate }}</label>
                <span>{{ u.created_at | date: 'medium' }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.users.detail.field.updatedAt' | translate }}</label>
                <span>{{ u.updated_at | date: 'medium' }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            @if (activeOrg.canMutate()) {
              <div class="action-row">
                <p-button
                  [label]="'admin.users.detail.edit' | translate"
                  icon="pi pi-pencil"
                  data-testid="iam-user-edit-btn"
                  (onClick)="onStartEdit()"
                />
                <p-button
                  [label]="'admin.users.detail.resetPassword.button' | translate"
                  icon="pi pi-key"
                  severity="help"
                  data-testid="iam-user-reset-password-btn"
                  (onClick)="onOpenResetPassword()"
                />

                <!-- Lifecycle buttons -->
                @if (u.status === 'active') {
                  <p-button
                    [label]="'admin.users.detail.deactivate' | translate"
                    icon="pi pi-ban"
                    severity="warn"
                    data-testid="iam-user-deactivate-btn"
                    (onClick)="onDeactivate()"
                  />
                  <p-button
                    [label]="'admin.users.detail.lock' | translate"
                    icon="pi pi-lock"
                    severity="danger"
                    data-testid="iam-user-lock-btn"
                    (onClick)="onLock()"
                  />
                }
                @if (u.status === 'locked') {
                  <p-button
                    [label]="'admin.users.detail.unlock' | translate"
                    icon="pi pi-unlock"
                    severity="success"
                    data-testid="iam-user-unlock-btn"
                    (onClick)="onUnlock()"
                  />
                }
                @if (u.status === 'inactive') {
                  <p-button
                    [label]="'admin.users.detail.reactivate' | translate"
                    icon="pi pi-replay"
                    severity="success"
                    data-testid="iam-user-reactivate-btn"
                    (onClick)="onReactivate()"
                  />
                }

                <p-button
                  [label]="'admin.users.detail.delete' | translate"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  data-testid="iam-user-delete-btn"
                  (onClick)="onDelete()"
                />
              </div>
            }

            <!-- Section Memberships (ADR-005) -->
            <h3 style="margin-top: 2rem;">
              {{ 'admin.users.detail.sections.title' | translate }}
            </h3>

            @if (sectionsLoading()) {
              <p>{{ 'admin.users.detail.sections.loading' | translate }}</p>
            } @else if (userSections().length === 0) {
              <p>{{ 'admin.users.detail.sections.empty' | translate }}</p>
            } @else {
              <div class="permissions-list">
                @for (section of userSections(); track section.id) {
                  <a
                    class="permission-chip"
                    [routerLink]="['/admin/groups', section.id]"
                    style="text-decoration: none; cursor: pointer;"
                  >
                    <span class="perm-resource">{{ section.name }}</span>
                  </a>
                }
              </div>
            }

            <!-- Effective Permissions Section (Task 7.4) -->
            <h3 style="margin-top: 2rem;">
              {{ 'admin.users.detail.effectivePermissions.title' | translate }}
            </h3>

            @if (effectivePermissionsState().status === 'loading') {
              <p>{{ 'admin.users.detail.effectivePermissions.loading' | translate }}</p>
            }

            @if (effectivePermissionsState().status === 'error') {
              <p-message severity="info" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
                <span>{{ 'admin.users.detail.effectivePermissions.unavailable' | translate }}</span>
              </p-message>
            }

            @if (effectivePermissionsState().data; as epData) {
              @if (epData.permissions.length === 0) {
                <p>{{ 'admin.users.detail.effectivePermissions.empty' | translate }}</p>
              } @else {
                <div class="permissions-list">
                  @for (perm of epData.permissions; track perm.resource_type + ':' + perm.action) {
                    <div class="permission-chip">
                      <span class="perm-resource">{{ perm.resource_type }}</span>
                      <span class="perm-separator">:</span>
                      <span class="perm-action">{{ perm.action }}</span>
                    </div>
                  }
                </div>
              }

              <div class="action-row" style="margin-top: 0.5rem;">
                <p-button
                  [label]="
                    showTrace()
                      ? ('admin.users.detail.effectivePermissions.hideTrace' | translate)
                      : ('admin.users.detail.effectivePermissions.showTrace' | translate)
                  "
                  icon="pi pi-search"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  [loading]="traceLoading()"
                  (onClick)="onToggleTrace()"
                />
              </div>

              @if (showTrace() && epData.evaluation_trace) {
                <div class="trace-section">
                  <h4>{{ 'admin.users.detail.effectivePermissions.traceTitle' | translate }}</h4>
                  <div class="trace-list">
                    @for (entry of epData.evaluation_trace; track $index) {
                      <div class="trace-entry">
                        <span class="perm-resource">{{ entry.resource_type }}</span>
                        <span class="perm-separator">:</span>
                        <span class="perm-action">{{ entry.action }}</span>
                        <span class="trace-source">
                          ← {{ entry.source_type }}: {{ entry.source_name }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          } @else {
            <!-- Edit form -->
            <div class="edit-form">
              <div class="form-field">
                <label>{{ 'admin.users.detail.field.email' | translate }}</label>
                <input pInputText [(ngModel)]="editForm.email" data-testid="iam-user-edit-email-input" style="width: 100%;" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.users.detail.field.displayName' | translate }}</label>
                <input pInputText [(ngModel)]="editForm.display_name" data-testid="iam-user-edit-display-name-input" style="width: 100%;" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.users.detail.field.clearanceLevel' | translate }}</label>
                <p-select
                  [(ngModel)]="editForm.clearance_level"
                  [options]="clearanceLevels()"
                  optionLabel="name"
                  optionValue="level"
                  data-testid="iam-user-edit-clearance-select"
                  [style]="{ width: '100%' }"
                />
              </div>
              <div class="action-row">
                <p-button
                  [label]="'admin.users.detail.save' | translate"
                  icon="pi pi-check"
                  data-testid="iam-user-save-btn"
                  (onClick)="onSave()"
                  [loading]="saving()"
                />
                <p-button
                  [label]="'admin.users.detail.cancel' | translate"
                  icon="pi pi-times"
                  severity="secondary"
                  data-testid="iam-user-edit-cancel-btn"
                  (onClick)="onCancelEdit()"
                />
              </div>
            </div>
          }
        }
      </div>

      <!-- Reset Password Dialog (Task 7.1) -->
      <p-dialog
        [header]="'admin.users.detail.resetPassword.title' | translate"
        [(visible)]="showResetPasswordDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        (onHide)="onResetPasswordDialogHide()"
      >
        <div class="form-field" style="margin-bottom: 1rem;">
          <label>{{ 'admin.users.detail.resetPassword.password' | translate }}</label>
          <input
            pInputText
            type="password"
            [(ngModel)]="resetPasswordForm.temporary_password"
            style="width: 100%;"
          />
        </div>
        <p class="audit-hint">
          {{ 'admin.users.detail.resetPassword.auditHint' | translate }}
        </p>
        @if (resetPasswordState().status === 'error') {
          <p-message severity="error" [style]="{ width: '100%', 'margin-bottom': '0.5rem' }">
            <span>{{ resetPasswordState().error }}</span>
          </p-message>
        }
        @if (resetPasswordState().status === 'success') {
          <p-message severity="success" [style]="{ width: '100%', 'margin-bottom': '0.5rem' }">
            <span>{{ 'admin.users.detail.resetPassword.success' | translate }}</span>
          </p-message>
        }
        <ng-template #footer>
          <p-button
            [label]="'admin.users.detail.cancel' | translate"
            severity="secondary"
            (onClick)="showResetPasswordDialog.set(false)"
          />
          <p-button
            [label]="'admin.users.detail.resetPassword.confirm' | translate"
            icon="pi pi-check"
            [loading]="resetPasswordLoading()"
            [disabled]="!resetPasswordForm.temporary_password.trim()"
            (onClick)="onConfirmResetPassword()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .user-detail {
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
        max-width: 500px;
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
      .audit-hint {
        font-size: 0.85rem;
        color: var(--p-text-muted-color);
        font-style: italic;
        margin-bottom: 0.5rem;
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
      .trace-section {
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        background: var(--p-content-background);
      }
      .trace-section h4 {
        margin: 0 0 0.75rem 0;
      }
      .trace-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .trace-entry {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.85rem;
      }
      .trace-source {
        color: var(--p-text-muted-color);
        margin-left: 0.5rem;
        font-style: italic;
      }
    `,
  ],
})
export class UserDetailPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly effectivePermissionsService = inject(EffectivePermissionsService);
  private readonly sectionService = inject(SectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly clearanceLevelService = inject(ClearanceLevelService);

  // State signals
  readonly user = signal<UserResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly notFound = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);
  readonly editing = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  // Clearance levels for dropdown
  readonly clearanceLevels = signal<ClearanceLevelResponse[]>([]);

  // Task 7.1: Reset Password state
  readonly resetPasswordState = createRequestState<void>();
  readonly showResetPasswordDialog = signal<boolean>(false);
  readonly resetPasswordLoading = isLoading(this.resetPasswordState);
  resetPasswordForm = { temporary_password: '' };

  // Task 7.4: Effective Permissions state
  readonly effectivePermissionsState = createRequestState<EffectivePermissionsResponse>();
  readonly showTrace = signal<boolean>(false);
  readonly traceLoading = signal<boolean>(false);

  // Section memberships (ADR-005)
  readonly userSections = signal<SectionResponse[]>([]);
  readonly sectionsLoading = signal<boolean>(false);

  // Edit form
  editForm = { email: '', display_name: '', clearance_level: 0 };

  private get userId(): string {
    return this.route.snapshot.params['userId'];
  }

  ngOnInit(): void {
    this.fetchUser();
    this.fetchClearanceLevels();
  }

  onBack(): void {
    this.router.navigate(['/admin/users']);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchUser();
  }

  onStartEdit(): void {
    const u = this.user();
    if (!u) return;
    this.editForm = {
      email: u.email,
      display_name: u.display_name,
      clearance_level: u.clearance_level,
    };
    this.editing.set(true);
  }

  onCancelEdit(): void {
    this.editing.set(false);
  }

  onSave(): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    const body: UpdateUserRequest = {
      email: this.editForm.email,
      display_name: this.editForm.display_name,
      clearance_level: this.editForm.clearance_level,
    };

    this.userService.updateUser(this.userId, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.fetchUser();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleError(err);
      },
    });
  }

  // --- Task 7.1: Reset Password ---

  onOpenResetPassword(): void {
    this.resetPasswordForm = { temporary_password: '' };
    this.resetPasswordState.set({
      status: 'idle',
      data: null,
      error: null,
      retryable: false,
    });
    this.showResetPasswordDialog.set(true);
  }

  onConfirmResetPassword(): void {
    const u = this.user();
    if (!u) return;

    executeRequest(
      this.resetPasswordState,
      this.userService.resetPassword(u.id, {
        temporary_password: this.resetPasswordForm.temporary_password,
      }),
      {
        onSuccess: () => {
          // Keep dialog open to show success message; user can close manually
        },
        onError: (err: HttpErrorResponse) => {
          // Error is already classified by executeRequest into resetPasswordState
          // For 404/422, the error detail is displayed via resetPasswordState().error
        },
      },
    );
  }

  onResetPasswordDialogHide(): void {
    this.resetPasswordForm = { temporary_password: '' };
    this.resetPasswordState.set({
      status: 'idle',
      data: null,
      error: null,
      retryable: false,
    });
  }

  // --- Lifecycle actions ---

  onDeactivate(): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.users.detail.confirmDeactivate'),
      message: this.translate.instant('admin.users.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.users.detail.deactivate'),
      rejectLabel: this.translate.instant('admin.users.detail.cancel'),
      acceptButtonStyleClass: 'p-button-warn',
      accept: () => {
        this.userService.deactivateUser(this.userId).subscribe({
          next: () => this.fetchUser(),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  onLock(): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.users.detail.confirmLock'),
      message: this.translate.instant('admin.users.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.users.detail.lock'),
      rejectLabel: this.translate.instant('admin.users.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.lockUser(this.userId).subscribe({
          next: () => this.fetchUser(),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  onUnlock(): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.users.detail.confirmUnlock'),
      message: this.translate.instant('admin.users.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.users.detail.unlock'),
      rejectLabel: this.translate.instant('admin.users.detail.cancel'),
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.userService.unlockUser(this.userId).subscribe({
          next: () => this.fetchUser(),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  onReactivate(): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.users.detail.confirmReactivate'),
      message: this.translate.instant('admin.users.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.users.detail.reactivate'),
      rejectLabel: this.translate.instant('admin.users.detail.cancel'),
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.userService.reactivateUser(this.userId).subscribe({
          next: () => this.fetchUser(),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  // --- Task 7.2: Enhanced delete warning with role/group counts ---

  onDelete(): void {
    const u = this.user();
    if (!u) return;

    // Fetch role/group counts for enhanced delete warning
    this.roleService.getSubjectCounts(u.id).subscribe({
      next: (counts) => {
        let message = this.translate.instant('admin.users.detail.auditHint');
        if (counts.role_count > 0 || counts.group_count > 0) {
          message =
            this.translate.instant('admin.users.detail.deleteWarning', {
              roleCount: counts.role_count,
              groupCount: counts.group_count,
            }) +
            '\n\n' +
            message;
        }
        this.showDeleteConfirmation(message);
      },
      error: () => {
        // Counts unavailable — show standard confirmation
        this.showDeleteConfirmation(this.translate.instant('admin.users.detail.auditHint'));
      },
    });
  }

  private showDeleteConfirmation(message: string): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.users.detail.confirmDelete'),
      message,
      acceptLabel: this.translate.instant('admin.users.detail.delete'),
      rejectLabel: this.translate.instant('admin.users.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(this.userId).subscribe({
          next: () => this.router.navigate(['/admin/users']),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  // --- Task 7.4: Effective Permissions ---

  onToggleTrace(): void {
    const currentTrace = this.showTrace();

    if (!currentTrace) {
      // Turning trace ON — re-fetch with trace=true
      this.showTrace.set(true);
      this.fetchEffectivePermissions(true);
    } else {
      // Turning trace OFF — re-fetch without trace
      this.showTrace.set(false);
      this.fetchEffectivePermissions(false);
    }
  }

  statusSeverity(status: string): 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success';
      case 'locked':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private fetchUser(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.getUser(this.userId).subscribe({
      next: (u) => {
        this.user.set(u);
        this.loading.set(false);
        this.fetchEffectivePermissions(false);
        this.fetchUserSections(u.id);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      },
    });
  }

  private fetchEffectivePermissions(trace: boolean): void {
    const u = this.user();
    if (!u) return;

    if (trace) {
      this.traceLoading.set(true);
    }

    executeRequest(
      this.effectivePermissionsState,
      this.effectivePermissionsService.getEffectivePermissions({ subject_id: u.id }, trace),
      {
        onSuccess: () => {
          this.traceLoading.set(false);
        },
        onError: () => {
          this.traceLoading.set(false);
          // 403/503 are handled gracefully — the section shows "unavailable" message
          // without blocking the rest of the page
        },
      },
    );
  }

  // Centralized error handler — delegates to shared utility
  private readonly handleError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showRetry,
      forbidden: this.forbidden,
      notFound: this.notFound,
    },
    { i18nPrefix: 'admin.users', translate: this.translate },
  );

  private fetchUserSections(userId: string): void {
    this.sectionsLoading.set(true);
    this.sectionService.getUserSections(userId).subscribe({
      next: (res) => {
        this.userSections.set(res.items);
        this.sectionsLoading.set(false);
      },
      error: () => {
        this.sectionsLoading.set(false);
      },
    });
  }

  private fetchClearanceLevels(): void {
    this.clearanceLevelService.listClearanceLevels().subscribe({
      next: (levels) => this.clearanceLevels.set(levels),
      error: () => {
        // Fallback: if we can't fetch levels, leave empty — the select will be empty
      },
    });
  }
}
