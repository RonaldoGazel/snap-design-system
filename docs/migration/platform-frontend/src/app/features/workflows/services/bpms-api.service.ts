import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { WorkflowApiBaseService } from './workflow-api-base.service';
import { SectionService } from '../../iam/services/section.service';
import { RoleService } from '../../iam/services/role.service';
import { ActiveOrgService } from '../../iam/services/active-org.service';
import {
  BpmsOrgUnit,
  BpmsProfile,
  BpmsUnitProfile,
  BpmsDocumentType,
  BpmsTemplate,
  BpmsFlow,
  BpmsFlowVersion,
  BpmsFlowStep,
  BpmsFlowTransition,
  BpmsFlowRole,
  BpmsFlowRule,
  BpmsProcess,
  BpmsDocumentInstance,
  BpmsPendingTask,
  BpmsStepCatalog,
  BpmsRoleCatalog,
} from '../models/bpms.model';

/**
 * BPMS API service — routes calls to the correct backend services.
 *
 * Mapping:
 *   Workflow definitions, instances, work queue → workflow-service (/api/v1/workflows/...)
 *   Documents, processes, templates            → document-service (/api/v1/documents|processes|templates/...)
 *   Org units (sections)                       → identity-service via SectionService
 *   Profiles (roles)                           → permission-service via RoleService
 *   Step catalog, role catalog, visual flows   → workflow-service (endpoints TBD)
 *
 * Endpoints marked with "⚠️ STUB" don't exist yet in the real backends.
 */
@Injectable({ providedIn: 'root' })
export class BpmsApiService {
  private readonly api = inject(WorkflowApiBaseService);
  private readonly sectionService = inject(SectionService);
  private readonly roleService = inject(RoleService);
  private readonly activeOrg = inject(ActiveOrgService);

  // ---------------------------------------------------------------------------
  // Org Structure → identity-service (sections = org units)
  // Uses the existing SectionService from the IAM feature.
  // ---------------------------------------------------------------------------

  getOrgUnits(): Observable<BpmsOrgUnit[]> {
    const orgId = this.activeOrg.activeOrganizationId();
    if (!orgId) {
      return of([]);
    }

    return this.sectionService.listSections(orgId, { limit: 500, offset: 0 }).pipe(
      map((response) =>
        response.items.map((s) => ({
          id: s.id,
          name: s.name,
          acronym: s.name,
          parent_id: s.parent_section_id ?? undefined,
          level: 0,
          is_active: true,
          created_at: s.created_at,
          updated_at: s.updated_at,
        })),
      ),
    );
  }

