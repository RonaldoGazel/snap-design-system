/**
 * Section List Page — manages organizational sections (ADR-005).
 *
 * Sections are the single source of truth for data segregation within
 * an organization. They are managed via identity-service, NOT
 * permission-service groups.
 */
import { Component, ChangeDetectionStrategy, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { SectionService } from '../../services/section.service';
import { OrgContextSwitcherComponent } from '../../components/org-context-switcher/org-context-switcher.component';
import { ForbiddenViewComponent } from '../../../audit/components/forbidden-view/forbidden-view.component';
import { SectionResponse, SectionTreeNode } from '../../models/identity.model';
import { createErrorHandler } from '../../../../shared/utils/error-handler';

@Component({
  selector: 'app-group-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    TreeTableModule,
    TableModule,
    ButtonModule,
    Message,
    Dialog,
    InputTextModule,
    SelectModule,
    TooltipModule,
    TranslateModule,
    OrgContextSwitcherComponent,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else {
      <div class="group-list">
        <app-org-context-switcher />

        <h2>{{ 'admin.sections.title' | translate }}</h2>

        <!-- Error message -->
        @if (errorMessage()) {
          <p-message
            [severity]="errorSeverity()"
            [style]="{ 'margin-bottom': '1rem', width: '100%' }"
          >
            <span>{{ errorMessage()! | translate }}</span>
            @if (showRetry()) {
              <p-button
                [label]="'admin.sections.error.retry' | translate"
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
          @if (activeOrg.canMutate()) {
            <p-button
              data-testid="iam-group-create-btn"
              [label]="'admin.sections.create' | translate"
              icon="pi pi-plus"
              (onClick)="showCreateDialog.set(true)"
            />
          }
        </div>

        <!-- Tree Table (primary view) -->
        @if (useTreeView()) {
          <p-treetable
            data-testid="iam-group-tree-table"
            [value]="treeNodes()"
            [loading]="loading()"
            [scrollable]="true"
            [tableStyle]="{ width: '100%' }"
          >
            <ng-template #header>
              <tr>
                <th>{{ 'admin.sections.table.name' | translate }}</th>
                <th>{{ 'admin.sections.table.createdAt' | translate }}</th>
                <th>{{ 'admin.sections.table.updatedAt' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template #body let-rowNode let-rowData="rowData">
              <tr
                [ttRow]="rowNode"
                (click)="onTreeRowClick(rowData)"
                style="cursor: pointer;"
                [pTooltip]="'admin.sections.list.hierarchyTooltip' | translate"
                tooltipPosition="top"
              >
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <p-treetable-toggler [rowNode]="rowNode" />
                    <span>{{ rowData.name }}</span>
                  </div>
                </td>
                <td>{{ rowData.created_at | date: 'short' }}</td>
                <td>{{ rowData.updated_at | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="3" style="text-align: center;">
                  {{ 'admin.sections.table.empty' | translate }}
                </td>
              </tr>
            </ng-template>
          </p-treetable>
        } @else {
          <!-- Flat Table (fallback) -->
          <p-table
            data-testid="iam-group-table"
            [value]="sections()"
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
                <th>{{ 'admin.sections.table.name' | translate }}</th>
                <th>{{ 'admin.sections.table.createdAt' | translate }}</th>
                <th>{{ 'admin.sections.table.updatedAt' | translate }}</th>
              </tr>
            </ng-template>
            <ng-template #body let-section>
              <tr (click)="onRowClick(section)" style="cursor: pointer;">
                <td>{{ section.name }}</td>
                <td>{{ section.created_at | date: 'short' }}</td>
                <td>{{ section.updated_at | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="3" style="text-align: center;">
                  {{ 'admin.sections.table.empty' | translate }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>

      <!-- Create Section Dialog -->
      <p-dialog
        data-testid="iam-group-create-dialog"
        [header]="'admin.sections.createDialog.title' | translate"
        [(visible)]="showCreateDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        <div
          class="dialog-form"
          style="display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem;"
        >
          <div class="form-field">
            <label>{{ 'admin.sections.createDialog.name' | translate }}</label>
            <input pInputText data-testid="iam-group-name-input" [(ngModel)]="createForm.name" style="width: 100%;" />
          </div>
          <div class="form-field">
            <label>{{ 'admin.sections.createDialog.parentSection' | translate }}</label>
            <p-select
              data-testid="iam-group-parent-select"
              [(ngModel)]="createForm.parent_section_id"
              [options]="parentSectionOptions()"
              optionLabel="name"
              optionValue="id"
              [placeholder]="'admin.sections.createDialog.parentSectionPlaceholder' | translate"
              [showClear]="true"
              [style]="{ width: '100%' }"
              appendTo="body"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            data-testid="iam-group-cancel-btn"
            [label]="'admin.sections.createDialog.cancel' | translate"
            severity="secondary"
            (onClick)="onCancelCreate()"
          />
          <p-button
            data-testid="iam-group-submit-btn"
            [label]="'admin.sections.createDialog.save' | translate"
            (onClick)="onCreateSection()"
            [loading]="creating()"
            [disabled]="!createForm.name.trim()"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      .group-list {
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
    `,
  ],
})
export class GroupListPage implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly sectionService = inject(SectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State signals
  readonly sections = signal<SectionResponse[]>([]);
  readonly treeNodes = signal<TreeNode[]>([]);
  readonly useTreeView = signal<boolean>(true);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorSeverity = signal<'error' | 'warn'>('error');
  readonly showRetry = signal<boolean>(false);

  // Flat section list for parent selector in create dialog
  readonly parentSectionOptions = signal<SectionResponse[]>([]);

  // Pagination signals (used for flat table fallback)
  readonly limit = signal<number>(50);
  readonly offset = signal<number>(0);
  readonly rowsPerPageOptions = [20, 50, 100];

  // Create dialog
  readonly showCreateDialog = signal<boolean>(false);
  readonly creating = signal<boolean>(false);
  createForm: { name: string; parent_section_id: string | null } = {
    name: '',
    parent_section_id: null,
  };

  constructor() {
    effect(() => {
      const orgId = this.activeOrg.activeOrganizationId();
      if (orgId !== null) {
        untracked(() => {
          this.sections.set([]);
          this.treeNodes.set([]);
          this.offset.set(0);
          this.fetchSectionTree();
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
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.limit();

    this.offset.set(first);
    this.limit.set(rows);
    this.syncQueryParams();
    this.fetchSections();
  }

  onRowClick(section: SectionResponse): void {
    this.router.navigate(['/admin/groups', section.id]);
  }

  onTreeRowClick(rowData: { id: string }): void {
    this.router.navigate(['/admin/groups', rowData.id]);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.showRetry.set(false);
    if (this.useTreeView()) {
      this.fetchSectionTree();
    } else {
      this.fetchSections();
    }
  }

  onCreateSection(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!this.createForm.name.trim() || !orgId) return;

    this.creating.set(true);
    this.errorMessage.set(null);

    this.sectionService
      .createSection(orgId, {
        name: this.createForm.name.trim(),
        parent_section_id: this.createForm.parent_section_id || undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateDialog.set(false);
          this.resetCreateForm();
          if (this.useTreeView()) {
            this.fetchSectionTree();
          } else {
            this.fetchSections();
          }
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

  private fetchSectionTree(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    this.sectionService.getSectionTree(orgId).subscribe({
      next: (tree) => {
        this.treeNodes.set(this.convertToTreeNodes(tree));
        this.useTreeView.set(true);
        this.loading.set(false);
        this.fetchFlatSectionsForSelector();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 503) {
          this.useTreeView.set(false);
          this.fetchSections();
          return;
        }
        this.handleError(err);
      },
    });
  }

  private fetchSections(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showRetry.set(false);

    this.sectionService
      .listSections(orgId, { limit: this.limit(), offset: this.offset() })
      .subscribe({
        next: (response) => {
          this.sections.set(response.items);
          this.totalRecords.set(response.total_count);
          this.loading.set(false);
          this.parentSectionOptions.set(response.items);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.handleError(err);
        },
      });
  }

  private fetchFlatSectionsForSelector(): void {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) return;

    this.sectionService.listSections(orgId, { limit: 200, offset: 0 }).subscribe({
      next: (response) => this.parentSectionOptions.set(response.items),
      error: () => {
        // Non-critical — selector will just be empty
      },
    });
  }

  private convertToTreeNodes(nodes: SectionTreeNode[]): TreeNode[] {
    return nodes.map((node) => ({
      data: {
        id: node.id,
        name: node.name,
        parent_section_id: node.parent_section_id,
        created_at: node.created_at,
        updated_at: node.updated_at,
      },
      children: node.children?.length ? this.convertToTreeNodes(node.children) : [],
      expanded: true,
    }));
  }

  private readonly handleError = createErrorHandler(
    {
      errorMessage: this.errorMessage,
      errorSeverity: this.errorSeverity,
      showRetry: this.showRetry,
      forbidden: this.forbidden,
    },
    { i18nPrefix: 'admin.sections', translate: this.translate },
  );

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
    this.createForm = { name: '', parent_section_id: null };
  }
}
