import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BpmsApiService } from '../../services/bpms-api.service';
import { VisualBpmsApiService } from '../../services/visual-bpms-api.service';
import { BpmsDocumentType, BpmsStepCatalog } from '../../models/bpms.model';
import { BpmsVisualFlowStage } from '../../models/visual-bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface StageEntry {
  step_catalog_id: string;
  name: string;
  step_type: string;
  order_index: number;
  permissions: string[];
  /** True if this stage has profiles or connections in the existing flow (edit mode only) */
  hasBindings: boolean;
}

@Component({
  selector: 'app-visual-flow-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './visual-flow-form.html',
  styleUrl: './visual-flow-form.css',
})
export class VisualFlowFormComponent implements OnInit {
  private readonly bpmsApi = inject(BpmsApiService);
  private readonly visualApi = inject(VisualBpmsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly isEditMode = signal(false);
  readonly flowId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly documentTypes = signal<BpmsDocumentType[]>([]);
  readonly catalogSteps = signal<BpmsStepCatalog[]>([]);
  readonly selectedStages = signal<StageEntry[]>([]);

  /** Document types for the dropdown. */
  readonly documentTypeOptions = computed(() =>
    this.documentTypes()
      .filter((dt) => dt.is_active)
      .map((dt) => ({
        label: `${dt.code} — ${dt.name}`,
        value: dt.id,
      })),
  );

  get statusOptions() {
    return [
      { label: this.translate.instant('workflows.status.draft'), value: 'RASCUNHO' },
      { label: this.translate.instant('workflows.status.published'), value: 'ATIVO' },
      { label: this.translate.instant('workflows.status.archived'), value: 'INATIVO' },
    ];
  }

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    description: new FormControl('', [Validators.maxLength(2000)]),
    document_type_id: new FormControl<string | null>(null, [Validators.required]),
    status: new FormControl('RASCUNHO'),
  });

  readonly activeCatalogSteps = computed(() =>
    this.catalogSteps().filter((s) => s.is_active && s.step_type !== 'initiation'),
  );

  readonly addedStepIds = computed(() =>
    new Set(this.selectedStages().map((s) => s.step_catalog_id)),
  );

  readonly canAddStage = computed(() => this.selectedStages().length < 10);

  readonly hasMinStages = computed(() => this.selectedStages().length >= 1);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.flowId.set(id);
      this.isEditMode.set(true);
    }

    this.bpmsApi.getDocumentTypes().subscribe((types) => {
      this.documentTypes.set(types);
    });

    this.bpmsApi.getStepCatalog().subscribe((steps) => {
      this.catalogSteps.set(steps);

      // Auto-add the initiation step for new flows
      if (!this.isEditMode()) {
        const initiationStep = steps.find(
          (s) => s.step_type === 'initiation' && s.is_active,
        );
        if (initiationStep) {
          this.selectedStages.set([
            {
              step_catalog_id: initiationStep.id,
              name: initiationStep.name,
              step_type: initiationStep.step_type,
              order_index: 0,
              permissions: initiationStep.permissions ?? [],
              hasBindings: false,
            },
          ]);
        }
      }
    });

    if (id) {
      this.visualApi.getVisualFlow(id).subscribe({
        next: (flow) => {
          this.form.patchValue({
            name: flow.name,
            description: flow.description ?? '',
            document_type_id: flow.document_type_id ?? flow.template_id,
            status: flow.status,
          });
          // Load existing stages with binding info
          const stages: StageEntry[] = (flow.stages ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => ({
              step_catalog_id: s.step_catalog_id,
              name: s.step_catalog?.name ?? 'Etapa',
              step_type: s.step_catalog?.step_type ?? 'standard',
              order_index: s.order_index,
              permissions: s.step_catalog?.permissions ?? [],
              hasBindings: this.stageHasBindings(s, flow.connections ?? []),
            }));
          this.selectedStages.set(stages);
        },
        error: () => {
          this.errorMessage.set(this.translate.instant('workflows.errors.loadFlowFailed'));
        },
      });
    }
  }

  private stageHasBindings(
    stage: BpmsVisualFlowStage,
    connections: { source_stage_profile_id: string; target_stage_profile_id: string }[],
  ): boolean {
    const profiles = stage.profiles ?? [];
    if (profiles.length === 0) return false;
    const profileIds = new Set(profiles.map((p) => p.id));
    return connections.some(
      (c) => profileIds.has(c.source_stage_profile_id) || profileIds.has(c.target_stage_profile_id),
    );
  }

  isStepAlreadyAdded(stepId: string): boolean {
    return this.addedStepIds().has(stepId);
  }

  isAddDisabled(stepId: string): boolean {
    return this.isStepAlreadyAdded(stepId) || !this.canAddStage();
  }

  addStage(step: BpmsStepCatalog): void {
    if (this.isAddDisabled(step.id)) return;
    const current = this.selectedStages();
    this.selectedStages.set([
      ...current,
      {
        step_catalog_id: step.id,
        name: step.name,
        step_type: step.step_type,
        order_index: current.length,
        permissions: step.permissions ?? [],
        hasBindings: false,
      }
    ]);
  }

  /** Check if a stage is the locked initiation step (always index 0). */
  isInitiationStep(index: number): boolean {
    const stage = this.selectedStages()[index];
    return stage?.step_type === 'initiation' && index === 0;
  }

  removeStage(index: number): void {
    const stage = this.selectedStages()[index];
    if (stage.hasBindings) return; // blocked — has profiles/connections
    if (this.isInitiationStep(index)) return; // blocked — initiation is mandatory
    const updated = this.selectedStages()
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order_index: i }));
    this.selectedStages.set(updated);
  }

  onDrop(event: CdkDragDrop<StageEntry[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    // Prevent moving the initiation step or moving something before it
    if (event.previousIndex === 0 && this.isInitiationStep(0)) return;
    if (event.currentIndex === 0 && this.isInitiationStep(0)) return;
    const reordered = [...this.selectedStages()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.selectedStages.set(reordered.map((s, i) => ({ ...s, order_index: i })));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        this.translate.instant('workflows.errors.badRequest'),
      );
      return;
    }

    if (this.selectedStages().length === 0) {
      this.errorMessage.set('Selecione pelo menos uma etapa para o fluxo.');
      return;
    }

    // Validate: initiation step must be present as the first stage
    const firstStage = this.selectedStages()[0];
    if (!firstStage || firstStage.step_type !== 'initiation') {
      this.errorMessage.set(
        this.translate.instant('workflows.validation.initiationRequired')
      );
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const value = this.form.getRawValue();
    const id = this.flowId();

    if (id) {
      // Edit: update flow then save stages
      this.visualApi
        .updateVisualFlow(id, {
          name: value.name ?? '',
          description: value.description || undefined,
          status: (value.status as 'RASCUNHO' | 'ATIVO' | 'INATIVO') ?? 'RASCUNHO',
        })
        .subscribe({
          next: () => this.saveStagesAndNavigate(id),
          error: (err) => {
            this.saving.set(false);
            this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.saveFlowFailed'));
          },
        });
    } else {
      // Create: include stages in the initial create call
      const stages = this.selectedStages().map((s) => ({
        step_catalog_id: s.step_catalog_id,
        name: s.name,
        step_type: s.step_type,
        order_index: s.order_index,
        permissions: s.permissions,
      }));
      this.visualApi
        .createVisualFlow({
          name: value.name ?? '',
          description: value.description || undefined,
          document_type_id: value.document_type_id ?? '',
          stages,
        })
        .subscribe({
          next: (created) => {
            this.saving.set(false);
            this.router.navigate(['/intelligence/workflows/visual-bpms', created.id]);
          },
          error: (err) => {
            this.saving.set(false);
            this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.createFlowFailed'));
          },
        });
    }
  }

  private saveStagesAndNavigate(flowId: string): void {
    const stagePayload = this.selectedStages().map((s) => ({
      step_catalog_id: s.step_catalog_id,
      name: s.name,
      step_type: s.step_type,
      order_index: s.order_index,
      permissions: s.permissions,
    }));

    this.visualApi.saveStages(flowId, stagePayload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/intelligence/workflows/visual-bpms', flowId]);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.saveStagesFailed'));
      },
    });
  }

  goBack(): void {
    const id = this.flowId();
    if (id) {
      this.router.navigate(['/intelligence/workflows/visual-bpms', id]);
    } else {
      this.router.navigate(['/intelligence/workflows/visual-bpms']);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
