import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

import { ActiveOrgService } from '../../services/active-org.service';
import { SectionService } from '../../services/section.service';
import { UserService } from '../../services/user.service';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { UserPickerComponent } from '../../components/user-picker/user-picker.component';
import { SectionResponse } from '../../models/identity.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';
import { extractErrorMessage } from '../../../../shared/utils/request-state';

interface SectionMemberRow {
  user_id: string;
  section_id: string;
  created_at: string;
  _displayName?: string;
  _email?: string;
}

@Component({
  selector: 'app-group-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    Message,
    InputTextModule,
    TableModule,
    SelectModule,
    TranslateModule,
    ForbiddenViewComponent,
    UserPickerComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else if (notFound()) {
      <div class="group-detail">
        <p-message severity="error" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
          <span>{{ 'admin.sections.detail.notFound' | translate }}</span>
        </p-message>
        <p-button
          [label]="'admin.sections.detail.back' | translate"
          icon="pi pi-arrow-left"
          severity="secondary"
          (onClick)="onBack()"
        />
      </div>
    } @else {
      <div class="group-detail">
        <div class="header-row">
          <p-button
            [label]="'admin.sections.detail.back' | translate"
            icon="pi pi-arrow-left"
            severity="secondary"
            [text]="true"
            (onClick)="onBack()"
          />
          <h2>{{ 'admin.sections.detail.title' | translate }}</h2>
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ width: '100%', 'margin-bottom': '1rem' }"
          >
            <span>{{ errorMessage() }}</span>
            @if (showReload()) {
              <p-button
                [label]="'admin.sections.detail.reload' | translate"
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

        @if (section(); as s) {
          <p-message severity="info" [style]="{ width: '100%', 'margin-bottom': '1rem' }">
            <span>{{ 'admin.sections.detail.dataSegregationInfo' | translate }}</span>
          </p-message>

          @if (!editing()) {
            <!-- Read-only view -->
            <div class="detail-grid">
              <div class="detail-field">
                <label>{{ 'admin.sections.detail.field.name' | translate }}</label>
                <span>{{ s.name }}</span>
              </div>
              @if (parentSection()) {
                <div class="detail-field">
                  <label>{{ 'admin.sections.detail.field.parentSection' | translate }}</label>
                  <a [routerLink]="['/admin/groups', parentSection()!.id]" class="nav-link">
                    {{ parentSection()!.name }}
                  </a>
                </div>
              }
              <div class="detail-field">
                <label>{{ 'admin.sections.detail.field.createdAt' | translate }}</label>
                <span>{{ s.created_at | date: 'medium' }}</span>
              </div>
              <div class="detail-field">
                <label>{{ 'admin.sections.detail.field.updatedAt' | translate }}</label>
                <span>{{ s.updated_at | date: 'medium' }}</span>
              </div>
            </div>

            <!-- Child sections -->
            @if (childSections().length > 0) {
              <h3 style="margin-top: 1.5rem;">
                {{ 'admin.sections.detail.childSections.title' | translate }}
              </h3>
              <div class="child-groups-list">
                @for (child of childSections(); track child.id) {
                  <a [routerLink]="['/admin/groups', child.id]" class="nav-link child-group-item">
                    {{ child.name }}
                  </a>
                }
              </div>
            }

            <!-- Action buttons -->
            @if (activeOrg.canMutate()) {
              <div class="action-row">
                <p-button
                  [label]="'admin.sections.detail.edit' | translate"
                  icon="pi pi-pencil"
                  data-testid="iam-group-edit-btn"
                  (onClick)="onStartEdit()"
                />
                <p-button
                  [label]="'admin.sections.detail.delete' | translate"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  data-testid="iam-group-delete-btn"
                  (onClick)="onDelete()"
                />
              </div>
            }
          } @else {
            <!-- Edit form -->
            <div class="edit-form">
              <div class="form-field">
                <label>{{ 'admin.sections.detail.field.name' | translate }}</label>
                <input pInputText [(ngModel)]="editForm.name" style="width: 100%;" />
              </div>
              <div class="form-field">
                <label>{{ 'admin.sections.detail.field.parentSection' | translate }}</label>
                <p-select
                  [(ngModel)]="editForm.parent_section_id"
                  [options]="editParentOptions()"
                  optionLabel="name"
                  optionValue="id"
                  [placeholder]="'admin.sections.detail.field.parentSectionPlaceholder' | translate"
                  [showClear]="true"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              </div>
              <div class="action-row">
                <p-button
                  [label]="'admin.sections.detail.save' | translate"
                  icon="pi pi-check"
                  (onClick)="onSave()"
                  [loading]="saving()"
                />
                <p-button
                  [label]="'admin.sections.detail.cancel' | translate"
                  icon="pi pi-times"
                  severity="secondary"
                  (onClick)="onCancelEdit()"
                />
              </div>
            </div>
          }

          <!-- Member Management Section -->
          <h3 style="margin-top: 2rem;">{{ 'admin.sections.detail.members.title' | translate }}</h3>

          @if (activeOrg.canMutate()) {
            <div class="add-member-row">
              <app-user-picker
                (userSelected)="onUserSelected($event)"
                [placeholder]="'admin.sections.detail.members.searchUser'"
              />
              <p-button
                [label]="'admin.sections.detail.members.add' | translate"
                icon="pi pi-plus"
                data-testid="iam-group-add-member-btn"
                (onClick)="onAddMember()"
                [loading]="addingMember()"
                [disabled]="!selectedMemberUserId"
              />
            </div>
          }

          <!-- Members Table -->
          <p-table [value]="members()" [loading]="membersLoading()" [style]="{ width: '100%' }" data-testid="iam-group-members-table">
            <ng-template #header>
              <tr>
                <th>{{ 'admin.sections.detail.members.displayName' | translate }}</th>
                <th>{{ 'admin.sections.detail.members.email' | translate }}</th>
                @if (activeOrg.canMutate()) {
                  <th>{{ 'admin.sections.detail.members.actions' | translate }}</th>
                }
              </tr>
            </ng-template>
            <ng-template #body let-member>
              <tr>
                <td>{{ member._displayName || member.user_id }}</td>
                <td>{{ member._email || '—' }}</td>
                @if (activeOrg.canMutate()) {
                  <td>
                    <p-button
                      [label]="'admin.sections.detail.members.remove' | translate"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [text]="true"
                      (onClick)="onRemoveMember(member)"
                    />
                  </td>
                }
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td [attr.colspan]="activeOrg.canMutate() ? 3 : 2" style="text-align: center;">
                  {{ 'admin.sections.detail.members.empty' | translate }}
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
      .group-detail {
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
      .add-member-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .nav-link {
        color: var(--p-primary-color);
        text-decoration: none;
        cursor: pointer;
      }
      .nav-link:hover {
        text-decoration: underline;
      }
      .child-groups-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 8px;
        background: var(--p-content-background);
      }
      .child-group-item {
        padding: 0.25rem 0;
      }
    `,
  ],
})
export class GroupDetailPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly sectionService = inject(SectionService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // Section state
  readonly section = signal<SectionResponse | null>(null);
  readonly parentSection = signal<SectionResponse | null>(null);
  readonly childSections = signal<SectionResponse[]>([]);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly notFound = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showReload = signal<boolean>(false);
  readonly editing = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  editForm: { name: string; parent_section_id: string | null } = {
    name: '',
    parent_section_id: null,
  };

  readonly editParentOptions = signal<SectionResponse[]>([]);
  private allSections: SectionResponse[] = [];

  // Members
  readonly members = signal<SectionMemberRow[]>([]);
  readonly membersLoading = signal<boolean>(false);
  selectedMemberUserId = '';
  readonly addingMember = signal<boolean>(false);

  private get sectionId(): string {
    return this.route.snapshot.params['groupId'];
  }

  private get orgId(): string | null {
    return this.activeOrg.activeOrganizationId();
  }

  ngOnInit(): void {
    this.fetchSection();
    this.fetchAllSectionsForHierarchy();
  }

  onBack(): void {
    this.router.navigate(['/admin/groups']);
  }

  onReload(): void {
    this.errorMessage.set(null);
    this.showReload.set(false);
    this.fetchSection();
  }

  onStartEdit(): void {
    const s = this.section();
    if (!s) return;
    this.editForm = {
      name: s.name,
      parent_section_id: s.parent_section_id,
    };
    this.computeEditParentOptions();
    this.editing.set(true);
  }

  onCancelEdit(): void {
    this.editing.set(false);
  }

  onSave(): void {
    const s = this.section();
    if (!s || !this.orgId) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    this.sectionService
      .updateSection(this.orgId, this.sectionId, {
        name: this.editForm.name,
        parent_section_id: this.editForm.parent_section_id,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(false);
          this.fetchSection();
          this.fetchAllSectionsForHierarchy();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === 422) {
            this.errorMessage.set(extractErrorMessage(err, 'Invalid request'));
            this.errorSeverity.set('error');
            return;
          }
          this.handleError(err);
        },
      });
  }

  onDelete(): void {
    const s = this.section();
    if (!s || !this.orgId) return;

    this.confirmationService.confirm({
      header: this.translate.instant('admin.sections.detail.confirmDelete'),
      message: this.translate.instant('admin.sections.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.sections.detail.delete'),
      rejectLabel: this.translate.instant('admin.sections.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.sectionService.deleteSection(this.orgId!, this.sectionId).subscribe({
          next: () => this.router.navigate(['/admin/groups']),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  onUserSelected(userId: string): void {
    this.selectedMemberUserId = userId;
  }

  onAddMember(): void {
    const userId = this.selectedMemberUserId.trim();
    if (!userId) return;

    this.addingMember.set(true);
    this.errorMessage.set(null);

    this.sectionService.assignUserToSection(userId, { section_id: this.sectionId }).subscribe({
      next: () => {
        this.addingMember.set(false);
        this.selectedMemberUserId = '';
        this.fetchMembers();
      },
      error: (err: HttpErrorResponse) => {
        this.addingMember.set(false);
        this.handleError(err);
      },
    });
  }

  onRemoveMember(member: SectionMemberRow): void {
    this.confirmationService.confirm({
      header: this.translate.instant('admin.sections.detail.members.confirmRemove'),
      message: this.translate.instant('admin.sections.detail.auditHint'),
      acceptLabel: this.translate.instant('admin.sections.detail.members.remove'),
      rejectLabel: this.translate.instant('admin.sections.detail.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.sectionService.removeUserFromSection(member.user_id, this.sectionId).subscribe({
          next: () => this.fetchMembers(),
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
      },
    });
  }

  private fetchSection(): void {
    if (!this.orgId) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.sectionService.getSection(this.orgId, this.sectionId).subscribe({
      next: (s) => {
        this.section.set(s);
        this.loading.set(false);
        this.resolveParentSection(s);
        this.resolveChildSections();
        this.fetchMembers();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
          return;
        }
        this.handleError(err);
      },
    });
  }

  private fetchMembers(): void {
    this.membersLoading.set(true);

    this.sectionService.getSectionUsers(this.sectionId).subscribe({
      next: (response) => {
        const rows: SectionMemberRow[] = response.users.map((u) => ({
          user_id: u.user_id,
          section_id: this.sectionId,
          created_at: '',
          _displayName: u.display_name,
          _email: u.email,
        }));
        this.members.set(rows);
        this.membersLoading.set(false);
      },
      error: () => {
        this.members.set([]);
        this.membersLoading.set(false);
      },
    });
  }

  private fetchAllSectionsForHierarchy(): void {
    if (!this.orgId) return;

    this.sectionService.listSections(this.orgId, { limit: 200, offset: 0 }).subscribe({
      next: (response) => {
        this.allSections = response.items;
        this.resolveParentSection(this.section());
        this.resolveChildSections();
      },
      error: () => {},
    });
  }

  private resolveParentSection(s: SectionResponse | null): void {
    if (!s?.parent_section_id) {
      this.parentSection.set(null);
      return;
    }
    const parent = this.allSections.find((sec) => sec.id === s.parent_section_id);
    this.parentSection.set(parent ?? null);
  }

  private resolveChildSections(): void {
    const children = this.allSections.filter((sec) => sec.parent_section_id === this.sectionId);
    this.childSections.set(children);
  }

  private computeEditParentOptions(): void {
    const excludeIds = this.collectDescendantIds(this.sectionId);
    excludeIds.add(this.sectionId);
    const options = this.allSections.filter((sec) => !excludeIds.has(sec.id));
    this.editParentOptions.set(options);
  }

  private collectDescendantIds(parentId: string): Set<string> {
    const ids = new Set<string>();
    const children = this.allSections.filter((sec) => sec.parent_section_id === parentId);
    for (const child of children) {
      ids.add(child.id);
      const grandchildren = this.collectDescendantIds(child.id);
      grandchildren.forEach((id) => ids.add(id));
    }
    return ids;
  }

  private readonly handleError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showReload,
      forbidden: this.forbidden,
      notFound: this.notFound,
    },
    { i18nPrefix: 'admin.sections', translate: this.translate },
  );
}
