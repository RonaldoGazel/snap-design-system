import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { WorkflowApiBaseService } from '../../../workflows/services/workflow-api-base.service';

/**
 * Timeline entry from the workflow instance timeline endpoint.
 */
export interface TimelineEntry {
  id: string;
  stepId: string;
  actorId: string;
  actionPerformed: string;
  justification: string | null;
  feedback: Record<string, unknown> | null;
  previousState: string | null;
  newState: string | null;
  createdAt: string;
}

/**
 * Document status — aligned with backend's 9-state enum.
 */
export type DocumentStatus =
  | 'draft'
  | 'in_production'
  | 'in_review'
  | 'returned_for_adjustment'
  | 'awaiting_formalization'
  | 'formalized'
  | 'disseminated'
  | 'closed'
  | 'cancelled';

/**
 * Document response from document-service.
 */
export interface DocumentResponse {
  id: string;
  title: string;
  status: DocumentStatus;
  processId: string;
  responsibleId: string;
  sectorId: string;
  securityLevel: number;
  documentTypeId: string;
  workflowDefinitionId: string;
  workflowInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Access level: 'full' (active assignment) or 'tracking' (creator only). */
  accessLevel: string;
}

/**
 * Workflow instance response from workflow-service.
 */
export interface WorkflowInstanceResponse {
  id: string;
  organizationId: string;
  definitionId: string;
  definitionVersion: number;
  documentId: string;
  currentStepId: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignments: AssignmentResponse[];
}

export interface AssignmentResponse {
  id: string;
  stepId: string;
  sectionId: string;
  roleId: string;
  assignedUserId: string | null;
  sourceAssignmentId: string | null;
  sourceConnectionId: string | null;
  assignmentMode: string;
  status: string;
  createdAt: string;
}

/**
 * Available action from the available-actions endpoint.
 */
export interface AvailableAction {
  action: string;
  enabled: boolean;
  transitionId: string | null;
  targetStepId: string | null;
  requiresFeedback: boolean;
  reason: string | null;
  description: string;
}

export interface AvailableActionsResponse {
  actions: AvailableAction[];
  assignmentId: string | null;
  currentStepName: string;
  canClaim: boolean;
  isClaimedByCurrentUser: boolean;
  canEdit: boolean;
}

/**
 * Workflow definition step (for stepper rendering).
 */
export interface DefinitionStep {
  id: string;
  name: string;
  stepType: string;
  ordinal: number;
}

/**
 * Combined document view data — loaded in parallel from multiple services.
 */
export interface DocumentViewData {
  document: DocumentResponse;
  instance: WorkflowInstanceResponse | null;
  definitionSteps: DefinitionStep[];
  availableActions: AvailableActionsResponse | null;
}

export interface ActiveSessionEditor {
  user_id: string;
  user_name: string;
  since: string;
}

export interface ActiveSessionsResponse {
  document_id: string;
  has_active_editors: boolean;
  editors: ActiveSessionEditor[];
}

/**
 * Service for loading document view data from real backend services.
 *
 * Replaces the old DocumentStoreService (IndexedDB) and
 * WorkflowCapabilityService (client-side action resolution).
 *
 * Calls:
 *   - GET /api/v1/documents/{id}                          → document metadata
 *   - GET /api/v1/workflows/instances/{instanceId}        → workflow state
 *   - GET /api/v1/workflows/definitions/{definitionId}    → steps for stepper (cached)
 *   - GET /api/v1/workflows/instances/{instanceId}/available-actions → UI actions
 */
