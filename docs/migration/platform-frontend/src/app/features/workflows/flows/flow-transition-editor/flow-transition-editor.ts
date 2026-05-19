import { Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsFlowTransition } from '../../models/bpms.model';
import { TransitionType } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-transition-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, TagModule,
    TranslateModule
  ],
  templateUrl: './flow-transition-editor.html',
  styleUrl: './flow-transition-editor.css',
})
export class FlowTransitionEditorComponent {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly transitions = this.flowState.transitions;
  readonly steps = this.flowState.steps;
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly transitionTypeOptions = [
    { label: this.translate.instant('workflows.transitionType.standard_forward'), value: TransitionType.STANDARD_FORWARD },
    { label: this.translate.instant('workflows.transitionType.standard_backward'), value: TransitionType.STANDARD_BACKWARD },
    { label: this.translate.instant('workflows.transitionType.standard_forward'), value: TransitionType.STANDARD_FORWARD },
    { label: this.translate.instant('workflows.stepType.formalization'), value: TransitionType.STANDARD_FORWARD },
    { label: this.translate.instant('workflows.stepType.internal_dissemination'), value: TransitionType.STANDARD_FORWARD }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    from_step_id: ['', Validators.required],
    to_step_id: ['', Validators.required],
    type: [TransitionType.STANDARD_FORWARD as string, Validators.required],
    description: [''],
  });

  openForm(transition?: BpmsFlowTransition): void {
    if (transition) {
      this.editingId.set(transition.id);
      this.form.patchValue({
        name: transition.name,
        from_step_id: transition.from_step_id,
        to_step_id: transition.to_step_id,
        type: transition.type,
        description: transition.description ?? '',
      });
    } else {
      this.editingId.set(null);
      this.form.reset({ type: TransitionType.STANDARD_FORWARD });
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.flowState.transitions.update(list =>
        list.map(t =>
          t.id === id
            ? {
                ...t,
                name: value.name ?? '',
                from_step_id: value.from_step_id ?? '',
                to_step_id: value.to_step_id ?? '',
                type: value.type as TransitionType,
                description: value.description ?? undefined,
              }
            : t,
        ),
      );
    } else {
      const newTransition: BpmsFlowTransition = {
        id: crypto.randomUUID(),
        flow_version_id: this.flowState.currentVersion()?.id ?? '',
        name: value.name ?? '',
        from_step_id: value.from_step_id ?? '',
        to_step_id: value.to_step_id ?? '',
        type: value.type as TransitionType,
        description: value.description ?? undefined,
      };
      this.flowState.addTransition(newTransition);
    }
    this.closeForm();
  }

  removeTransition(id: string): void {
    this.flowState.transitions.update(list => list.filter(t => t.id !== id));
  }

  saveAll(): void { this.flowState.saveAll(); }

  transitionTypeLabel(type: string): string {
    return this.transitionTypeOptions.find(o => o.value === type)?.label ?? type;
  }

  stepName(stepId: string): string {
    return this.flowState.stepMap().get(stepId)?.name ?? stepId;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
