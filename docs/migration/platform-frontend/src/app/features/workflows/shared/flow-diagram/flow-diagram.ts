import { Component, computed, input, ChangeDetectionStrategy} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { BpmsFlowStep, BpmsFlowTransition } from '../../models/bpms.model';
import { StepType } from '../../models/bpms.enums';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-diagram',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagModule,
    TranslateModule
  ],
  templateUrl: './flow-diagram.html',
  styleUrl: './flow-diagram.css',
})
export class FlowDiagramComponent {
  readonly steps = input<BpmsFlowStep[]>([]);
  readonly transitions = input<BpmsFlowTransition[]>([]);
  readonly currentStepId = input<string | undefined>(undefined);
  readonly orphanStepIds = input<string[]>([]);
  readonly deadEndTransitionIds = input<string[]>([]);

  readonly sortedSteps = computed(() =>
    [...this.steps()].sort((a, b) => a.order_index - b.order_index)
  );

  getStepIcon(type: StepType): string {
    const icons: Record<StepType, string> = {
      [StepType.INITIATION]: 'pi pi-sign-in',
      [StepType.PRODUCTION]: 'pi pi-pencil',
      [StepType.REVIEW]: 'pi pi-eye',
      [StepType.APPROVAL]: 'pi pi-thumbs-up',
      [StepType.FORMALIZATION]: 'pi pi-check-circle',
      [StepType.DISPATCH]: 'pi pi-directions',
      [StepType.INTERNAL_DISSEMINATION]: 'pi pi-send',
      [StepType.EXTERNAL_DISSEMINATION]: 'pi pi-external-link',
      [StepType.OPERATIONAL_TASK]: 'pi pi-cog',
      [StepType.TERMINAL]: 'pi pi-flag',
    };
    return icons[type] ?? 'pi pi-circle';
  }

  getStepLabel(type: StepType): string {
    const labels: Record<StepType, string> = {
      [StepType.INITIATION]: 'workflows.stepType.initiation',
      [StepType.PRODUCTION]: 'workflows.stepType.production',
      [StepType.REVIEW]: 'workflows.stepType.review',
      [StepType.APPROVAL]: 'workflows.stepType.approval',
      [StepType.FORMALIZATION]: 'workflows.stepType.formalization',
      [StepType.DISPATCH]: 'workflows.stepType.dispatch',
      [StepType.INTERNAL_DISSEMINATION]: 'workflows.stepType.internal_dissemination',
      [StepType.EXTERNAL_DISSEMINATION]: 'workflows.stepType.external_dissemination',
      [StepType.OPERATIONAL_TASK]: 'workflows.stepType.operational_task',
      [StepType.TERMINAL]: 'workflows.stepType.terminal',
    };
    return labels[type] ?? type;
  }

  isCurrentStep(stepId: string): boolean {
    return this.currentStepId() === stepId;
  }

  isOrphan(stepId: string): boolean {
    return this.orphanStepIds().includes(stepId);
  }

  getTransitionsFrom(stepId: string): BpmsFlowTransition[] {
    return this.transitions().filter(t => t.from_step_id === stepId);
  }

  getStepById(stepId: string): BpmsFlowStep | undefined {
    return this.steps().find(s => s.id === stepId);
  }
}
