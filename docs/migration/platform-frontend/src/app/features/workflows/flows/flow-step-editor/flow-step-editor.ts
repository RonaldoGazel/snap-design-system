import { Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsFlowStep } from '../../models/bpms.model';
import { StepType, RoleCode } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-step-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, CheckboxModule, ButtonModule, TagModule,
    TranslateModule
  ],
  templateUrl: './flow-step-editor.html',
  styleUrl: './flow-step-editor.css',
})
export class FlowStepEditorComponent {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly steps = this.flowState.steps;
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly stepTypeOptions = [
    { label: this.translate.instant('workflows.stepType.production'), value: StepType.PRODUCTION },
    { label: this.translate.instant('workflows.stepType.review'), value: StepType.REVIEW },
    { label: this.translate.instant('workflows.stepType.formalization'), value: StepType.FORMALIZATION },
    { label: this.translate.instant('workflows.stepType.internal_dissemination'), value: StepType.INTERNAL_DISSEMINATION },
    { label: this.translate.instant('workflows.stepType.external_dissemination'), value: StepType.EXTERNAL_DISSEMINATION },
    { label: this.translate.instant('workflows.stepType.operational_task'), value: StepType.OPERATIONAL_TASK },
    { label: this.translate.instant('workflows.stepType.terminal'), value: StepType.TERMINAL }
  ];

  readonly roleCodeOptions = [
    { label: 'Nenhum', value: null },
    { label: 'Criador', value: RoleCode.CRIADOR },
    { label: 'Produtor', value: RoleCode.PRODUTOR },
    { label: 'Revisor', value: RoleCode.REVISOR },
    { label: this.translate.instant('workflows.capability.FORMALIZE'), value: RoleCode.FORMALIZADOR },
    { label: this.translate.instant('workflows.capability.AUTHORIZE_DISSEMINATION'), value: RoleCode.AUTORIZADOR_DIFUSAO },
    { label: this.translate.instant('workflows.capability.EXECUTE_DISSEMINATION'), value: RoleCode.EXECUTOR_DIFUSAO }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    type: [StepType.PRODUCTION as string, Validators.required],
    description: [''],
    order_index: [0, [Validators.required, Validators.min(0)]],
    is_mandatory: [true],
    role_code: [null as string | null],
  });

  openForm(step?: BpmsFlowStep): void {
    if (step) {
      this.editingId.set(step.id);
      this.form.patchValue({
        name: step.name, code: step.code, type: step.type,
        description: step.description ?? '', order_index: step.order_index,
        is_mandatory: step.is_mandatory, role_code: step.role_code ?? null,
      });
    } else {
      this.editingId.set(null);
      this.form.reset({ type: StepType.PRODUCTION, order_index: this.steps().length, is_mandatory: true });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); this.form.reset(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.flowState.updateStep(id, {
        name: value.name ?? '', code: value.code ?? '', type: value.type as StepType,
        description: value.description ?? undefined, order_index: value.order_index ?? 0,
        is_mandatory: value.is_mandatory ?? true, role_code: value.role_code ?? undefined,
      });
    } else {
      const newStep: BpmsFlowStep = {
        id: crypto.randomUUID(), flow_version_id: this.flowState.currentVersion()?.id ?? '',
        name: value.name ?? '', code: value.code ?? '', type: value.type as StepType,
        description: value.description ?? undefined, order_index: value.order_index ?? 0,
        is_mandatory: value.is_mandatory ?? true, role_code: value.role_code ?? undefined,
      };
      this.flowState.addStep(newStep);
    }
    this.closeForm();
  }

  removeStep(id: string): void { this.flowState.removeStep(id); }
  saveAll(): void { this.flowState.saveAll(); }
  stepTypeLabel(type: string): string { return this.stepTypeOptions.find(o => o.value === type)?.label ?? type; }
  isInvalid(field: string): boolean { const ctrl = this.form.get(field); return !!(ctrl?.invalid && ctrl.touched); }
}
