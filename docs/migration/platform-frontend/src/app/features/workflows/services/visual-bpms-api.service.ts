import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkflowApiBaseService } from './workflow-api-base.service';
import {
  BpmsVisualFlow,
  BpmsVisualFlowStage,
  BpmsVisualFlowStageProfile,
  BpmsVisualFlowConnection,
  FlowVersionSummary,
} from '../models/visual-bpms.model';

/**
 * Visual BPMS API service.
 *
 * The visual builder operates on WorkflowDefinitions (not a separate entity).
 * "Visual flows" = workflow definitions viewed through the visual builder lens.
 *
 * Mapping to real endpoints:
 *   GET  /definitions                              → list visual flows
 *   POST /definitions                              → create visual flow
 *   GET  /definitions/{id}                         → get visual flow (with profiles + connections)
 *   PUT  /definitions/{id}                         → update visual flow metadata
 *   PUT  /definitions/{id}/steps/{stepId}/assignment-rules → save step assignment rules
 *   PUT  /definitions/{id}/connections             → save connections
 *   GET  /definitions/{id}/versions                → list versions
 *   POST /definitions/{id}/publish                 → activate (publish)
 *
 * The adapter maps the backend WorkflowDefinitionResponse shape into the
 * frontend BpmsVisualFlow shape that the visual builder components expect.
 */
/** Payload for creating/saving stages — includes name, step_type, and permissions from the catalog. */
interface StagePayload {
  step_catalog_id: string;
  order_index: number;
  name: string;
  step_type: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class VisualBpmsApiService {
  private readonly api = inject(WorkflowApiBaseService);

  // --- Visual Flows (= Workflow Definitions) ---

  getVisualFlows(): Observable<BpmsVisualFlow[]> {
    return this.api
      .workflowGet<{ items: any[] }>('/definitions')
      .pipe(map((r) => ((r.data as any)?.items ?? []).map(this.mapDefinitionToVisualFlow)));
  }

  getVisualFlow(id: string): Observable<BpmsVisualFlow> {
    return this.api
      .workflowGet<any>(`/definitions/${id}`)
      .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
  }

  createVisualFlow(data: { name?: string; description?: string; document_type_id?: string; stages?: StagePayload[] }): Observable<BpmsVisualFlow> {
    const steps = (data.stages ?? []).map((s: StagePayload) => ({
      name: s.name,
      step_type: s.step_type,
      ordinal: s.order_index,
      assignment_mode: 'direct_assignment',
      capabilities: (s.permissions ?? []).map((p: string) => ({ capability: p })),
      assignment_rules: [],
    }));
    const body = {
      name: data.name,
      document_type: data.document_type_id ?? 'default',
      metadata: { description: data.description, document_type_id: data.document_type_id },
      steps,
    };
    return this.api
      .workflowPost<any>('/definitions', body)
      .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
  }

  updateVisualFlow(id: string, data: Partial<BpmsVisualFlow>): Observable<BpmsVisualFlow> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body['name'] = data.name;
    if (data.description !== undefined) {
      body['metadata'] = { description: data.description };
    }
    // Status mapping: ATIVO → publish, INATIVO → archive
    if (data.status === 'ATIVO') {
      return this.api
        .workflowPost<any>(`/definitions/${id}/publish`, {})
        .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
    }
    return this.api
      .workflowPut<any>(`/definitions/${id}`, body)
      .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
  }

  // --- Step Assignment Rules (visual builder "profiles") ---

  saveStageProfiles(
    flowId: string,
    stageId: string,
    profiles: Array<{
      unit_profile_id: string;
      permissions?: string[];
      permissions_customized?: boolean;
      order_index?: number;
    }>,
  ): Observable<BpmsVisualFlowStageProfile[]> {
    // Split unit_profile_id ("section_id__role_id") into separate fields for the backend
    const rules = profiles.map((p) => {
      const parts = p.unit_profile_id.split('__');
      return {
        section_id: parts[0],
        role_id: parts[1] ?? parts[0],
        permissions: p.permissions ?? [],
        permissions_customized: p.permissions_customized ?? false,
        order_index: p.order_index ?? 0,
      };
    });
    return this.api
      .workflowPut<any[]>(`/definitions/${flowId}/steps/${stageId}/assignment-rules`, { rules })
      .pipe(
        map((r) =>
          (r.data ?? []).map((rule: any) => ({
            id: rule.id,
            visual_flow_stage_id: stageId,
            // Reconstruct unit_profile_id from section_id + role_id for frontend compat
            unit_profile_id: `${rule.section_id}__${rule.role_id}`,
            permissions: rule.permissions ?? [],
            permissions_customized: rule.permissions_customized ?? false,
            order_index: rule.order_index ?? 0,
            created_at: rule.created_at,
          })),
        ),
      );
  }

  // --- Connections ---