@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly api = inject(WorkflowApiBaseService);

  /** Cache for definition steps (immutable once published). */
  private definitionCache = new Map<string, DefinitionStep[]>();

  /**
   * Load all data needed for the document view in parallel.
   */
  loadDocumentView(documentId: string): Observable<DocumentViewData> {
    return this.api.documentGet<any>(`/${documentId}`).pipe(
      map((res) => {
        const raw = res.data;
        return {
          id: raw.id,
          title: raw.title,
          status: raw.status,
          processId: raw.process_id ?? raw.processId,
          responsibleId: raw.responsible_id ?? raw.responsibleId,
          sectorId: raw.sector_id ?? raw.sectorId,
          securityLevel: raw.security_level ?? raw.securityLevel,
          documentTypeId: raw.document_type_id ?? raw.documentTypeId,
          workflowDefinitionId: raw.workflow_definition_id ?? raw.workflowDefinitionId,
          workflowInstanceId: raw.workflow_instance_id ?? raw.workflowInstanceId,
          createdAt: raw.created_at ?? raw.createdAt,
          updatedAt: raw.updated_at ?? raw.updatedAt,
          accessLevel: raw.access_level ?? raw.accessLevel ?? 'full',
        } as DocumentResponse;
      }),
      switchMap((document) => {
        const calls: Record<string, Observable<any>> = {};

        if (document.workflowInstanceId) {
          calls['instance'] = this.api
            .workflowGet<any>(`/instances/${document.workflowInstanceId}`)
            .pipe(map((r) => {
              const raw = r.data;
              return {
                id: raw.id,
                organizationId: raw.organization_id ?? raw.organizationId,
                definitionId: raw.definition_id ?? raw.definitionId,
                definitionVersion: raw.definition_version ?? raw.definitionVersion,
                documentId: raw.document_id ?? raw.documentId,
                currentStepId: raw.current_step_id ?? raw.currentStepId ?? null,
                status: raw.status,
                priority: raw.priority,
                createdAt: raw.created_at ?? raw.createdAt,
                updatedAt: raw.updated_at ?? raw.updatedAt,
                assignments: (raw.assignments ?? []).map((a: any) => ({
                  id: a.id,
                  stepId: a.step_id ?? a.stepId,
                  sectionId: a.section_id ?? a.sectionId,
                  roleId: a.role_id ?? a.roleId,
                  assignedUserId: a.assigned_user_id ?? a.assignedUserId ?? null,
                  sourceAssignmentId: a.source_assignment_id ?? a.sourceAssignmentId ?? null,
                  sourceConnectionId: a.source_connection_id ?? a.sourceConnectionId ?? null,
                  assignmentMode: a.assignment_mode ?? a.assignmentMode,
                  status: a.status,
                  createdAt: a.created_at ?? a.createdAt,
                })),
              } as WorkflowInstanceResponse;
            }));

          calls['actions'] = this.api
            .workflowGet<any>(`/instances/${document.workflowInstanceId}/available-actions`)
            .pipe(map((r) => {
              const raw = r.data;
              return {
                actions: (raw?.actions ?? []).map((a: any) => ({
                  action: a.action,
                  enabled: a.enabled,
                  transitionId: a.transition_id ?? a.transitionId ?? null,
                  targetStepId: a.target_step_id ?? a.targetStepId ?? null,
                  requiresFeedback: a.requires_feedback ?? a.requiresFeedback ?? false,
                  reason: a.reason ?? null,
                  description: a.description ?? '',
                })),
                assignmentId: raw?.assignment_id ?? raw?.assignmentId ?? null,
                currentStepName: raw?.current_step_name ?? raw?.currentStepName ?? '',
                canClaim: raw?.can_claim ?? raw?.canClaim ?? false,
                isClaimedByCurrentUser: raw?.is_claimed_by_current_user ?? raw?.isClaimedByCurrentUser ?? false,
                canEdit: raw?.can_edit ?? raw?.canEdit ?? false,
              } as AvailableActionsResponse;
            }));
        }

        if (document.workflowDefinitionId) {
          const cached = this.definitionCache.get(document.workflowDefinitionId);
          if (cached) {
            calls['definition'] = of({ steps: cached });
          } else {
            calls['definition'] = this.api
              .workflowGet<any>(`/definitions/${document.workflowDefinitionId}`)
              .pipe(
                map((r) => {
                  const steps: DefinitionStep[] = (r.data?.steps ?? []).map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    stepType: s.step_type ?? s.stepType,
                    ordinal: s.ordinal,
                  }));
                  this.definitionCache.set(document.workflowDefinitionId, steps);
                  return { steps };
                }),
              );
          }
        }

        if (Object.keys(calls).length === 0) {
          return of<DocumentViewData>({
            document,
            instance: null,
            definitionSteps: [],
            availableActions: null,
          });
        }

        return forkJoin(calls).pipe(
          map((results: any) => ({
            document,
            instance: results['instance'] ?? null,
            definitionSteps: results['definition']?.steps ?? [],
            availableActions: results['actions'] ?? null,
          } as DocumentViewData)),
        );
      }),
    );
  }

  /**
   * Execute a workflow transition (advance, review, approve, formalize, etc.).
   */
  executeTransition(
    instanceId: string,
    targetStepId: string,
    justification?: string,
    feedback?: Record<string, unknown>,
  ): Observable<any> {
    const body: Record<string, unknown> = { target_step_id: targetStepId };
    if (justification) body['justification'] = justification;
    if (feedback) body['feedback'] = feedback;
    return this.api
      .workflowPost<any>(`/instances/${instanceId}/transition`, body)
      .pipe(map((r) => r.data));
  }

  /**
   * Execute a return transition (backward with required feedback).
   */
  executeReturn(
    instanceId: string,
    targetStepId: string,
    feedback: Record<string, unknown>,
  ): Observable<any> {
    return this.api
      .workflowPost<any>(`/instances/${instanceId}/return`, {
        target_step_id: targetStepId,
        feedback,
      })
      .pipe(map((r) => r.data));
  }

  /**
   * Cancel a workflow instance.
   */
  cancelInstance(instanceId: string, reason: string): Observable<any> {
    return this.api
      .workflowPost<any>(`/instances/${instanceId}/cancel`, { reason })
      .pipe(map((r) => r.data));
  }

  /**
   * Claim an assignment.
   */
  claimAssignment(instanceId: string, assignmentId: string): Observable<any> {
    return this.api
      .workflowPost<any>(`/assignments/${assignmentId}/claim`, {})
      .pipe(map((r) => r.data));
  }

  /**
   * Load the workflow timeline (history) for a given instance.
   */
  getTimeline(instanceId: string): Observable<TimelineEntry[]> {
    return this.api.workflowGet<any>(`/instances/${instanceId}/timeline`).pipe(
      map((r) => {
        const items = Array.isArray(r.data) ? r.data : [];
        return items.map((e: any) => ({
          id: e.id,
          stepId: e.step_id ?? e.stepId,
          actorId: e.actor_id ?? e.actorId,
          actionPerformed: e.action_performed ?? e.actionPerformed,
          justification: e.justification ?? null,
          feedback: e.feedback ?? null,
          previousState: e.previous_state ?? e.previousState ?? null,
          newState: e.new_state ?? e.newState ?? null,
          createdAt: e.created_at ?? e.createdAt,
        }));
      }),
    );
  }

  /**
   * Get the URL for the final artifact (formalized PDF) of a document.
   */
  getFinalArtifactUrl(documentId: string): string {
    return `/api/v1/documents/${documentId}/final-artifact`;
  }

  /**
   * Execute dissemination: create record + complete workflow in one call.
   */
  executeDissemination(
    instanceId: string,
    recipients: Array<Record<string, string>>,
    disseminationType: string,
    classification: string,
  ): Observable<any> {
    return this.api
      .workflowPost<any>(`/instances/${instanceId}/disseminate`, {
        recipients,
        dissemination_type: disseminationType,
        classification,
      })
      .pipe(map((r) => r.data));
  }

  /**
   * Check if there are active editing sessions for a document.
   * Used to warn before transitioning a document that someone is editing.
   */
  getActiveSessions(documentId: string): Observable<ActiveSessionsResponse> {
    return this.api.documentGet<ActiveSessionsResponse>(
      `/${documentId}/active-sessions`,
    ).pipe(map((r: any) => r.data ?? r));
  }
}
