import {
  Component,
  inject,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { BpmsWorkflowEngineService } from '../../services/bpms-workflow-engine.service';
import { BpmsInstanceStateService } from '../../services/bpms-instance-state.service';
import { OrgSelectorComponent } from '../../shared/org-selector/org-selector';
import {
  BpmsDocumentInstance,
  BpmsFlowTransition,
  UnitProfileCombo,
  DisseminationTarget,
} from '../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Document workflow component — displays available actions for a document instance.
 *
 * All available transitions, formalization, and dissemination capabilities
 * are determined by the backend. The frontend does NOT evaluate flow rules.
 */
@Component({
  selector: 'app-document-workflow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    TagModule,
    TextareaModule,
    OrgSelectorComponent,
    TranslateModule,
  ],
  templateUrl: './document-workflow.html',
  styleUrl: './document-workflow.css',
})
export class DocumentWorkflowComponent implements OnInit {
  private readonly engine = inject(BpmsWorkflowEngineService);
  private readonly instanceState = inject(BpmsInstanceStateService);

  readonly instance = input.required<BpmsDocumentInstance>();
  readonly actor = input.required<UnitProfileCombo>();
  readonly onUpdate = output<BpmsDocumentInstance>();

  readonly showTransitionForm = signal(false);
  readonly selectedTransition = signal<BpmsFlowTransition | null>(null);
  readonly transitionNotes = signal('');
  readonly showDisseminationForm = signal(false);
  readonly disseminationType = signal<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  readonly disseminationTargets = signal<UnitProfileCombo[]>([]);
  readonly disseminationNotes = signal('');
  readonly disseminationReceipt = signal('');
  readonly loading = signal(false);

  // Backend-driven available transitions (loaded from GET /instances/{id}/transitions)
  readonly availableTransitions = signal<BpmsFlowTransition[]>([]);

  // Formalization and dissemination capabilities are derived from instance state
  // (the backend controls what's possible via the transitions endpoint)
  readonly canFormalize = computed(() => {
    const inst = this.instance();
    return !inst.is_formalized && inst.status !== 'CANCELADO';
  });
  readonly canDisseminateInternal = computed(() => {
    const inst = this.instance();
    return inst.status !== 'CANCELADO';
  });
  readonly canDisseminateExternal = computed(() => {
    const inst = this.instance();
    return inst.is_formalized && inst.status !== 'CANCELADO';
  });

  constructor() {
    // Reload available transitions when instance changes
    effect(() => {
      const inst = this.instance();
      if (inst?.id) {
        this.loadAvailableTransitions(inst.id);
      }
    });
  }

  ngOnInit(): void {
    this.loadAvailableTransitions(this.instance().id);
  }

  private loadAvailableTransitions(instanceId: string): void {
    this.loading.set(true);
    this.engine.getAvailableTransitions$(instanceId).subscribe({
      next: (transitions) => {
        this.availableTransitions.set(transitions);
        this.loading.set(false);
      },
      error: () => {
        this.availableTransitions.set([]);
        this.loading.set(false);
      },
    });
  }

  /** Public refresh — called by parent or after external state changes. */
  refreshActions(): void {
    this.loadAvailableTransitions(this.instance().id);
  }

  openTransitionForm(transition: BpmsFlowTransition): void {
    this.selectedTransition.set(transition);
    this.transitionNotes.set('');
    this.showTransitionForm.set(true);
  }

  executeTransition(): void {
    const transition = this.selectedTransition();
    if (!transition) return;

    this.loading.set(true);
    this.instanceState
      .advanceDocument(this.instance().id, transition.id, this.actor())
      .subscribe({
        next: (updated) => {
          this.onUpdate.emit(updated);
          this.showTransitionForm.set(false);
          this.loading.set(false);
          // Reload available transitions for the new step
          this.loadAvailableTransitions(updated.id);
        },
        error: () => {
          // Toast already shown by BpmsInstanceStateService.
          // Component just resets loading state.
          this.loading.set(false);
        },
      });
  }

  formalize(): void {
    this.loading.set(true);
    this.instanceState.formalizeDocument(this.instance().id, this.actor()).subscribe({
      next: (updated) => {
        this.onUpdate.emit(updated);
        this.loading.set(false);
        this.loadAvailableTransitions(updated.id);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openDisseminationForm(type: 'INTERNAL' | 'EXTERNAL'): void {
    this.disseminationType.set(type);
    this.disseminationTargets.set([]);
    this.disseminationNotes.set('');
    this.disseminationReceipt.set('');
    this.showDisseminationForm.set(true);
  }

  executeDissemination(): void {
    const targets: DisseminationTarget[] = this.disseminationTargets().map((c) => ({
      unit_id: c.unit_id,
      profile_id: c.profile_id,
    }));

    this.loading.set(true);
    this.instanceState
      .disseminateDocument(
        this.instance().id,
        targets,
        this.actor(),
        this.disseminationType(),
      )
      .subscribe({
        next: (updated) => {
          this.onUpdate.emit(updated);
          this.showDisseminationForm.set(false);
          this.loading.set(false);
          this.loadAvailableTransitions(updated.id);
        },
        error: (err) => {
          // Check for OTP step-up requirement
          if (err?.code === 'OTP_STEP_UP_REQUIRED') {
            // TODO: Trigger OTP step-up flow
            this.loading.set(false);
            return;
          }
          this.loading.set(false);
        },
      });
  }

  onTargetSelectionChange(combos: UnitProfileCombo[]): void {
    this.disseminationTargets.set(combos);
  }

  transitionTypeLabel(type: string): string {
    const map: Record<string, string> = {
      APROVACAO: 'workflows.transitionType.standard_forward',
      DEVOLUCAO: 'workflows.transitionType.standard_backward',
      REENVIO: 'workflows.transitionType.standard_forward',
      FORMALIZACAO: 'workflows.transitionType.standard_forward',
      DIFUSAO: 'workflows.transitionType.standard_forward',
    };
    return map[type] ?? type;
  }

  transitionSeverity(
    type: string,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      APROVACAO: 'success',
      DEVOLUCAO: 'warn',
      REENVIO: 'info',
      FORMALIZACAO: 'success',
      DIFUSAO: 'info',
    };
    return map[type] ?? 'secondary';
  }
}
