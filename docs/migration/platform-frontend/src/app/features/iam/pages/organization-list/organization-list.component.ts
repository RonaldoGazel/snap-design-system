import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { OrganizationService } from '../../services/organization.service';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { OrganizationResponse, BootstrapOrganizationRequest } from '../../models/identity.model';
import {
  RequestState,
  createRequestState,
  executeRequest,
  resetRequestState,
} from '../../../../shared/utils/request-state';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

@Component({
  selector: 'app-organization-list',
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
    Tag,
    TranslateModule,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="organization-list">
        <h2>{{ 'admin.organizations.title' | translate }}</h2>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
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

        <!-- Action bar -->
        <div
          class="action-bar"
          style="display: flex; justify-content: flex-end; margin-bottom: 1rem;"
        >
          <p-button
            [label]="'admin.organizations.create' | translate"
            icon="pi pi-plus"
            data-testid="iam-org-create-btn"
            (onClick)="onOpenBootstrapDialog()"
          />
        </div>

        <!-- Table -->
        <p-table
          [value]="organizations()"
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
          data-testid="iam-org-table"
        >
          <ng-template #header>
            <tr>
              <th>{{ 'admin.organizations.table.name' | translate }}</th>
              <th>{{ 'admin.organizations.table.status' | translate }}</th>
              <th>{{ 'admin.organizations.table.createdAt' | translate }}</th>
              <th>{{ 'admin.organizations.table.updatedAt' | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-org>
            <tr (click)="onRowClick(org)" style="cursor: pointer;">
              <td>{{ org.name }}</td>
              <td>
                <p-tag
                  [value]="'admin.organizations.status.' + org.status | translate"
                  [severity]="statusSeverity(org.status)"
                />
              </td>
              <td>{{ org.created_at | date: 'short' }}</td>
              <td>{{ org.updated_at | date: 'short' }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" style="text-align: center;">
                {{ 'admin.organizations.table.empty' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Bootstrap Organization Dialog -->
      <p-dialog
        [header]="'admin.organizations.bootstrapDialog.title' | translate"
        [(visible)]="showBootstrapDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        (onHide)="onCancelBootstrap()"
        data-testid="iam-org-create-dialog"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          <!-- Bootstrap error -->
          @if (bootstrapState().status === 'error') {
            <p-message
              [severity]="bootstrapState().retryable ? 'warn' : 'error'"
              [style]="{ width: '100%' }"
            >
              <span>{{ translateBootstrapError(bootstrapState().error) }}</span>
            </p-message>
          }

          <div class="form-field">
            <label>{{ 'admin.organizations.bootstrapDialog.orgName' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="bootstrapForm.org_name"
              (blur)="fieldTouched.org_name = true"
              data-testid="iam-org-name-input"
              style="width: 100%;"
            />
            @if (fieldTouched.org_name && !bootstrapForm.org_name.trim()) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.orgNameRequired' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label>{{ 'admin.organizations.bootstrapDialog.ownerUsername' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="bootstrapForm.owner_username"
              (blur)="fieldTouched.owner_username = true"
              data-testid="iam-org-owner-username-input"
              style="width: 100%;"
            />
            @if (fieldTouched.owner_username && !bootstrapForm.owner_username.trim()) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.usernameRequired' | translate
              }}</small>
            } @else if (
              fieldTouched.owner_username &&
              bootstrapForm.owner_username.trim().length > 0 &&
              bootstrapForm.owner_username.trim().length < 3
            ) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.usernameMinLength' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label>{{ 'admin.organizations.bootstrapDialog.ownerEmail' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="bootstrapForm.owner_email"
              (blur)="fieldTouched.owner_email = true"
              data-testid="iam-org-owner-email-input"
              type="email"
              style="width: 100%;"
            />
            @if (fieldTouched.owner_email && !bootstrapForm.owner_email.trim()) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.emailRequired' | translate
              }}</small>
            } @else if (
              fieldTouched.owner_email &&
              bootstrapForm.owner_email.trim().length > 0 &&
              !isValidEmail(bootstrapForm.owner_email)
            ) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.emailInvalid' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label
              >{{ 'admin.organizations.bootstrapDialog.ownerDisplayName' | translate }} *</label
            >
            <input
              pInputText
              [(ngModel)]="bootstrapForm.owner_display_name"
              (blur)="fieldTouched.owner_display_name = true"
              data-testid="iam-org-owner-display-name-input"
              style="width: 100%;"
            />
            @if (fieldTouched.owner_display_name && !bootstrapForm.owner_display_name.trim()) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.displayNameRequired' | translate
              }}</small>
            }
          </div>
          <div class="form-field">
            <label>{{ 'admin.organizations.bootstrapDialog.ownerPassword' | translate }} *</label>
            <input
              pInputText
              [(ngModel)]="bootstrapForm.owner_password"
              (blur)="fieldTouched.owner_password = true"
              data-testid="iam-org-owner-password-input"
              type="password"
              style="width: 100%;"
            />
            @if (fieldTouched.owner_password && !bootstrapForm.owner_password.trim()) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.passwordRequired' | translate
              }}</small>
            } @else if (
              fieldTouched.owner_password &&
              bootstrapForm.owner_password.trim().length > 0 &&
              bootstrapForm.owner_password.trim().length < 8
            ) {
              <small class="p-error">{{
                'admin.organizations.bootstrapDialog.validation.passwordMinLength' | translate
              }}</small>
            }
          </div>

          <p class="audit-hint">
            {{ 'admin.organizations.bootstrapDialog.auditHint' | translate }}
          </p>
        </div>
        <ng-template #footer>
          <p-button
            [label]="'admin.organizations.bootstrapDialog.cancel' | translate"
            severity="secondary"
            data-testid="iam-org-cancel-btn"
            (onClick)="onCancelBootstrap()"
          />
          @if (bootstrapState().retryable) {
            <p-button
              [label]="'admin.organizations.bootstrapDialog.retry' | translate"
              icon="pi pi-refresh"
              data-testid="iam-org-submit-btn"
              (onClick)="onBootstrapOrganization()"
              [loading]="bootstrapState().status === 'loading'"
            />
          } @else {
            <p-button
              [label]="'admin.organizations.bootstrapDialog.submit' | translate"
              data-testid="iam-org-submit-btn"
              (onClick)="onBootstrapOrganization()"
              [loading]="bootstrapState().status === 'loading'"
              [disabled]="!isBootstrapFormValid()"
            />
          }
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .organization-list {
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
      .audit-hint {
        font-size: 0.8rem;
        color: var(--p-text-muted-color);
        margin: 0;
      }
    `,
  ],
})
export class OrganizationListPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly orgService = inject(OrganizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly organizations = signal<OrganizationResponse[]>([]);
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

  // Bootstrap dialog
  readonly showBootstrapDialog = signal<boolean>(false);
  readonly bootstrapState = createRequestState<OrganizationResponse>();
  readonly formTouched = signal<boolean>(false);
  fieldTouched = {
    org_name: false,
    owner_username: false,
    owner_email: false,
    owner_display_name: false,
    owner_password: false,
  };
  private idempotencyKey = '';
  bootstrapForm: BootstrapOrganizationRequest = {
    org_name: '',
    owner_username: '',
    owner_email: '',
    owner_display_name: '',
    owner_password: '',
  };

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    if (params['limit']) {
      this.limit.set(Number(params['limit']));
    }
    if (params['offset']) {
      this.offset.set(Number(params['offset']));
    }

    this.fetchOrganizations();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limit();

    this.offset.set(first);
    this.limit.set(rows);
    this.syncQueryParams();
    this.fetchOrganizations();
  }

  onRowClick(org: OrganizationResponse): void {
    this.router.navigate(['/admin/organizations', org.id]);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    this.fetchOrganizations();
  }

  onOpenBootstrapDialog(): void {
    this.resetBootstrapForm();
    this.fieldTouched = {
      org_name: false,
      owner_username: false,
      owner_email: false,
      owner_display_name: false,
      owner_password: false,
    };
    resetRequestState(this.bootstrapState);
    this.idempotencyKey = crypto.randomUUID();
    this.showBootstrapDialog.set(true);
  }

  onBootstrapOrganization(): void {
    // Touch all fields to show any remaining validation errors
    this.fieldTouched = {
      org_name: true,
      owner_username: true,
      owner_email: true,
      owner_display_name: true,
      owner_password: true,
    };

    // Client-side validation before sending
    if (!this.isBootstrapFormValid()) {
      return;
    }

    // On non-retryable error (422), generate a new key since saga already compensated
    if (bootstrapFormChanged(this.bootstrapForm) && !this.bootstrapState().retryable) {
      this.idempotencyKey = crypto.randomUUID();
    }

    const body: BootstrapOrganizationRequest = { ...this.bootstrapForm };

    executeRequest(
      this.bootstrapState,
      this.orgService.bootstrapOrganization(body, this.idempotencyKey),
      {
        onSuccess: () => {
          this.showBootstrapDialog.set(false);
          this.resetBootstrapForm();
          this.fetchOrganizations();
        },
        onError: (err: HttpErrorResponse) => {
          // On 422 (saga failure), generate new key for next attempt
          if (err.status === 422) {
            this.idempotencyKey = crypto.randomUUID();
          }
          // On retryable errors (0, 503), keep same key — dialog stays open via state
        },
      },
    );
  }

  isBootstrapFormValid(): boolean {
    return (
      this.bootstrapForm.org_name.trim().length > 0 &&
      this.bootstrapForm.owner_username.trim().length >= 3 &&
      this.isValidEmail(this.bootstrapForm.owner_email) &&
      this.bootstrapForm.owner_display_name.trim().length > 0 &&
      this.bootstrapForm.owner_password.trim().length >= 8
    );
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  translateBootstrapError(error: string | null): string {
    if (!error) return '';
    const key = `admin.organizations.bootstrapDialog.errors.${error}`;
    const translated = this.translate.instant(key);
    // If the key wasn't found, ngx-translate returns the key itself
    return translated === key
      ? this.translate.instant('admin.organizations.bootstrapDialog.errors.GENERIC')
      : translated;
  }

  onCancelBootstrap(): void {
    this.showBootstrapDialog.set(false);
    this.fieldTouched = {
      org_name: false,
      owner_username: false,
      owner_email: false,
      owner_display_name: false,
      owner_password: false,
    };
    this.resetBootstrapForm();
    resetRequestState(this.bootstrapState);
  }

  statusSeverity(status: string): 'success' | 'secondary' {
    return status === 'active' ? 'success' : 'secondary';
  }

  private fetchOrganizations(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    this.orgService.listOrganizations({ limit: this.limit(), offset: this.offset() }).subscribe({
      next: (response) => {
        this.organizations.set(response.items);
        this.totalRecords.set(response.total_count);
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
    { i18nPrefix: 'admin.organizations', translate: this.translate },
  );

  private syncQueryParams(): void {
    const queryParams: Record<string, string | null> = {
      limit: String(this.limit()),
      offset: String(this.offset()),
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

  private resetBootstrapForm(): void {
    this.bootstrapForm = {
      org_name: '',
      owner_username: '',
      owner_email: '',
      owner_display_name: '',
      owner_password: '',
    };
  }
}

/** Simple check — always returns true since we don't track previous form state. */
function bootstrapFormChanged(_form: BootstrapOrganizationRequest): boolean {
  return true;
}
