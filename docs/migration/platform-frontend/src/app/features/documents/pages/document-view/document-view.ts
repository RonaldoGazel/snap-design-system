import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { TimelineModule } from 'primeng/timeline';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';

import { CollaboraEditorComponent } from '../../../../shared/components/collabora-editor/collabora-editor';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import {
  DocumentApiService,
  DocumentViewData,
  AvailableAction,
  AvailableActionsResponse,
  TimelineEntry,
  ActiveSessionsResponse,
} from '../services/document-api.service';
import {
  WorkflowStepperComponent,
  WorkflowStepItem,
} from '../shared/workflow-stepper/workflow-stepper';
import { OrgSelectorComponent } from '../../../workflows/shared/org-selector/org-selector';
import { UnitProfileCombo } from '../../../workflows/models/bpms.model';

/** Status labels (Portuguese). */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  in_production: 'Em Produção',
  in_review: 'Em Revisão',
  returned_for_adjustment: 'Devolvido para Ajuste',
  awaiting_formalization: 'Aguardando Formalização',
  formalized: 'Formalizado',
  disseminated: 'Difundido',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};

/**
 * Document view — simplified flow with "Avançar" / "Devolver" navigation.
 *
 * - If the user's step has edit capabilities → Collabora in edit mode
 * - Otherwise → Collabora in read-only/preview mode
 * - "Avançar" advances to the next step (fan-out to all connections)
 * - "Devolver" returns to the previous step with required observation
 */
