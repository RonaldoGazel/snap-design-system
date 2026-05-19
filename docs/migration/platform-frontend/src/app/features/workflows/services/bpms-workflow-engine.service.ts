import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BpmsApiService } from './bpms-api.service';
import {
  BpmsDocumentInstance,
  BpmsFlowTransition,
  BpmsFlowVersion,
  UnitProfileCombo,
  TransitionPayload,
  DisseminationTarget,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../models/bpms.model';
import { StepType } from '../models/bpms.enums';

/**
 * Workflow engine service — delegates ALL authorization and transition logic
 * to the backend. The frontend is a consumption layer only.
 *
 * Authorization enforcement happens server-side:
 * - Available transitions: GET /instances/{id}/transitions
 * - Execute transition: POST /instances/{id}/transition (3-layer check)
 * - Formalization: POST /instances/{id}/formalize
 * - Dissemination: POST /instances/{id}/disseminate
 *
 * This service provides:
 * - Backend-delegated queries for available actions (transitions, formalize, disseminate)
 * - Flow definition validation for the admin UI (structural checks only, no auth)
 *
 * Per product constraints: "the frontend is a consumption layer only —
 * no critical security/auth logic in the UI."
 */
@Injectable({ providedIn: 'root' })
export class BpmsWorkflowEngineService {
  private readonly api = inject(BpmsApiService);

  /**
   * Get available transitions from the backend.
   * The backend evaluates structural validity, flow matrix, guards,
   * step capabilities, and ABAC permissions — returning only transitions
   * the current user is actually allowed to execute.
   */
  getAvailableTransitions$(instanceId: string): Observable<BpmsFlowTransition[]> {
    return this.api.getAvailableTransitions(instanceId);
  }

  /**
   * Execute a transition via the backend.
   * The backend performs the full 3-layer authorization check.
   * Returns the updated instance on success, throws on 403/400.
   */
  executeTransition$(
    instanceId: string,
    transitionId: string,
    actor: UnitProfileCombo,
    payload?: TransitionPayload,
  ): Observable<BpmsDocumentInstance> {
    return this.api.executeTransition(instanceId, {
      transition_id: transitionId,
      actor_unit_id: actor.unit_id,
      actor_profile_id: actor.profile_id,
      ...(payload ?? {}),
    });
  }

  /**
   * Formalize a document via the backend.
   * The backend checks formalization permissions and step type.
   */
  formalize$(
    instanceId: string,
    actor: UnitProfileCombo,
  ): Observable<BpmsDocumentInstance> {
    return this.api.formalizeDocument(instanceId, {
      actor_unit_id: actor.unit_id,
      actor_profile_id: actor.profile_id,
    });
  }

  /**
   * Disseminate a document via the backend.
   * The backend checks dissemination permissions and OTP step-up.
   */
  disseminate$(
    instanceId: string,
    targets: DisseminationTarget[],
    actor: UnitProfileCombo,
    type: 'INTERNAL' | 'EXTERNAL',
  ): Observable<BpmsDocumentInstance> {
    return this.api.disseminateDocument(instanceId, {
      type,
      targets,
      actor_unit_id: actor.unit_id,
      actor_profile_id: actor.profile_id,
    });
  }

  // -----------------------------------------------------------------------
  // Flow definition validation (admin UI — structural checks only, no auth)
  // -----------------------------------------------------------------------

  /**
   * Validate all rules in a flow version for structural consistency.
   * This is used in the flow designer admin UI to catch configuration errors
   * before publishing. It does NOT evaluate runtime permissions.
   */
  validateRules(flowVersion: BpmsFlowVersion): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const steps = flowVersion.steps ?? [];
    const transitions = flowVersion.transitions ?? [];

    // Check for initial step
    const hasInitial = steps.some(
      (s) => s.order_index === 0 || s.type === StepType.PRODUCTION,
    );
    if (!hasInitial) {
      errors.push({ code: 'NO_INITIAL_STEP', message: 'Fluxo sem etapa inicial definida' });
    }

    // Check for final step
    const hasFinal = steps.some((s) => s.type === StepType.TERMINAL);
    if (!hasFinal) {
      errors.push({ code: 'NO_FINAL_STEP', message: 'Fluxo sem etapa final definida' });
    }

    // Check for orphan steps (no outgoing transitions, not final)
    const fromIds = new Set(transitions.map((t) => t.from_step_id));
    for (const step of steps) {
      if (step.type !== StepType.TERMINAL && !fromIds.has(step.id)) {
        warnings.push({
          code: 'ORPHAN_STEP',
          message: `Etapa "${step.name}" não possui transições de saída`,
          entity: 'step',
          entity_id: step.id,
        });
      }
    }

    // Check for dead-end transitions
    const stepIds = new Set(steps.map((s) => s.id));
    for (const t of transitions) {
      if (!stepIds.has(t.to_step_id)) {
        errors.push({
          code: 'DEAD_END_TRANSITION',
          message: `Transição "${t.name}" aponta para etapa inexistente`,
          entity: 'transition',
          entity_id: t.id,
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
