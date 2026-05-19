import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { MessageService, MenuItem } from 'primeng/api';
import { forkJoin, of, switchMap, map } from 'rxjs';

import { BpmsApiService } from '../../../workflows/services/bpms-api.service';
import { WorkflowApiBaseService } from '../../../workflows/services/workflow-api-base.service';
import {
  BpmsFlow,
  BpmsFlowStep,
  BpmsDocumentType,
  BpmsTemplate,
} from '../../../workflows/models/bpms.model';
import { ClearanceLevelService } from '../../../iam/services/clearance-level.service';
import { ClearanceLevelResponse } from '../../../iam/models/identity.model';

/**
 * Document creation wizard — 3 steps:
 *   1. Pick a workflow (filtered by user's section+role eligibility)
 *   2. Fill metadata (title, description, security level)
 *   3. Confirm & save (calls process → document → workflow instance)
 *
 * No editor step — editing happens after creation via Collabora.
 * The template preview is shown read-only in step 1.
 */
@Component({
  selector: 'app-document-wizard',
  standalone: true,
  imports: [
    FormsModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CardModule,
    TextareaModule,
    ToastModule,
    ProgressBarModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './document-wizard.html',
  styleUrl: './document-wizard.css',
})
export class DocumentWizardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly bpmsApi = inject(BpmsApiService);
  private readonly workflowApi = inject(WorkflowApiBaseService);
  private readonly clearanceLevelService = inject(ClearanceLevelService);
  private readonly messageService = inject(MessageService);

  // ── Step management ──────────────────────────────────────────────────
  activeIndex = signal(0);
  steps: MenuItem[] = [
    { label: 'Fluxo' },
    { label: 'Metadados' },
    { label: 'Confirmação' },
  ];

  // ── Step 0: Workflow selection ────────────────────────────────────────
  workflows = signal<BpmsFlow[]>([]);
  loadingWorkflows = signal(false);
  selectedWorkflow = signal<BpmsFlow | null>(null);
  workflowDocumentTypes = signal<BpmsDocumentType[]>([]);
  workflowTemplate = signal<BpmsTemplate | null>(null);
  workflowSteps = signal<BpmsFlowStep[]>([]);
  loadingFlowDetail = signal(false);

  // ── Step 1: Metadata ─────────────────────────────────────────────────
  documentTitle = signal('');
  documentDescription = signal('');
  documentSecurityLevel = signal<number | null>(null);
  clearanceLevels = signal<ClearanceLevelResponse[]>([]);

  // ── Step 2: Save ─────────────────────────────────────────────────────
  saving = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────
  resolvedDocTypeName = computed(() => {
    const types = this.workflowDocumentTypes();
    return types.length > 0 ? types.map((t) => t.name).join(', ') : '—';
  });

  resolvedDocTypeId = computed(() => {
    const types = this.workflowDocumentTypes();
    return types.length > 0 ? types[0].id : null;
  });

  resolvedTemplateName = computed(() => {
    return this.workflowTemplate()?.name ?? 'Nenhum template vinculado';
  });

  resolvedStepCount = computed(() => this.workflowSteps().length);

  /** The second step name (where the document lands after creation). */
  resolvedStartingStepName = computed(() => {
    const steps = this.workflowSteps();
    if (steps.length < 2) return '—';
    const sorted = [...steps].sort((a, b) => a.order_index - b.order_index);
    return sorted[1]?.name ?? '—';
  });

  securityLevelOptions = computed(() =>
    this.clearanceLevels().map((cl) => ({
      label: cl.name,
      value: cl.level,
    })),
  );

  isStep0Valid = computed(() => this.selectedWorkflow() !== null);

  isStep1Valid = computed(
    () => this.documentTitle().trim().length > 0 && this.documentSecurityLevel() !== null,
  );

  canAdvance = computed(() => {
    switch (this.activeIndex()) {
      case 0:
        return this.isStep0Valid();
      case 1:
        return this.isStep1Valid();
      case 2:
        return true;
      default:
        return false;
    }
  });

  // ── Lifecycle ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadWorkflows();
    this.loadClearanceLevels();
  }

  private loadClearanceLevels(): void {
    this.clearanceLevelService.listClearanceLevels().subscribe({
      next: (levels) => this.clearanceLevels.set(levels),
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Falha ao carregar níveis de classificação.',
          life: 5000,
        });
      },
    });
  }

  loadWorkflows(): void {
    this.loadingWorkflows.set(true);
    // Call with eligible_for_initiation=true — backend filters by user's section+role
    const params = new HttpParams()
      .set('status', 'published')
      .set('eligible_for_initiation', 'true');
    this.workflowApi
      .workflowGet<{ items: BpmsFlow[] }>('/definitions', { params })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? [];
          this.workflows.set(items);
          this.loadingWorkflows.set(false);
        },
        error: () => {
          this.loadingWorkflows.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao carregar fluxos disponíveis.',
            life: 8000,
          });
        },
      });
  }

  selectWorkflow(flow: BpmsFlow): void {
    this.selectedWorkflow.set(flow);
    this.workflowDocumentTypes.set([]);
    this.workflowTemplate.set(null);
    this.workflowSteps.set([]);
    this.loadFlowDetail(flow.id);
  }

  private loadFlowDetail(flowId: string): void {
    this.loadingFlowDetail.set(true);

    this.workflowApi.workflowGet<any>(`/definitions/${flowId}`).subscribe({
      next: (res) => {
        const flow = res.data;
        if (!flow) {
          this.loadingFlowDetail.set(false);
          return;
        }

        // Extract steps
        const steps: BpmsFlowStep[] = (flow.steps ?? []).map((s: any) => ({
          id: s.id,
          flow_version_id: flow.id,
          name: s.name,
          code: s.name,
          type: s.step_type ?? 'standard',
          order_index: s.ordinal ?? 0,
          is_mandatory: true,
        }));
        this.workflowSteps.set(steps);

        // Extract doc type from the definition's document_type field
        // The definition stores document_type as a code/id string
        const docTypeValue = flow.document_type ?? flow.metadata?.document_type_id ?? null;
        if (docTypeValue) {
          // Try to load the full doc type from document-service
          this.workflowApi.documentTypeGet<any>('').subscribe({
            next: (dtRes) => {
              const allTypes = (dtRes.data as any)?.items ?? dtRes.data ?? [];
              const items = Array.isArray(allTypes) ? allTypes : [];
              // Match by id or code
              const matched = items.find(
                (dt: any) => dt.id === docTypeValue || dt.code === docTypeValue,
              );
              if (matched) {
                this.workflowDocumentTypes.set([matched]);
                if (matched.template_id) {
                  this.resolveTemplate(matched.template_id);
                } else {
                  this.loadingFlowDetail.set(false);
                }
              } else {
                // Use the raw value as a fallback
                this.workflowDocumentTypes.set([{ id: docTypeValue, name: docTypeValue, code: docTypeValue } as any]);
                this.loadingFlowDetail.set(false);
              }
            },
            error: () => {
              this.workflowDocumentTypes.set([{ id: docTypeValue, name: docTypeValue, code: docTypeValue } as any]);
              this.loadingFlowDetail.set(false);
            },
          });
        } else {
          this.workflowDocumentTypes.set([]);
          this.loadingFlowDetail.set(false);
        }
      },
      error: () => {
        this.loadingFlowDetail.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar detalhes do fluxo.',
          life: 8000,
        });
      },
    });
  }

  private resolveTemplate(templateId: string): void {
    this.bpmsApi.getTemplates().subscribe({
      next: (templates) => {
        const tpl = templates.find((t) => t.id === templateId) ?? null;
        this.workflowTemplate.set(tpl);
        this.loadingFlowDetail.set(false);
      },
      error: () => {
        this.workflowTemplate.set(null);
        this.loadingFlowDetail.set(false);
      },
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────
  nextStep(): void {
    if (!this.canAdvance()) return;
    const idx = this.activeIndex();
    if (idx < this.steps.length - 1) {
      this.activeIndex.set(idx + 1);
    }
  }

  previousStep(): void {
    const idx = this.activeIndex();
    if (idx > 0) {
      this.activeIndex.set(idx - 1);
    }
  }

  cancel(): void {
    this.router.navigate(['/intelligence', 'documents']);
  }

  // ── Save — synchronous: process → document → workflow instance ──────
  createDocument(): void {
    if (!this.documentTitle().trim() || this.documentSecurityLevel() === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obrigatórios',
        detail: 'Preencha o título e o nível de segurança.',
        life: 5000,
      });
      return;
    }

    this.saving.set(true);

    const workflow = this.selectedWorkflow()!;
    const docTypeId = this.resolvedDocTypeId();
    const securityLevel = Number(this.documentSecurityLevel());
    const title = this.documentTitle().trim();

    // Step 1: Create process (camelCase for document-service)
    this.workflowApi
      .processPost<any>('', {
        title,
        description: this.documentDescription() || undefined,
        priority: 'NORMAL',
        securityLevel: securityLevel,
      })
      .pipe(
        // Step 2: Create document (camelCase for document-service)
        switchMap((processRes) => {
          const process = processRes.data;
          const processId = process?.id;
          if (!processId) {
            throw new Error('Process creation failed — no ID returned');
          }
          return this.workflowApi
            .documentPost<any>('', {
              title,
              processId: processId,
              documentTypeId: docTypeId,
              securityLevel: securityLevel,
              workflowDefinitionId: workflow.id,
            })
            .pipe(
              // Step 3: Create workflow instance
              switchMap((docRes) => {
                const document = docRes.data;
                const documentId = document?.id;
                if (!documentId) {
                  throw new Error('Document creation failed — no ID returned');
                }
                return this.workflowApi.workflowPost<any>('/instances', {
                  document_id: documentId,
                  definition_id: workflow.id,
                  priority: 'normal',
                }).pipe(
                  // Step 4: Update document with workflow_instance_id
                  switchMap((instanceRes) => {
                    const instanceId = instanceRes.data?.id;
                    if (instanceId) {
                      return this.workflowApi.documentPut<any>(`/${documentId}`, {
                        workflowInstanceId: instanceId,
                      }).pipe(
                        // Return the instance response regardless of update result
                        map(() => instanceRes),
                      );
                    }
                    return of(instanceRes);
                  }),
                );
              }),
            );
        }),
      )
      .subscribe({
        next: (instanceRes) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Documento criado',
            detail: `"${this.documentTitle()}" criado com sucesso.`,
            life: 5000,
          });
          this.router.navigate(['/intelligence', 'documents']);
        },
        error: (err) => {
          this.saving.set(false);
          const detail = err?.error?.detail?.message ?? err?.error?.detail ?? 'Falha ao criar documento.';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail,
            life: 8000,
          });
        },
      });
  }
}
