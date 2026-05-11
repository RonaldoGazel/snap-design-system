import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/**
 * A single step in the workflow stepper.
 * Mirrors the denormalized shape stored in LocalDocument.workflowSteps,
 * enriched with capabilities for CTA resolution.
 */
export interface WorkflowStepItem {
  id: string;
  name: string;
  ordinal: number;
  /** Step capabilities (e.g., PRODUCE, REVIEW, FORMALIZE). */
  capabilities?: string[];
}

export type StepState = 'completed' | 'current' | 'returned' | 'upcoming';

/**
 * Read-only workflow stepper that visualizes the document's position
 * within its bound workflow.
 *
 * - Shows ALL steps to every user (for context).
 * - Highlights the current step, marks completed steps, and dims future steps.
 * - When the document is returned to a previous step, the "furthest reached"
 *   step is marked with a special "returned" indicator so the backward move
 *   is visible.
 *
 * Usage:
 * ```html
 * <app-workflow-stepper
 *   [steps]="doc.workflowSteps"
 *   [currentStepId]="doc.currentStepId"
 *   [furthestStepOrdinal]="doc.furthestStepOrdinal" />
 * ```
 */
@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipModule],
  templateUrl: './workflow-stepper.html',
  styleUrl: './workflow-stepper.css',
})
export class WorkflowStepperComponent {
  /** Ordered workflow steps. */
  readonly steps = input.required<WorkflowStepItem[]>();

  /** ID of the step the document is currently at. */
  readonly currentStepId = input.required<string>();

  /**
   * The highest ordinal the document has ever reached.
   * Used to detect backward moves (returns).
   * If not provided, defaults to the current step's ordinal.
   */
  readonly furthestStepOrdinal = input<number | undefined>(undefined);

  /** Resolved state for each step. */
  readonly stepStates = computed<Array<{ step: WorkflowStepItem; state: StepState }>>(() => {
    const allSteps = this.steps();
    const currentId = this.currentStepId();
    const currentStep = allSteps.find((s) => s.id === currentId);
    const currentOrdinal = currentStep?.ordinal ?? 0;
    const furthest = this.furthestStepOrdinal() ?? currentOrdinal;

    return allSteps.map((step) => {
      let state: StepState;

      if (step.id === currentId) {
        state = 'current';
      } else if (step.ordinal < currentOrdinal) {
        state = 'completed';
      } else if (step.ordinal <= furthest && step.ordinal > currentOrdinal) {
        // Step was reached before but document was returned — mark as "returned"
        state = 'returned';
      } else {
        state = 'upcoming';
      }

      return { step, state };
    });
  });

  /** Progress percentage for the connector bar. */
  readonly progressPercent = computed(() => {
    const allSteps = this.steps();
    if (allSteps.length <= 1) return 100;
    const currentId = this.currentStepId();
    const currentIdx = allSteps.findIndex((s) => s.id === currentId);
    if (currentIdx < 0) return 0;
    return Math.round((currentIdx / (allSteps.length - 1)) * 100);
  });
}
