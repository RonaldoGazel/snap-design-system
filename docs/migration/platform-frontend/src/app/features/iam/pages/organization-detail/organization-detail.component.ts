import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Checkbox } from 'primeng/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

import { ActiveOrgService } from '../../services/active-org.service';
import { OrganizationService } from '../../services/organization.service';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { UserPickerComponent } from '../../components/user-picker/user-picker.component';
import {
  OrganizationResponse,
  UpdateOrganizationRequest,
  OrgRecoveryRequest,
  OwnershipTransferRequest,
} from '../../models/identity.model';
import {
  RequestState,
  createRequestState,
  executeRequest,
  resetRequestState,
} from '../../../../shared/utils/request-state';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    Message,
    InputTextModule,
    Select,
    Tag,
    Dialog,
    Checkbox,
    TranslateModule,
    ForbiddenViewComponent,
    UserPickerComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else if (notFound()) {
      <div class="organization-detail">
        <p-message severity="error" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
          <span>{{ 'admin.organizations.detail.notFound' | translate }}</span>
        </p-message>
        <p-button
          [label]="'admin.organizations.detail.back' | translate"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onBack()"
        />
      </div>
    } @else {
      <div class="organization-detail">
        <div class="header-row">
          <p-button
            [label]="'admin.organizations.detail.back' | translate"
            icon="pi pi-arrow-left"
            severity="secondary"
            [text]="true"
            (onClick)="onBack()"
          />
          <h2>{{ 'admin.organizations.detail.title' | translate }}</h2>
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
                [label]="'admin.organizations.error.retry' | translate"
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

        @if (org(); as o) {
          @if (!editing()) {
            <!-- Read-only view -->
            <div class="detail-grid">
              <div class="detail-field">
                <label>{{ 'admin.organizations.detail.field.name' | translate }}</label>
                <span>{{ o.name }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.organizations.detail.field.status' | translate }}</label>
                <p-tag
                  [value]="'admin.organizations.status.' + o.status | translate"
                  [severity]="statusSeverity(o.status)"
                />
              </div>
              <div class="detail-field">
                <label>{{ 'admin.organizations.detail.field.createdAt' | translate }}</label>
                <span>{{ o.created_at | date: 'medium' }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.organizations.detail.field.updatedAt' | translate }}</label>
                <span>{{ o.updated_at | date: 'medium' }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="action-row">
              <p-button
                [label]="'admin.organizations.detail.edit' | translate"
                icon="pi pi-pencil"
                (onClick)="onStartEdit()"
              />

              <!-- Org Recovery: visible only to Platform Admin -->
              @if (activeOrg.isPlatformAdmin()) {
                <p-button
                  [label]="'admin.organizations.detail.orgRecovery' | translate"
                  icon="pi pi-shield"
                  severity="warn"
                  (onClick)="onOpenRecoveryDialog()"
                />
              }

              <!-- Transfer Ownership: org-admin only (not platform-admin) -->
              @if (activeOrg.canMutate() && !activeOrg.isPlatformAdmin()) {
                <p-button
                  [label]="'admin.organizations.detail.transferOwnership' | translate"
                  icon="pi pi-users"
                  severity="info"
                  (onClick)="onOpenTransferDialog()"
                />
              }

              <p-button
                [label]="'admin.organizations.detail.delete' | translate"
                icon="pi pi-trash"
                severity="danger"
                [outlined]="true"
                (onClick)="onDelete()"
              />
            </div>
          } @else {
            <!-- Edit form -->
            <div class="edit-form">
              <div class="form-field">
                <label>{{ 'admin.organizations.detail.field.name' | translate }}</label>
                <input pInputText [(ngModel)]="editForm.name" style="width: 100%;" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.organizations.detail.field.status' | translate }}</label>
                <p-select
                  [(ngModel)]="editForm.status"
                  [options]="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              </div>
              <div class="action-row">
                <p-button
                  [label]="'admin.organizations.detail.save' | translate"
                  icon="pi pi-check"
                  (onClick)="onSave()"
                  [loading]="saving()"
                />
                <p-button
                  [label]="'admin.organizations.detail.cancel' | translate"
                  icon="pi pi-times"
                  severity="secondary"
                  (onClick)="onCancelEdit()"
                />
              </div>
            </div>
          }
        }
      </div>

      <!-- Org Recovery Dialog -->
      <p-dialog
        [header]="'admin.organizations.detail.recoveryDialog.title' | translate"
        [(visible)]="showRecoveryDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        (onHide)="onCancelRecovery()"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          <!-- Recovery error -->
          @if (recoveryState().status === 'error') {
            <p-message
              [severity]="recoveryState().retryable ? 'warn' : 'error'"
              [style]="{ width: '100%' }"
            >
              <span>{{ recoveryState().error }}</span>
            </p-message>
          }

          <p
            class="dialog-warning"
            style="background: var(--p-yellow-50); color: var(--p-yellow-900); border: 1px solid var(--p-yellow-200); border-radius: var(--p-border-radius); padding: 0.75rem 1rem; margin: 0; line-height: 1.5;"
          >
            {{ 'admin.organizations.detail.recoveryDialog.warning' | translate }}
          </p>

          <div class="form-field">
            <label>{{ 'admin.organizations.detail.recoveryDialog.targetUser' | translate }}</label>
            <app-user-picker
              [organizationId]="orgId"
              (userSelected)="onRecoveryUserSelected($event)"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            [label]="'admin.organizations.detail.recoveryDialog.cancel' | translate"
            severity="secondary"
            (onClick)="onCancelRecovery()"
          />
          <p-button
            [label]="'admin.organizations.detail.recoveryDialog.confirm' | translate"
            severity="warn"
            (onClick)="onConfirmRecovery()"
            [loading]="recoveryState().status === 'loading'"
            [disabled]="!recoveryTargetUserId()"
          />
        </ng-template>
      </p-dialog>

      <!-- Transfer Ownership Dialog -->
      <p-dialog
        [header]="'admin.organizations.detail.transferDialog.title' | translate"
        [(visible)]="showTransferDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        (onHide)="onCancelTransfer()"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          <!-- Transfer error -->
          @if (transferState().status === 'error') {
            <p-message
              [severity]="transferState().retryable ? 'warn' : 'error'"
              [style]="{ width: '100%' }"
            >
              <span>{{ transferState().error }}</span>
            </p-message>
          }

          <div class="form-field">
            <label>{{ 'admin.organizations.detail.transferDialog.targetUser' | translate }}</label>
            <app-user-picker
              [organizationId]="orgId"
              (userSelected)="onTransferUserSelected($event)"
            />
          </div>

          <div class="form-field" style="flex-direction: row; align-items: center; gap: 0.5rem;">
            <p-checkbox
              [(ngModel)]="transferRevokeCurrent"
              [binary]="true"
              inputId="revokeCurrent"
            />
            <label for="revokeCurrent">
              {{ 'admin.organizations.detail.transferDialog.revokeCheckbox' | translate }}
            </label>
          </div>
        </div>
        <ng-template #footer>
          <p-button
            [label]="'admin.organizations.detail.transferDialog.cancel' | translate"
            severity="secondary"
            (onClick)="onCancelTransfer()"
          />
          <p-button
            [label]="'admin.organizations.detail.transferDialog.confirm' | translate"
            severity="info"
            (onClick)="onConfirmTransfer()"
            [loading]="transferState().status === 'loading'"
            [disabled]="!transferTargetUserId()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .organization-detail {
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
      .dialog-warning {
        font-size: 0.85rem;
        color: var(--p-text-color);
        background: var(--p-yellow-50);
        border: 1px solid var(--p-yellow-200);
        border-radius: 6px;
        padding: 0.75rem;
        margin: 0;
      }
    `,
  ],
})
export class OrganizationDetailPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly orgService = inject(OrganizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly org = signal<OrganizationResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly notFound = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);
  readonly editing = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  // Recovery dialog
  readonly showRecoveryDialog = signal<boolean>(false);
  readonly recoveryState = createRequestState<void>();
  readonly recoveryTargetUserId = signal<string | null>(null);

  // Transfer dialog
  readonly showTransferDialog = signal<boolean>(false);
  readonly transferState = createRequestState<void>();
  readonly transferTargetUserId = signal<string | null>(null);
  transferRevokeCurrent = false;

  // Edit form
  editForm = { name: '', status: 'active' as 'active' | 'inactive' };

  // Status select options
  get statusOptions(): { label: string; value: string }[] {
    return [
      { label: this.translate.instant('admin.organizations.status.active'), value: 'active' },
      { label: this.translate.instant('admin.organizations.status.inactive'), value: 'inactive' },
    ];
  }

  get orgId(): string {
    return this.route.snapshot.params['orgId'];
  }

  ngOnInit(): void {
    this.fetchOrganization();
  }

  onBack(): void {
    this.router.navigate(['/admin/organizations']);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchOrganization();
  }

  onStartEdit(): void {
    const o = this.org();
    if (!o) return;
    this.editForm = { name: o.name, status: o.status };
    this.editing.set(true);
  }

  onCancelEdit(): void {
    this.editing.set(false);
  }

  onSave(): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    const body: UpdateOrganizationRequest = {
      name: this.editForm.name,
      status: this.editForm.status,
    };

    this.orgService.updateOrganization(this.orgId, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.fetchOrganization();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleError(err);
      },
    });
  }

  onDelete(): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.organizations.detail.confirmDelete'),
      message: this.translate.instant('admin.organizations.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.organizations.detail.delete'),
      rejectLabel: this.translate.instant('admin.organizations.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.deleteOrganization(this.orgId).subscribe({
          next: () => this.router.navigate(['/admin/organizations']),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  // --- Recovery Dialog ---

  onOpenRecoveryDialog(): void {
    resetRequestState(this.recoveryState);
    this.recoveryTargetUserId.set(null);
    this.showRecoveryDialog.set(true);
  }

  onRecoveryUserSelected(userId: string): void {
    this.recoveryTargetUserId.set(userId);
  }

  onConfirmRecovery(): void {
    const targetUserId = this.recoveryTargetUserId();
    if (!targetUserId) return;

    const body: OrgRecoveryRequest = { target_user_id: targetUserId };

    executeRequest(this.recoveryState, this.orgService.recoverOrganization(this.orgId, body), {
      onSuccess: () => {
        this.showRecoveryDialog.set(false);
        this.recoveryTargetUserId.set(null);
        this.fetchOrganization();
      },
      onError: (err: HttpErrorResponse) => {
        // 422 saga failure — error is displayed inline via recoveryState
        // Other errors also displayed inline
        if (err.status === 422) {
          // Error message from err.error.detail is already captured by RequestState
        }
      },
    });
  }

  onCancelRecovery(): void {
    this.showRecoveryDialog.set(false);
    this.recoveryTargetUserId.set(null);
    resetRequestState(this.recoveryState);
  }

  // --- Transfer Dialog ---

  onOpenTransferDialog(): void {
    resetRequestState(this.transferState);
    this.transferTargetUserId.set(null);
    this.transferRevokeCurrent = false;
    this.showTransferDialog.set(true);
  }

  onTransferUserSelected(userId: string): void {
    this.transferTargetUserId.set(userId);
  }

  onConfirmTransfer(): void {
    const targetUserId = this.transferTargetUserId();
    if (!targetUserId) return;

    const body: OwnershipTransferRequest = {
      target_user_id: targetUserId,
      revoke_current: this.transferRevokeCurrent,
    };

    executeRequest(this.transferState, this.orgService.transferOwnership(this.orgId, body), {
      onSuccess: () => {
        this.showTransferDialog.set(false);
        this.transferTargetUserId.set(null);
        this.transferRevokeCurrent = false;
        this.fetchOrganization();
      },
      onError: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          // "Only the current Org Owner can transfer ownership" — already captured by RequestState as 'Forbidden'
          // Override with a more specific message
          this.transferState.set({
            status: 'error',
            data: null,
            error: this.translate.instant(
              'admin.organizations.detail.transferDialog.forbiddenMessage',
            ),
            retryable: false,
          });
        }
        // 422 saga failure — error is displayed inline via transferState
      },
    });
  }

  onCancelTransfer(): void {
    this.showTransferDialog.set(false);
    this.transferTargetUserId.set(null);
    this.transferRevokeCurrent = false;
    resetRequestState(this.transferState);
  }

  statusSeverity(status: string): 'success' | 'secondary' {
    return status === 'active' ? 'success' : 'secondary';
  }

  private fetchOrganization(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.orgService.getOrganization(this.orgId).subscribe({
      next: (o) => {
        this.org.set(o);
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
      notFound: this.notFound,
    },
    { i18nPrefix: 'admin.organizations', translate: this.translate },
  );
}
