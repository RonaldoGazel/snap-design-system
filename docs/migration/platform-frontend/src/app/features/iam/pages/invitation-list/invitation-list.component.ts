import { Component, ChangeDetectionStrategy, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { InvitationService } from '../../services/invitation.service';
import { OrgContextSwitcherComponent } from '../../components/org-context-switcher/org-context-switcher.component';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { InvitationResponse } from '../../models/identity.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';
import { extractErrorMessage } from '../../../../shared/utils/request-state';

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
type TagSeverity = 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger';

const STATUS_SEVERITY: Record<InvitationStatus, TagSeverity> = {
  pending: 'info',
  accepted: 'success',
  expired: 'secondary',
  revoked: 'danger',
};

@Component({
  selector: 'app-invitation-list',
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
    Tag,
    TranslateModule,
    OrgContextSwitcherComponent,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="invitation-list">
        <app-org-context-switcher />

        <h2>{{ 'admin.invitations.title' | translate }}</h2>

        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'admin.invitations.error.retry' | translate"
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
            <label>{{ 'admin.invitations.filter.status' | translate }}</label>
            <p-select
              [(ngModel)]="filterStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'admin.invitations.filter.status' | translate"
              [showClear]="true"
              (ngModelChange)="onApplyFilters()"
            />
          </div>
          @if (activeOrg.canMutate()) {
            <div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-left: auto;">
              <p-button
                [label]="'admin.invitations.create' | translate"
                icon="pi pi-plus"
                (onClick)="showCreateDialog.set(true)"
              />
            </div>
          }
        </div>

        <p-table
          [value]="invitations()"
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
              <th>{{ 'admin.invitations.table.email' | translate }}</th>
              <th>{{ 'admin.invitations.table.status' | translate }}</th>
              <th>{{ 'admin.invitations.table.invitedBy' | translate }}</th>
              <th>{{ 'admin.invitations.table.expiresAt' | translate }}</th>
              <th>{{ 'admin.invitations.table.createdAt' | translate }}</th>
              <th>{{ 'admin.invitations.table.actions' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-inv>
            <tr>
              <td>{{ inv.email }}</td>
              <td>
                <p-tag
                  [value]="'admin.invitations.status.' + inv.status | translate"
                  [severity]="getStatusSeverity(inv.status)"
                />
              </td>
              <td>{{ inv.invited_by_user_id }}</td>
              <td>{{ inv.expires_at | date: 'short' }}</td>
              <td>{{ inv.created_at | date: 'short' }}</td>
              <td>
                @if (activeOrg.canMutate()) {
                  <p-button
                    [label]="'admin.invitations.revoke' | translate"
                    severity="danger"
                    size="small"
                    [outlined]="true"
                    [disabled]="inv.status !== 'pending'"
                    (onClick)="onRevokeClick(inv)"
                  />
                }
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" style="text-align: center;">
                {{ 'admin.invitations.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Invitation Dialog -->
      <p-dialog
        [header]="'admin.invitations.createDialog.title' | translate"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [style]="{ width: '420px' }"
      >
        <div style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;">
          <div class="form-field">
            <label>{{ 'admin.invitations.createDialog.email' | translate }}</label>
            <input pInputText [(ngModel)]="createEmail" type="email" style="width: 100%;" />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            [label]="'admin.invitations.createDialog.cancel' | translate"
            severity="secondary"
            (onClick)="showCreateDialog.set(false)"
          />
          <p-button
            [label]="'admin.invitations.createDialog.save' | translate"
            (onClick)="onCreateInvitation()"
            [loading]="creating()"
          />
        </ng-template>
      </p-dialog>

      <!-- Revoke Confirmation Dialog -->
      <p-dialog
        [header]="'admin.invitations.revokeDialog.title' | translate"
        [(visible)]="showRevokeDialog"
        [modal]="true"
        [style]="{ width: '420px' }"
      >
        <p>{{ 'admin.invitations.revokeDialog.message' | translate }}</p>
        <p style="font-style: italic; color: var(--p-text-muted-color);">
          {{ 'admin.invitations.revokeDialog.auditHint' | translate }}
        </p>
        <ng-template #footer>
          <p-button
            [label]="'admin.invitations.revokeDialog.cancel' | translate"
            severity="secondary"
            (onClick)="showRevokeDialog.set(false)"
          />
          <p-button
            [label]="'admin.invitations.revokeDialog.confirm' | translate"
            severity="danger"
            (onClick)="onConfirmRevoke()"
            [loading]="revoking()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .invitation-list {
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
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
    `,
  ],
})
export class InvitationListPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly invitationService = inject(InvitationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  readonly invitations = signal<InvitationResponse[]>([]);
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

  // Filter
  filterStatus: InvitationStatus | null = null;

  // Create dialog
  readonly showCreateDialog = signal<boolean>(false);
  readonly creating = signal<boolean>(false);
  createEmail = '';

  // Revoke dialog
  readonly showRevokeDialog = signal<boolean>(false);
  readonly revoking = signal<boolean>(false);
  private revokeTargetId: string | null = null;

  get statusOptions(): { label: string; value: string }[] {
    return [
      { label: this.translate.instant('admin.invitations.status.pending'), value: 'pending' },
      { label: this.translate.instant('admin.invitations.status.accepted'), value: 'accepted' },
      { label: this.translate.instant('admin.invitations.status.expired'), value: 'expired' },
      { label: this.translate.instant('admin.invitations.status.revoked'), value: 'revoked' },
    ];
  }

  getStatusSeverity(status: InvitationStatus): TagSeverity {
    return STATUS_SEVERITY[status] ?? 'info';
  }

  constructor() {
    effect(() => {
      const orgId = this.activeOrg.activeOrganizationId();
      if (orgId !== null) {
        untracked(() => {
          this.invitations.set([]);
          this.offset.set(0);
          this.fetchInvitations();
        });
      }
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['limit']) this.limit.set(Number(params['limit']));
    if (params['offset']) this.offset.set(Number(params['offset']));
    if (params['status']) this.filterStatus = params['status'];
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.offset.set(event.first ?? 0);
    this.limit.set(event.rows ?? this.limit());
    this.syncQueryParams();
    this.fetchInvitations();
  }

  onApplyFilters(): void {
    this.offset.set(0);
    this.syncQueryParams();
    this.fetchInvitations();
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchInvitations();
  }

  onCreateInvitation(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId || !this.createEmail.trim()) return;

    this.creating.set(true);
    this.invitationService.createInvitation(orgId, { email: this.createEmail.trim() }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateDialog.set(false);
        this.createEmail = '';
        this.fetchInvitations();
      },
      error: (err: HttpErrorResponse) => {
        this.creating.set(false);
        if (err.status === 422) {
          this.errorMessage.set(
            extractErrorMessage(err, this.translate.instant('admin.invitations.error.validation')),
          );
          this.errorSeverity.set('error');
          this.showRetry.set(false);
        }
      },
    });
  }

  onRevokeClick(invitation: InvitationResponse): void {
    this.revokeTargetId = invitation.id;
    this.showRevokeDialog.set(true);
  }

  onConfirmRevoke(): void {
    if (!this.revokeTargetId) return;

    this.revoking.set(true);
    this.invitationService.revokeInvitation(this.revokeTargetId).subscribe({
      next: () => {
        this.revoking.set(false);
        this.showRevokeDialog.set(false);
        this.revokeTargetId = null;
        this.fetchInvitations();
      },
      error: (err: HttpErrorResponse) => {
        this.revoking.set(false);
        this.showRevokeDialog.set(false);
        this.revokeTargetId = null;
        if (err.status === 422) {
          this.errorMessage.set(
            extractErrorMessage(err, this.translate.instant('admin.invitations.error.validation')),
          );
          this.errorSeverity.set('error');
          this.showRetry.set(false);
        }
      },
    });
  }

  private fetchInvitations(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    const params: Record<string, number | string> = {
      limit: this.limit(),
      offset: this.offset(),
    };
    if (this.filterStatus) params['status'] = this.filterStatus;

    this.invitationService.listInvitations(orgId, params as any).subscribe({
      next: (response) => {
        this.invitations.set(response.items);
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
    { i18nPrefix: 'admin.invitations', translate: this.translate },
  );
}