  saveConnections(
    flowId: string,
    connections: Array<{
      source_stage_profile_id: string;
      target_stage_profile_id: string;
      connection_type: string;
    }>,
  ): Observable<BpmsVisualFlowConnection[]> {
    // Map frontend field names to backend field names (rule_id, not profile_id)
    const mapped = connections.map((c) => ({
      source_rule_id: c.source_stage_profile_id,
      target_rule_id: c.target_stage_profile_id,
      connection_type: c.connection_type,
    }));
    return this.api
      .workflowPut<any[]>(`/definitions/${flowId}/connections`, { connections: mapped })
      .pipe(
        map((r) =>
          (r.data ?? []).map((c: any) => ({
            ...c,
            visual_flow_id: flowId,
            // Map backend field names back to frontend names
            source_stage_profile_id: c.source_rule_id,
            target_stage_profile_id: c.target_rule_id,
          })),
        ),
      );
  }

  // --- Versioning ---

  getFlowVersions(flowId: string): Observable<FlowVersionSummary[]> {
    return this.api
      .workflowGet<any[]>(`/definitions/${flowId}/versions`)
      .pipe(
        map((r) =>
          (r.data ?? []).map((v: any) => ({
            id: v.id,
            version: v.version,
            status: this.mapStatusToVisual(v.status),
            created_at: v.created_at,
            updated_at: v.updated_at,
          })),
        ),
      );
  }

  createBlankVersion(flowId: string): Observable<BpmsVisualFlow> {
    // Create a new version via the definitions API
    return this.api
      .workflowPost<any>(`/definitions/${flowId}/versions`, { summary: 'blank' })
      .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
  }

  duplicateVersion(flowId: string): Observable<BpmsVisualFlow> {
    return this.api
      .workflowPost<any>(`/definitions/${flowId}/versions`, { summary: 'duplicate' })
      .pipe(map((r) => this.mapDefinitionToVisualFlow(r.data)));
  }

  // --- Stages (save stages = update definition steps) ---

  saveStages(
    flowId: string,
    stages: StagePayload[],
  ): Observable<BpmsVisualFlowStage[]> {
    const steps = stages.map((s: StagePayload) => ({
      name: s.name,
      step_type: s.step_type,
      ordinal: s.order_index,
      assignment_mode: 'direct_assignment',
      capabilities: (s.permissions ?? []).map((p: string) => ({ capability: p })),
    }));
    return this.api
      .workflowPut<any>(`/definitions/${flowId}/steps`, { steps })
      .pipe(
        map((r) => {
          const def = r.data;
          return (def?.steps ?? []).map((step: any) => ({
            id: step.id,
            visual_flow_id: flowId,
            step_catalog_id: step.name,
            order_index: step.ordinal,
            created_at: step.created_at,
            profiles: (step.assignment_rules ?? []).map((r: any) => ({
              ...r,
              visual_flow_stage_id: step.id,
              unit_profile_id: `${r.section_id}__${r.role_id}`,
            })),
          }));
        }),
      );
  }

  // ---------------------------------------------------------------------------
  // Adapter: WorkflowDefinitionResponse → BpmsVisualFlow
  // ---------------------------------------------------------------------------

  private mapDefinitionToVisualFlow = (def: any): BpmsVisualFlow => {
    if (!def) return def;
    return {
      id: def.id,
      name: def.name,
      description: def.metadata?.description ?? '',
      template_id: def.metadata?.document_type_id ?? def.document_type,
      document_type_id: def.metadata?.document_type_id ?? def.document_type,
      status: this.mapStatusToVisual(def.status),
      created_by: '',
      created_at: def.created_at,
      updated_at: def.updated_at,
      version: def.version,
      parent_flow_id: null,
      stages: (def.steps ?? []).map((step: any) => ({
        id: step.id,
        visual_flow_id: def.id,
        step_catalog_id: step.name,
        order_index: step.ordinal,
        created_at: step.created_at,
        step_catalog: undefined, // Resolved client-side from catalog
        profiles: (step.assignment_rules ?? []).map((r: any) => ({
          id: r.id,
          visual_flow_stage_id: step.id,
          // Reconstruct unit_profile_id from section_id + role_id for frontend compat
          unit_profile_id: `${r.section_id}__${r.role_id}`,
          permissions: r.permissions ?? [],
          permissions_customized: r.permissions_customized ?? false,
          order_index: r.order_index ?? 0,
          created_at: r.created_at,
        })),
      })),
      connections: (def.profile_connections ?? []).map((c: any) => ({
        id: c.id,
        visual_flow_id: def.id,
        source_stage_profile_id: c.source_rule_id,
        target_stage_profile_id: c.target_rule_id,
        connection_type: c.connection_type,
        created_at: c.created_at,
      })),
    };
  };

  private mapStatusToVisual(backendStatus: string): 'RASCUNHO' | 'ATIVO' | 'INATIVO' {
    // The visual-bpms model still uses Portuguese status strings internally.
    // These are mapped from the backend's English values.
    switch (backendStatus) {
      case 'draft':
        return 'RASCUNHO';
      case 'published':
        return 'ATIVO';
      case 'archived':
        return 'INATIVO';
      default:
        return backendStatus as 'RASCUNHO';
    }
  }
}
