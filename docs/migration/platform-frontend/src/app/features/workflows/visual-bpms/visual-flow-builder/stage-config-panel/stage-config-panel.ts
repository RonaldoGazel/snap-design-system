import { Component, computed, input, output, ChangeDetectionStrategy} from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { BpmsVisualFlowStage } from '../../../models/visual-bpms.model';
import { BpmsStepCatalog } from '../../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

const MIN_STAGES = 2;
const MAX_STAGES = 10;

@Component({
  selector: 'app-stage-config-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule, ButtonModule, TooltipModule,
    TranslateModule
  ],
  templateUrl: './stage-config-panel.html',
  styleUrl: './stage-config-panel.css',
})
export class StageConfigPanelComponent {
  // --- Inputs ---
  readonly stages = input.required<BpmsVisualFlowStage[]>();
  readonly catalogSteps = input.required<BpmsStepCatalog[]>();

  // --- Outputs ---
  readonly stageAdded = output<string>();
  readonly stageRemoved = output<string>();
  readonly stagesReordered = output<BpmsVisualFlowStage[]>();
  readonly stageSelected = output<BpmsVisualFlowStage>();

  // --- Computed ---
  readonly activeCatalogSteps = computed(() =>
    this.catalogSteps().filter((s) => s.is_active),
  );

  readonly addedStepIds = computed(() => new Set(this.stages().map((s) => s.step_catalog_id)));

  readonly canAddStage = computed(() => this.stages().length < MAX_STAGES);

  readonly stageCount = computed(() => this.stages().length);

  // --- Actions ---

  isStepAlreadyAdded(stepId: string): boolean {
    return this.addedStepIds().has(stepId);
  }

  isAddDisabled(stepId: string): boolean {
    return this.isStepAlreadyAdded(stepId) || !this.canAddStage();
  }

  addStage(stepCatalogId: string): void {
    if (!this.isAddDisabled(stepCatalogId)) {
      this.stageAdded.emit(stepCatalogId);
    }
  }

  removeStage(stageId: string): void {
    this.stageRemoved.emit(stageId);
  }

  selectStage(stage: BpmsVisualFlowStage): void {
    this.stageSelected.emit(stage);
  }

  hasProfilesOrConnections(stage: BpmsVisualFlowStage): boolean {
    return (stage.profiles?.length ?? 0) > 0;
  }

  onDrop(event: CdkDragDrop<BpmsVisualFlowStage[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const reordered = [...this.stages()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    // Update order_index
    const updated = reordered.map((stage, index) => ({
      ...stage,
      order_index: index,
    }));

    this.stagesReordered.emit(updated);
  }

  readonly MIN_STAGES = MIN_STAGES;
  readonly MAX_STAGES = MAX_STAGES;
}