  getProfiles(): Observable<BpmsProfile[]> {
    return this.roleService.listRoles({ limit: 500, offset: 0 }).pipe(
      map((response) =>
        response.items.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.name.toUpperCase().replace(/\s+/g, '_'),
          hierarchy_level: 0,
          is_active: true,
        })),
      ),
    );
  }

  /**
   * Unit-profiles: section-role associations.
   *
   * The real platform doesn't have a direct section→role mapping table.
   * Instead, roles are assigned to users who belong to sections.
   * For the visual BPMS builder, we synthesize unit-profile combos by
   * cross-referencing sections with roles.
   *
   * ⚠️ This is a simplified approach. A proper implementation would need
   * a dedicated endpoint in workflow-service that stores visual flow
   * stage-profile assignments.
   */
  getUnitProfiles(unitId?: string): Observable<BpmsUnitProfile[]> {
    return forkJoin({
      units: this.getOrgUnits(),
      profiles: this.getProfiles(),
    }).pipe(
      map(({ units, profiles }) => {
        const filteredUnits = unitId ? units.filter((u) => u.id === unitId) : units;
        const combos: BpmsUnitProfile[] = [];
        let order = 0;
        for (const unit of filteredUnits) {
          for (const profile of profiles) {
            combos.push({
              id: `${unit.id}__${profile.id}`,
              unit_id: unit.id,
              profile_id: profile.id,
              hierarchy_order: order++,
              is_active: true,
              unit: unit,
              profile: profile,
            });
          }
        }
        return combos;
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Document Types → ⚠️ STUB (no backend endpoint yet)
  // These could live in document-service or workflow-service.
  // For now, routing to workflow-service.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Document Types → document-service (/api/v1/document-types)
  // ---------------------------------------------------------------------------

  getDocumentTypes(): Observable<BpmsDocumentType[]> {
    return this.api
      .documentTypeGet<any>('')
      .pipe(
        map((r) => {
          const body = r.data as any;
          const items = body?.items ?? body ?? [];
          return Array.isArray(items) ? items : [];
        }),
      );
  }

  createDocumentType(data: Partial<BpmsDocumentType>): Observable<BpmsDocumentType> {
    return this.api
      .documentTypePost<BpmsDocumentType>('', data)
      .pipe(map((r) => r.data!));
  }

  updateDocumentType(id: string, data: Partial<BpmsDocumentType>): Observable<BpmsDocumentType> {
    return this.api
      .documentTypePut<BpmsDocumentType>(`/${id}`, data)
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Templates → document-service (/api/v1/templates)
  // ---------------------------------------------------------------------------

  getTemplates(): Observable<BpmsTemplate[]> {
    return this.api.templateGet<any>('').pipe(
      map((r) => {
        const body = r.data as any;
        const items = body?.items ?? body ?? [];
        return (Array.isArray(items) ? items : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? '',
          version: t.version ?? 1,
          has_file: t.has_file ?? t.has_docx ?? false,
          has_preview: t.has_preview ?? false,
          original_filename: t.original_filename,
          mandatory_metadata: t.mandatory_metadata,
          status: t.status ?? 'active',
          is_active: t.status === 'active',
          // Legacy compat fields
          has_docx: t.has_file ?? t.has_docx ?? false,
          code: t.name,
          full_name: t.name,
        }));
      }),
    );
  }

  createTemplate(data: Partial<BpmsTemplate>): Observable<BpmsTemplate> {
    return this.api.templatePost<BpmsTemplate>('', data).pipe(map((r) => r.data!));
  }

  updateTemplate(id: string, data: Partial<BpmsTemplate>): Observable<BpmsTemplate> {
    return this.api
      .templatePut<BpmsTemplate>(`/${id}`, data)
      .pipe(map((r) => r.data!));
  }

  uploadTemplateDocx(templateId: string, file: File): Observable<BpmsTemplate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api
      .templatePost<BpmsTemplate>(`/${templateId}/upload`, formData)
      .pipe(map((r) => r.data!));
  }

  /**
   * Create a Collabora editing session for a template.
   * Returns the Collabora iframe URL and a WOPI access token.
   */
  createEditSession(
    templateId: string,
  ): Observable<{
    editor_url: string;
    access_token: string;
    access_token_ttl: number;
    template_id: string;
    filename: string;
  }> {
    return this.api
      .templatePost<{
        editor_url: string;
        access_token: string;
        access_token_ttl: number;
        template_id: string;
        filename: string;
      }>(`/${templateId}/edit-session`, {})
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Workflow Definitions → workflow-service (/api/v1/workflows/definitions)
  // ---------------------------------------------------------------------------

  getFlows(): Observable<BpmsFlow[]> {
    return this.api
      .workflowGet<{ items: BpmsFlow[] }>('/definitions')
      .pipe(map((r) => (r.data as any)?.items ?? r.data ?? []));
  }

  getFlow(id: string): Observable<BpmsFlow> {
    return this.api.workflowGet<BpmsFlow>(`/definitions/${id}`).pipe(map((r) => r.data!));
  }

  createFlow(
    data: Partial<BpmsFlow> & { document_type_ids?: string[] },
  ): Observable<BpmsFlow> {
    return this.api.workflowPost<BpmsFlow>('/definitions', data).pipe(map((r) => r.data!));
  }

  updateFlow(
    id: string,
    data: Partial<BpmsFlow> & { document_type_ids?: string[] },
  ): Observable<BpmsFlow> {
    return this.api.workflowPut<BpmsFlow>(`/definitions/${id}`, data).pipe(map((r) => r.data!));
  }

  /** ⚠️ STUB — workflow-service doesn't have a duplicate endpoint */
  duplicateFlow(id: string): Observable<BpmsFlow> {
    return this.api
      .workflowPost<BpmsFlow>(`/definitions/${id}/duplicate`, {})
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Flow Versions → workflow-service
  // ---------------------------------------------------------------------------

  getFlowVersions(flowId: string): Observable<BpmsFlowVersion[]> {
    return this.api
      .workflowGet<BpmsFlowVersion[]>(`/definitions/${flowId}/versions`)
      .pipe(map((r) => r.data ?? []));
  }

  createFlowVersion(flowId: string, data?: { summary?: string }): Observable<BpmsFlowVersion> {
    return this.api
      .workflowPost<BpmsFlowVersion>(`/definitions/${flowId}/versions`, data ?? {})
      .pipe(map((r) => r.data!));
  }

  publishFlowVersion(definitionId: string): Observable<BpmsFlowVersion> {
    // Real API: POST /definitions/{id}/publish (not PUT /versions/{id}/publish)
    return this.api
      .workflowPost<BpmsFlowVersion>(`/definitions/${definitionId}/publish`, {})
      .pipe(map((r) => r.data!));
  }

  /** ⚠️ STUB — workflow-service doesn't have a deactivate endpoint */
  deactivateFlowVersion(definitionId: string): Observable<BpmsFlowVersion> {
    return this.api
      .workflowPost<BpmsFlowVersion>(`/definitions/${definitionId}/deactivate`, {})
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Steps — embedded in definition response, no separate endpoints in real API
  // ⚠️ STUB — these would need new endpoints or the definition update must
  // include steps in the request body.
  // ---------------------------------------------------------------------------

  getFlowSteps(versionId: string): Observable<BpmsFlowStep[]> {
    return this.api
      .workflowGet<BpmsFlowStep[]>(`/definitions/${versionId}/steps`)
      .pipe(map((r) => r.data ?? []));
  }

  saveFlowSteps(versionId: string, steps: Partial<BpmsFlowStep>[]): Observable<BpmsFlowStep[]> {
    return this.api
      .workflowPut<BpmsFlowStep[]>(`/definitions/${versionId}/steps`, { steps })
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------------------
  // Transitions — same situation as steps
  // ---------------------------------------------------------------------------

  getFlowTransitions(versionId: string): Observable<BpmsFlowTransition[]> {
    return this.api
      .workflowGet<BpmsFlowTransition[]>(`/definitions/${versionId}/transitions`)
      .pipe(map((r) => r.data ?? []));
  }

  saveFlowTransitions(
    versionId: string,
    transitions: Partial<BpmsFlowTransition>[],
  ): Observable<BpmsFlowTransition[]> {
    return this.api
      .workflowPut<BpmsFlowTransition[]>(`/definitions/${versionId}/transitions`, { transitions })
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------------------
  // Roles — same situation as steps
  // ---------------------------------------------------------------------------

  getFlowRoles(versionId: string): Observable<BpmsFlowRole[]> {
    return this.api
      .workflowGet<BpmsFlowRole[]>(`/definitions/${versionId}/roles`)
      .pipe(map((r) => r.data ?? []));
  }

  saveFlowRoles(
    versionId: string,
    roles: Partial<BpmsFlowRole>[],
  ): Observable<BpmsFlowRole[]> {
    return this.api
      .workflowPut<BpmsFlowRole[]>(`/definitions/${versionId}/roles`, { roles })
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------------------
  // Rules — same situation as steps
  // ---------------------------------------------------------------------------

  getFlowRules(versionId: string): Observable<BpmsFlowRule[]> {
    return this.api
      .workflowGet<BpmsFlowRule[]>(`/definitions/${versionId}/rules`)
      .pipe(map((r) => r.data ?? []));
  }

  saveFlowRules(
    versionId: string,
    rules: Partial<BpmsFlowRule>[],
  ): Observable<BpmsFlowRule[]> {
    return this.api
      .workflowPut<BpmsFlowRule[]>(`/definitions/${versionId}/rules`, { rules })
      .pipe(map((r) => r.data ?? []));
  }

  // ---------------------------------------------------------------------------
  // Processes → document-service (/api/v1/processes)
  // ---------------------------------------------------------------------------

  getProcesses(filters?: Record<string, string>): Observable<BpmsProcess[]> {
    const options = filters
      ? { params: new HttpParams({ fromObject: filters }) }
      : undefined;
    return this.api
      .processGet<{ items: BpmsProcess[] } | BpmsProcess[]>('', options)
      .pipe(map((r) => {
        const data = r.data;
        if (data && 'items' in (data as any)) return (data as any).items;
        return (data as BpmsProcess[]) ?? [];
      }));
  }

  createProcess(data: Partial<BpmsProcess>): Observable<BpmsProcess> {
    return this.api.processPost<BpmsProcess>('', data).pipe(map((r) => r.data!));
  }

  getProcess(id: string): Observable<BpmsProcess> {
    return this.api.processGet<BpmsProcess>(`/${id}`).pipe(map((r) => r.data!));
  }

  updateProcess(id: string, data: Partial<BpmsProcess>): Observable<BpmsProcess> {
    return this.api.processPut<BpmsProcess>(`/${id}`, data).pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Workflow Instances → workflow-service (/api/v1/workflows/instances)
  // ---------------------------------------------------------------------------

  getDocumentInstances(filters?: Record<string, string>): Observable<BpmsDocumentInstance[]> {
    const options = filters
      ? { params: new HttpParams({ fromObject: filters }) }
      : undefined;
    return this.api
      .workflowGet<{ items: BpmsDocumentInstance[] } | BpmsDocumentInstance[]>('/instances', options)
      .pipe(map((r) => {
        const data = r.data;
        if (data && 'items' in (data as any)) return (data as any).items;
        return (data as BpmsDocumentInstance[]) ?? [];
      }));
  }

  createDocumentInstance(data: Partial<BpmsDocumentInstance>): Observable<BpmsDocumentInstance> {
    return this.api
      .workflowPost<BpmsDocumentInstance>('/instances', data)
      .pipe(map((r) => r.data!));
  }

  getDocumentInstance(id: string): Observable<BpmsDocumentInstance> {
    return this.api
      .workflowGet<BpmsDocumentInstance>(`/instances/${id}`)
      .pipe(map((r) => r.data!));
  }

  updateDocumentInstance(
    id: string,
    data: Partial<BpmsDocumentInstance>,
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .workflowPut<BpmsDocumentInstance>(`/instances/${id}`, data)
      .pipe(map((r) => r.data!));
  }

  getAvailableTransitions(instanceId: string): Observable<BpmsFlowTransition[]> {
    return this.api
      .workflowGet<BpmsFlowTransition[]>(`/instances/${instanceId}/transitions`)
      .pipe(map((r) => r.data ?? []));
  }

  executeTransition(
    instanceId: string,
    data: Record<string, unknown>,
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .workflowPost<BpmsDocumentInstance>(`/instances/${instanceId}/transition`, data)
      .pipe(map((r) => r.data!));
  }

  formalizeDocument(
    instanceId: string,
    data: Record<string, unknown>,
  ): Observable<BpmsDocumentInstance> {
    // Formalization goes to document-service
    return this.api
      .documentPut<BpmsDocumentInstance>(`/${instanceId}/formalize`, data)
      .pipe(map((r) => r.data!));
  }

  disseminateDocument(
    instanceId: string,
    data: Record<string, unknown>,
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .workflowPost<BpmsDocumentInstance>(`/instances/${instanceId}/disseminate`, data)
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Pending Tasks / Work Queue → workflow-service
  // ---------------------------------------------------------------------------

  getPendingTasks(unitId?: string, profileId?: string): Observable<BpmsPendingTask[]> {
    let params = new HttpParams();
    if (unitId) params = params.set('unit_id', unitId);
    if (profileId) params = params.set('profile_id', profileId);
    const options = params.keys().length ? { params } : undefined;
    return this.api
      .workflowGet<{ items: BpmsPendingTask[] } | BpmsPendingTask[]>('/work-queue', options)
      .pipe(map((r) => {
        const data = r.data;
        if (data && 'items' in (data as any)) return (data as any).items;
        return (data as BpmsPendingTask[]) ?? [];
      }));
  }

  // ---------------------------------------------------------------------------
  // Step Catalog → ⚠️ STUB (workflow-service needs these endpoints)
  // ---------------------------------------------------------------------------

  getStepCatalog(): Observable<BpmsStepCatalog[]> {
    return this.api
      .workflowGet<BpmsStepCatalog[]>('/step-catalog')
      .pipe(map((r) => r.data ?? []));
  }

  createStepCatalog(data: Partial<BpmsStepCatalog>): Observable<BpmsStepCatalog> {
    return this.api
      .workflowPost<BpmsStepCatalog>('/step-catalog', data)
      .pipe(map((r) => r.data!));
  }

  updateStepCatalog(id: string, data: Partial<BpmsStepCatalog>): Observable<BpmsStepCatalog> {
    return this.api
      .workflowPut<BpmsStepCatalog>(`/step-catalog/${id}`, data)
      .pipe(map((r) => r.data!));
  }

  // ---------------------------------------------------------------------------
  // Role Catalog → ⚠️ STUB (workflow-service needs these endpoints)
  // ---------------------------------------------------------------------------

  getRoleCatalog(): Observable<BpmsRoleCatalog[]> {
    return this.api
      .workflowGet<BpmsRoleCatalog[]>('/role-catalog')
      .pipe(map((r) => r.data ?? []));
  }

  createRoleCatalog(data: Partial<BpmsRoleCatalog>): Observable<BpmsRoleCatalog> {
    return this.api
      .workflowPost<BpmsRoleCatalog>('/role-catalog', data)
      .pipe(map((r) => r.data!));
  }

  updateRoleCatalog(id: string, data: Partial<BpmsRoleCatalog>): Observable<BpmsRoleCatalog> {
    return this.api
      .workflowPut<BpmsRoleCatalog>(`/role-catalog/${id}`, data)
      .pipe(map((r) => r.data!));
  }
}