@Component({
  selector: 'app-document-view',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    ToastModule,
    TagModule,
    DialogModule,
    TextareaModule,
    TabsModule,
    TimelineModule,
    InputTextModule,
    ChipModule,
    CollaboraEditorComponent,
    DateFormatPipe,
    WorkflowStepperComponent,
    OrgSelectorComponent,
  ],
  providers: [MessageService],
  templateUrl: './document-view.html',
  styleUrl: './document-view.css',
})
export class DocumentViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentApi = inject(DocumentApiService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);

  // ── Data signals ──────────────────────────────────────────────────
  viewData = signal<DocumentViewData | null>(null);
  loading = signal(true);
  saving = signal(false);

  // ── Dialog states ─────────────────────────────────────────────────
  showReturnDialog = signal(false);
  returnObservation = signal('');
  showActiveEditorsWarning = signal(false);
  activeEditorNames = signal<string[]>([]);

  // ── Computed from viewData ────────────────────────────────────────
  document = computed(() => this.viewData()?.document ?? null);

  availableActions = computed<AvailableActionsResponse>(() => {
    return (
      this.viewData()?.availableActions ?? {
        actions: [],
        assignmentId: null,
        currentStepName: '',
        canClaim: false,
        isClaimedByCurrentUser: false,
        canEdit: false,
      }
    );
  });

  /** The user can edit the document if the backend says can_edit is true. */
  canEditDocument = computed(() => {
    return this.availableActions().canEdit;
  });

  /** Can move forward — any forward transition action is available. */
  canMoveForward = computed(() => {
    const actions = this.availableActions().actions;
    // Any enabled action with a targetStepId that isn't a RETURN
    return actions.some(
      (a) => a.enabled && a.targetStepId && a.action !== 'RETURN',
    );
  });

  /** Can move backward — RETURN action is available. */
  canMoveBackward = computed(() => {
    return this.availableActions().actions.some(
      (a) => a.enabled && a.action === 'RETURN',
    );
  });

  /** Find the first forward transition action. */
  private forwardAction = computed<AvailableAction | null>(() => {
    const actions = this.availableActions().actions;
    return actions.find((a) => a.enabled && a.targetStepId && a.action !== 'RETURN') ?? null;
  });

  /** Find the return action. */
  private returnAction = computed<AvailableAction | null>(() => {
    return this.availableActions().actions.find((a) => a.enabled && a.action === 'RETURN') ?? null;
  });

  stepperSteps = computed<WorkflowStepItem[]>(() => {
    return (this.viewData()?.definitionSteps ?? [])
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((s) => ({
        id: s.id,
        name: s.name,
        ordinal: s.ordinal,
      }));
  });

  currentStepId = computed(() => this.viewData()?.instance?.currentStepId ?? '');

  currentStepName = computed(() => this.availableActions().currentStepName || '—');

  statusLabel = computed(() => {
    const s = this.document()?.status;
    return s ? STATUS_LABELS[s] ?? s : '';
  });

  statusSeverity = computed<'success' | 'warn' | 'danger' | 'info' | 'secondary'>(() => {
    const s = this.document()?.status;
    if (s === 'formalized' || s === 'disseminated') return 'success';
    if (s === 'cancelled') return 'danger';
    if (s === 'in_review' || s === 'awaiting_formalization') return 'warn';
    if (s === 'returned_for_adjustment') return 'warn';
    return 'secondary';
  });

  isFormalized = computed(() => this.document()?.status === 'formalized');

  /** Whether the user only has tracking access (creator without active assignment). */
  isTrackingOnly = computed(() => this.document()?.accessLevel === 'tracking');

  instanceId = computed(() => this.document()?.workflowInstanceId ?? null);

  // ── Dissemination step detection ──────────────────────────────────
  /** Whether the current step is a dissemination step. */
  isDisseminationStep = computed(() => {
    const actions = this.availableActions().actions;
    return actions.some(
      (a) => a.action === 'DISSEMINATE_INTERNAL' || a.action === 'DISSEMINATE_EXTERNAL',
    );
  });

  /** Whether the user can disseminate internally. */
  hasDisseminateInternal = computed(() =>
    this.availableActions().actions.some((a) => a.action === 'DISSEMINATE_INTERNAL' && a.enabled),
  );

  /** Whether the user can disseminate externally. */
  hasDisseminateExternal = computed(() =>
    this.availableActions().actions.some((a) => a.action === 'DISSEMINATE_EXTERNAL' && a.enabled),
  );

  /** Sanitized PDF URL for the final artifact viewer. */
  pdfSafeUrl = computed<SafeResourceUrl | null>(() => {
    const doc = this.document();
    if (!doc || !this.isDisseminationStep()) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `/api/v1/documents/${doc.id}/final-artifact`,
    );
  });

  /** PDF loading state for polling. */
  pdfLoading = signal(false);
  /** PDF error message. */
  pdfError = signal<string | null>(null);

  // ── Dissemination recipients ──────────────────────────────────────
  internalRecipients = signal<Array<{ section_id: string; role_id: string; label: string }>>([]);
  externalRecipients = signal<Array<{ email: string }>>([]);
  emailInput = signal('');
  emailError = signal<string | null>(null);

  /** Whether the Disseminar button should be enabled. */
  canDisseminate = computed(() => {
    return this.internalRecipients().length > 0 || this.externalRecipients().length > 0;
  });

  // ── Timeline (Histórico) ──────────────────────────────────────────
  activeTab = signal<string>('documento');
  timelineEntries = signal<TimelineEntry[]>([]);
  timelineLoading = signal(false);
  private timelineLoaded = false;

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.loadDocument(id);
    });
  }

  // ── Load ──────────────────────────────────────────────────────────
  private loadDocument(id: string): void {
    this.loading.set(true);
    this.documentApi.loadDocumentView(id).subscribe({
      next: (data) => {
        this.viewData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast('error', 'Não encontrado', 'Documento não encontrado.');
        this.router.navigate(['/intelligence', 'documents']);
      },
    });
  }

  private reload(): void {
    const docId = this.document()?.id;
    if (docId) this.loadDocument(docId);
  }

  // ── Workflow Navigation ───────────────────────────────────────────

  moveForward(): void {
    const action = this.forwardAction();
    if (!action?.targetStepId || !this.instanceId()) return;

    const docId = this.document()?.id;
    if (!docId) return;

    // Check for active editors before transitioning
    this.documentApi.getActiveSessions(docId).subscribe({
      next: (sessions) => {
        if (sessions.has_active_editors) {
          // Filter out current user from the editors list
          const otherEditors = sessions.editors.filter(
            (e) => e.user_name !== '' // show all editors
          );
          this.activeEditorNames.set(
            otherEditors.map((e) => e.user_name || 'Usuário desconhecido'),
          );
          this.showActiveEditorsWarning.set(true);
        } else {
          this.confirmMoveForward();
        }
      },
      error: () => {
        // On failure to check, proceed anyway (fail-open for UX)
        this.confirmMoveForward();
      },
    });
  }

  confirmMoveForward(): void {
    this.showActiveEditorsWarning.set(false);
    const action = this.forwardAction();
    if (!action?.targetStepId || !this.instanceId()) return;

    this.saving.set(true);
    this.documentApi
      .executeTransition(this.instanceId()!, action.targetStepId)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast('success', 'Avançado', 'Documento avançou para a próxima etapa.');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.toastError(err);
        },
      });
  }

  executeReturn(): void {
    const action = this.returnAction();
    if (!action?.targetStepId || !this.instanceId()) return;

    this.saving.set(true);
    this.documentApi
      .executeReturn(this.instanceId()!, action.targetStepId, {
        reason: this.returnObservation(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showReturnDialog.set(false);
          this.returnObservation.set('');
          this.toast('success', 'Devolvido', 'Documento devolvido com observação.');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.toastError(err);
        },
      });
  }

  // ── Navigation ────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/intelligence', 'documents']);
  }

  // ── PDF Polling ───────────────────────────────────────────────────
  private pdfPollInterval: ReturnType<typeof setInterval> | null = null;
  private pdfPollCount = 0;
  private readonly PDF_POLL_MAX = 20; // 20 * 3s = 60s

  checkPdfAvailability(): void {
    const doc = this.document();
    if (!doc) return;

    this.pdfLoading.set(true);
    this.pdfError.set(null);
    this.pdfPollCount = 0;

    this.pollForPdf(doc.id);
  }

  private pollForPdf(documentId: string): void {
    this.pdfPollInterval = setInterval(() => {
      this.pdfPollCount++;
      if (this.pdfPollCount >= this.PDF_POLL_MAX) {
        this.stopPdfPolling();
        this.pdfLoading.set(false);
        this.pdfError.set('Falha na formalização do documento. Tente novamente.');
        return;
      }
      // The <object> tag handles loading natively. We just check via a HEAD-like approach.
      // For simplicity, we stop polling after the first successful check or timeout.
      // The <object> element will display the PDF once it's available.
      this.pdfLoading.set(false);
      this.stopPdfPolling();
    }, 3000);
  }

  private stopPdfPolling(): void {
    if (this.pdfPollInterval) {
      clearInterval(this.pdfPollInterval);
      this.pdfPollInterval = null;
    }
  }

  // ── Dissemination Recipients ──────────────────────────────────────

  onInternalRecipientsChange(combos: UnitProfileCombo[]): void {
    this.internalRecipients.set(
      combos.map((c) => ({
        section_id: c.unit_id,
        role_id: c.profile_id,
        label: `${c.unit?.acronym ?? ''} / ${c.profile?.name ?? ''}`,
      })),
    );
  }

  removeInternalRecipient(r: { section_id: string; role_id: string }): void {
    this.internalRecipients.update((list) =>
      list.filter((x) => !(x.section_id === r.section_id && x.role_id === r.role_id)),
    );
  }

  addEmail(): void {
    const email = this.emailInput().trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.emailError.set('Email inválido');
      return;
    }

    this.emailError.set(null);
    this.externalRecipients.update((list) => [...list, { email }]);
    this.emailInput.set('');
  }

  removeExternalRecipient(r: { email: string }): void {
    this.externalRecipients.update((list) => list.filter((x) => x.email !== r.email));
  }

  // ── Dissemination Execution ───────────────────────────────────────

  executeDissemination(): void {
    if (!this.instanceId()) return;

    const internal = this.internalRecipients().map((r) => ({
      section_id: r.section_id,
      role_id: r.role_id,
    }));
    const external = this.externalRecipients();
    const recipients = [...internal, ...external];

    let disseminationType: string;
    if (internal.length > 0 && external.length > 0) disseminationType = 'Hybrid';
    else if (internal.length > 0) disseminationType = 'Internal';
    else disseminationType = 'External';

    this.saving.set(true);
    this.documentApi
      .executeDissemination(this.instanceId()!, recipients, disseminationType, 'Restricted')
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast('success', 'Disseminado', 'Documento disseminado com sucesso.');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.toastError(err);
        },
      });
  }

  // ── Timeline (Histórico) ──────────────────────────────────────────

  onTabChange(tabValue: string | number | undefined): void {
    const val = String(tabValue ?? 'documento');
    this.activeTab.set(val);
    if (val === 'historico' && !this.timelineLoaded) {
      this.loadTimeline();
    }
  }

  private loadTimeline(): void {
    const instId = this.instanceId();
    if (!instId) return;

    this.timelineLoading.set(true);
    this.documentApi.getTimeline(instId).subscribe({
      next: (entries) => {
        // Sort newest first — use created_at, then break ties by action order
        // (auto_advance comes after initiation even at same timestamp)
        const actionOrder: Record<string, number> = {
          'initiation_completed': 0,
          'auto_advance_from_initiation': 1,
          'transition': 2,
          'return': 3,
        };
        const sorted = [...entries].sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (timeDiff !== 0) return timeDiff;
          // Same timestamp — use action order (higher = more recent)
          const orderA = actionOrder[a.actionPerformed] ?? 2;
          const orderB = actionOrder[b.actionPerformed] ?? 2;
          return orderB - orderA;
        });
        this.timelineEntries.set(sorted);
        this.timelineLoading.set(false);
        this.timelineLoaded = true;
      },
      error: () => {
        this.timelineLoading.set(false);
        this.toast('error', 'Erro', 'Não foi possível carregar o histórico.');
      },
    });
  }

  resolveStepName(stepId: string): string {
    if (!stepId) return '—';
    const steps = this.viewData()?.definitionSteps ?? [];
    const step = steps.find((s) => s.id === stepId);
    return step?.name ?? '—';
  }

  formatAction(entry: TimelineEntry): string {
    switch (entry.actionPerformed) {
      case 'initiation_completed':
        return 'Documento iniciado';
      case 'auto_advance_from_initiation':
        return 'Encaminhado automaticamente';
      case 'transition':
        return `Avançou para ${this.resolveStepName(entry.newState ?? '')}`;
      case 'return':
        return `Devolvido para ${this.resolveStepName(entry.newState ?? '')}`;
      default:
        return entry.actionPerformed;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }

  private toastError(err: any): void {
    const detail = err?.error?.detail?.message ?? err?.error?.detail ?? 'Operação falhou.';
    this.messageService.add({ severity: 'error', summary: 'Erro', detail, life: 8000 });
  }
}
