import { Component, OnInit, inject, signal, computed, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

import { VisualBpmsApiService } from '../../services/visual-bpms-api.service';
import { BpmsApiService } from '../../services/bpms-api.service';
import { ToastService } from '../../services/toast.service';
import {
  BpmsVisualFlow,
  BpmsVisualFlowStage,
  BpmsVisualFlowStageProfile,
  BpmsVisualFlowConnection,
  VisualFlowValidationError,
  FlowVersionSummary,
} from '../../models/visual-bpms.model';
import { BpmsUnitProfile, BpmsOrgUnit, BpmsProfile, BpmsStepCatalog } from '../../models/bpms.model';
import { FlowCanvasComponent, classifyConnection } from './flow-canvas/flow-canvas';
import { computeAutoLayout } from './flow-canvas/auto-layout';
import { ConnectionLegendComponent, ConnectionTypeVisibility } from './connection-legend/connection-legend';
import { ValidationPanelComponent } from './validation-panel/validation-panel';
import { ProfileTreeDialogComponent, ProfileDialogResult } from './profile-tree-dialog/profile-tree-dialog';
import { ProfileContextMenuComponent, PermissionChangeEvent } from './profile-context-menu/profile-context-menu';
import { GroupConnectionDialogComponent, GroupConnectionDialogResult, GroupConnectionPending, ProfileInfo } from './group-connection-dialog/group-connection-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-visual-flow-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    FlowCanvasComponent,
    ConnectionLegendComponent,
    ValidationPanelComponent,
    ProfileTreeDialogComponent,
    ProfileContextMenuComponent,
    GroupConnectionDialogComponent,
    TranslateModule
  ],
  providers: [ConfirmationService],
  templateUrl: './visual-flow-builder.html',
  styleUrl: './visual-flow-builder.css',
})
export class VisualFlowBuilderComponent implements OnInit {
  @ViewChild(ProfileTreeDialogComponent) profileDialog?: ProfileTreeDialogComponent;
  @ViewChild(ProfileContextMenuComponent) contextMenu?: ProfileContextMenuComponent;
  @ViewChild(GroupConnectionDialogComponent) groupConnectionDialog?: GroupConnectionDialogComponent;
  @ViewChild(FlowCanvasComponent) flowCanvas?: FlowCanvasComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly visualApi = inject(VisualBpmsApiService);
  private readonly bpmsApi = inject(BpmsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // --- Core state ---
  readonly flow = signal<BpmsVisualFlow | null>(null);
  readonly stages = signal<BpmsVisualFlowStage[]>([]);
  readonly connections = signal<BpmsVisualFlowConnection[]>([]);
  readonly hasUnsavedChanges = signal(false);
  readonly validationErrors = signal<VisualFlowValidationError[]>([]);

  // --- Org data ---
  readonly unitProfiles = signal<BpmsUnitProfile[]>([]);
  readonly orgUnits = signal<BpmsOrgUnit[]>([]);
  readonly profiles = signal<BpmsProfile[]>([]);

  // --- UI state ---
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showValidationPanel = signal(false);
  readonly globalGrouping = signal(true);
  readonly groupLinkMode = signal<'all' | 'sector'>('all');
  readonly connectionTypeVisibility = signal<ConnectionTypeVisibility>({
    AVANCO: true, RETORNO: true, INTRA_ETAPA: true, AUTO_REFERENCIA: true, AUTO_LINK: true,
  });
  readonly autoLayoutEnabled = signal(true);
  readonly autoLayoutRunning = signal(false);
  readonly autoReturnEnabled = signal(true);
  readonly drawerOpen = signal(localStorage.getItem('bpms_drawer_open') !== 'false');

  // --- Version selector state ---
  readonly versions = signal<FlowVersionSummary[]>([]);
  readonly versionSelectorOpen = signal(false);
  readonly versionNewMenuOpen = signal(false);
  readonly creatingVersion = signal(false);

  // Auto-save state
  readonly autoSaveEnabled = signal(true);
  readonly lastSavedAt = signal<Date | null>(null);
  readonly lastSavedLabel = computed(() => {
    const d = this.lastSavedAt();
    if (!d) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Salvo em ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  });
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly AUTO_SAVE_INTERVAL = 60000; // 60s

  // Auto-validation state
  readonly pendingCount = signal(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) { this.router.navigate(['/intelligence/workflows/visual-bpms']); return; }
      this.loadAll(id);
    });
  }

  private loadAll(id: string): void {
    this.loading.set(true);

    forkJoin({
      flow: this.visualApi.getVisualFlow(id),
      unitProfiles: this.bpmsApi.getUnitProfiles(),
      orgUnits: this.bpmsApi.getOrgUnits(),
      profiles: this.bpmsApi.getProfiles(),
      stepCatalog: this.bpmsApi.getStepCatalog(),
    }).subscribe({
      next: ({ flow, unitProfiles, orgUnits, profiles, stepCatalog }) => {
        // Set catalog data
        this.unitProfiles.set(unitProfiles);
        this.orgUnits.set(orgUnits);
        this.profiles.set(profiles);

        // Resolve step_catalog on stages before setting them
        const catalogById = new Map(stepCatalog.map((c) => [c.id, c]));
        const catalogByName = new Map(stepCatalog.map((c) => [c.name, c]));
        const unitProfileMap = new Map(unitProfiles.map((up) => [up.id, up]));

        const resolvedStages = (flow.stages ?? []).map((stage) => {
          const entry = catalogById.get(stage.step_catalog_id) ?? catalogByName.get(stage.step_catalog_id);
          // Resolve unit_profile on each profile
          const resolvedProfiles = (stage.profiles ?? []).map((p) => {
            if (p.unit_profile) return p;
            const up = unitProfileMap.get(p.unit_profile_id);
            return up ? { ...p, unit_profile: up } : p;
          });
          return {
            ...stage,
            step_catalog: entry ?? stage.step_catalog,
            profiles: resolvedProfiles,
          };
        });

        this.flow.set(flow);
        this.stages.set(resolvedStages);
        this.connections.set(flow.connections ?? []);
        this.loading.set(false);

        // Load versions
        this.visualApi.getFlowVersions(id).subscribe({
          next: (versions) => this.versions.set(versions),
          error: () => this.versions.set([]),
        });

        // Run initial validation if flow has profiles assigned
        const hasProfiles = resolvedStages.some((s) => (s.profiles ?? []).length > 0);
        if (hasProfiles) {
          this.runAutoValidation();
        }

        // Start auto-save interval
        if (this.autoSaveEnabled()) {
          this.scheduleAutoSave();
        }
      },
      error: () => {
        this.toast.error(this.translate.instant('workflows.errors.errorTitle'), this.translate.instant('workflows.errors.loadFlowFailed'));
        this.loading.set(false);
      },
    });
  }

  /**
   * Resolve step_catalog and unit_profile on stages.
   * Called after initial load and after every save/reload cycle.
   */
  private resolveStageData(stages: BpmsVisualFlowStage[]): BpmsVisualFlowStage[] {
    const unitProfileMap = new Map(this.unitProfiles().map((up) => [up.id, up]));
    const stepCatalogEntries = this.bpmsApi ? undefined : undefined; // catalog is already loaded

    return stages.map((stage) => {
      // Resolve step_catalog if missing — try to find from existing resolved stages
      let stepCatalog = stage.step_catalog;
      if (!stepCatalog) {
        const existing = this.stages().find((s) => s.step_catalog_id === stage.step_catalog_id);
        stepCatalog = existing?.step_catalog;
      }

      // Resolve unit_profile on each profile
      const resolvedProfiles = (stage.profiles ?? []).map((p) => {
        if (p.unit_profile) return p;
        const up = unitProfileMap.get(p.unit_profile_id);
        return up ? { ...p, unit_profile: up } : p;
      });

      return { ...stage, step_catalog: stepCatalog, profiles: resolvedProfiles };
    });
  }

  // ---------------------------------------------------------------------------
  // Profile Dialog
  // ---------------------------------------------------------------------------

  onOpenProfileDialog(stage: BpmsVisualFlowStage): void {
    // If org data wasn't loaded (e.g., org context wasn't ready at init), load it now
    if (this.unitProfiles().length === 0) {
      forkJoin({
        unitProfiles: this.bpmsApi.getUnitProfiles(),
        orgUnits: this.bpmsApi.getOrgUnits(),
        profiles: this.bpmsApi.getProfiles(),
      }).subscribe({
        next: ({ unitProfiles, orgUnits, profiles }) => {
          this.unitProfiles.set(unitProfiles);
          this.orgUnits.set(orgUnits);
          this.profiles.set(profiles);
          this.openProfileDialogWithData(stage);
        },
      });
    } else {
      this.openProfileDialogWithData(stage);
    }
  }

  private openProfileDialogWithData(stage: BpmsVisualFlowStage): void {
    this.profileDialog?.open({
      stage,
      orgUnits: this.orgUnits(),
      unitProfiles: this.unitProfiles(),
      connections: this.connections(),
      onConfirm: (result) => this.applyProfileChanges(stage, result),
    });
  }

  private applyProfileChanges(stage: BpmsVisualFlowStage, result: ProfileDialogResult): void {
    if (result.added.length === 0 && result.removed.length === 0) return;

    // If removing profiles with connections, ask for confirmation
    if (result.removedWithConnections.length > 0) {
      const names = result.removedWithConnections.map((id) => {
        const up = this.unitProfiles().find((u) => u.id === id);
        return up?.profile?.name ?? 'Perfil';
      }).join(', ');

      this.confirmationService.confirm({
        message: this.translate.instant('workflows.confirm.removeProfilesWithConnections'),
        header: this.translate.instant('workflows.confirm.removeProfilesHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translate.instant('workflows.common.confirm'),
        rejectLabel: this.translate.instant('workflows.actions.cancel'),
        accept: () => this.doApplyProfileChanges(stage, result),
      });
    } else {
      this.doApplyProfileChanges(stage, result);
    }
  }

  private doApplyProfileChanges(stage: BpmsVisualFlowStage, result: ProfileDialogResult): void {
    const currentProfiles = stage.profiles ?? [];

    // Remove profiles
    const removedUnitProfileIds = new Set(result.removed);
    const removedStageProfileIds = new Set(
      currentProfiles.filter((p) => removedUnitProfileIds.has(p.unit_profile_id)).map((p) => p.id),
    );

    // Remove connections referencing removed profiles
    if (removedStageProfileIds.size > 0) {
      this.connections.set(
        this.connections().filter(
          (c) => !removedStageProfileIds.has(c.source_stage_profile_id) && !removedStageProfileIds.has(c.target_stage_profile_id),
        ),
      );
    }

    // Build new profiles list
    const keptProfiles = currentProfiles.filter((p) => !removedUnitProfileIds.has(p.unit_profile_id));

    // Add new profiles
    const newProfiles: BpmsVisualFlowStageProfile[] = result.added.map((unitProfileId, i) => {
      const up = this.unitProfiles().find((u) => u.id === unitProfileId);
      return {
        id: crypto.randomUUID(),
        visual_flow_stage_id: stage.id,
        unit_profile_id: unitProfileId,
        permissions: (stage.step_catalog?.permissions as string[]) ?? [],
        permissions_customized: false,
        order_index: keptProfiles.length + i,
        created_at: new Date().toISOString(),
        unit_profile: up,
      };
    });

    const updatedProfiles = [...keptProfiles, ...newProfiles];

    // Update stages
    this.stages.set(
      this.stages().map((s) => s.id === stage.id ? { ...s, profiles: updatedProfiles } : s),
    );

    this.markUnsaved();
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  onSave(): void {
    const currentFlow = this.flow();
    if (!currentFlow) return;
    this.saving.set(true);
    const flowId = currentFlow.id;

    // Snapshot current state before save (IDs may be temporary)
    const snapshotStages = JSON.parse(JSON.stringify(this.stages())) as BpmsVisualFlowStage[];

    const tempIdToUnitProfileId = new Map<string, string>();
    for (const stage of snapshotStages) {
      for (const p of stage.profiles ?? []) {
        tempIdToUnitProfileId.set(p.id, p.unit_profile_id);
      }
    }

    // Also map temp profile ID → step_catalog_id of its stage (for correct stage matching)
    const tempIdToStepCatalogId = new Map<string, string>();
    for (const stage of snapshotStages) {
      for (const p of stage.profiles ?? []) {
        tempIdToStepCatalogId.set(p.id, stage.step_catalog_id);
      }
    }

    this.saveProfilesSequentially(flowId, this.stages(), 0, tempIdToUnitProfileId, tempIdToStepCatalogId);
  }

  private saveProfilesSequentially(
    flowId: string, stages: BpmsVisualFlowStage[], index: number,
    tempIdToUnitProfileId: Map<string, string>,
    tempIdToStepCatalogId: Map<string, string>,
  ): void {
    if (index >= stages.length) {
      this.reloadAndSaveConnections(flowId, tempIdToUnitProfileId, tempIdToStepCatalogId);
      return;
    }
    const stage = stages[index];
    const profiles = (stage.profiles ?? []).map((p, i) => ({
      unit_profile_id: p.unit_profile_id,
      permissions: p.permissions ?? [],
      permissions_customized: p.permissions_customized ?? false,
      order_index: p.order_index ?? i,
    }));

    this.visualApi.saveStageProfiles(flowId, stage.id, profiles).subscribe({
      next: () => this.saveProfilesSequentially(flowId, stages, index + 1, tempIdToUnitProfileId, tempIdToStepCatalogId),
      error: () => {
        this.saving.set(false);
        this.toast.error(this.translate.instant('workflows.errors.saveErrorTitle'), this.translate.instant('workflows.errors.saveProfilesFailed'));
      },
    });
  }

  private reloadAndSaveConnections(
    flowId: string,
    tempIdToUnitProfileId: Map<string, string>,
    tempIdToStepCatalogId: Map<string, string>,
  ): void {
    // Snapshot local state before reload (for rollback on error)
    const snapshotStages = this.stages();
    const snapshotConnections = this.connections();

    this.visualApi.getVisualFlow(flowId).subscribe({
      next: (reloadedFlow) => {
        // Build a precise lookup: (unit_profile_id + step_catalog_id) → real profile id
        const realIdLookup = new Map<string, string>();
        for (const stage of reloadedFlow.stages ?? []) {
          for (const p of stage.profiles ?? []) {
            const key = `${p.unit_profile_id}__${stage.step_catalog_id}`;
            realIdLookup.set(key, p.id);
          }
        }

        const remappedConnections = snapshotConnections.map((c) => {
          const sourceUnitProfileId = tempIdToUnitProfileId.get(c.source_stage_profile_id) ?? c.source_stage_profile_id;
          const targetUnitProfileId = tempIdToUnitProfileId.get(c.target_stage_profile_id) ?? c.target_stage_profile_id;
          const sourceStepCatalogId = tempIdToStepCatalogId.get(c.source_stage_profile_id) ?? '';
          const targetStepCatalogId = tempIdToStepCatalogId.get(c.target_stage_profile_id) ?? '';

          const realSourceId = realIdLookup.get(`${sourceUnitProfileId}__${sourceStepCatalogId}`) ?? c.source_stage_profile_id;
          const realTargetId = realIdLookup.get(`${targetUnitProfileId}__${targetStepCatalogId}`) ?? c.target_stage_profile_id;

          return { source_stage_profile_id: realSourceId, target_stage_profile_id: realTargetId, connection_type: c.connection_type };
        });

        // Filter out connections where remapping failed (still has temp UUID)
        const validConnections = remappedConnections.filter((c) => {
          const sourceExists = (reloadedFlow.stages ?? []).some((s) => (s.profiles ?? []).some((p) => p.id === c.source_stage_profile_id));
          const targetExists = (reloadedFlow.stages ?? []).some((s) => (s.profiles ?? []).some((p) => p.id === c.target_stage_profile_id));
          return sourceExists && targetExists;
        });

        this.visualApi.saveConnections(flowId, validConnections).subscribe({
          next: (savedConnections) => {
            // Remap hidden profile IDs before updating stages
            if (this.flowCanvas) {
              const oldHidden = this.flowCanvas.hiddenProfileIds();
              if (oldHidden.size > 0) {
                const newHidden = new Set<string>();
                for (const oldId of oldHidden) {
                  const unitProfileId = tempIdToUnitProfileId.get(oldId) ?? oldId;
                  const stepCatalogId = tempIdToStepCatalogId.get(oldId) ?? '';
                  const realId = realIdLookup.get(`${unitProfileId}__${stepCatalogId}`);
                  if (realId) newHidden.add(realId);
                }
                this.flowCanvas.hiddenProfileIds.set(newHidden);
              }
            }

            // Only update local state after successful save
            this.stages.set(this.resolveStageData(reloadedFlow.stages ?? []));
            this.connections.set(savedConnections);
            this.saving.set(false);
            this.hasUnsavedChanges.set(false);
            this.lastSavedAt.set(new Date());
            this.toast.success(this.translate.instant('workflows.success.savedTitle'), this.translate.instant('workflows.success.flowSaved'));
          },
          error: () => {
            // Rollback to local state on error
            this.stages.set(snapshotStages);
            this.connections.set(snapshotConnections);
            this.saving.set(false);
            this.toast.error(this.translate.instant('workflows.errors.saveErrorTitle'), this.translate.instant('workflows.errors.saveConnectionsFailed'));
          },
        });
      },
      error: () => {
        // Rollback on reload error
        this.stages.set(snapshotStages);
        this.connections.set(snapshotConnections);
        this.saving.set(false);
        this.toast.error(this.translate.instant('workflows.errors.saveErrorTitle'), this.translate.instant('workflows.errors.reloadFlowFailed'));
      },
    });
  }

  private findStageForProfile(profileId: string): BpmsVisualFlowStage | undefined {
    return this.stages().find((s) => (s.profiles ?? []).some((p) => p.id === profileId));
  }

  // ---------------------------------------------------------------------------
  // Connections
  // ---------------------------------------------------------------------------

  onConnectionCreated(event: { sourceStageProfileId: string; targetStageProfileId: string }): void {
    const existing = this.connections().find(
      (c) => c.source_stage_profile_id === event.sourceStageProfileId && c.target_stage_profile_id === event.targetStageProfileId,
    );
    if (existing) return;

    const connectionType = classifyConnection(event.sourceStageProfileId, event.targetStageProfileId, this.stages());
    const newConnection: BpmsVisualFlowConnection = {
      id: crypto.randomUUID(),
      visual_flow_id: this.flow()?.id ?? '',
      source_stage_profile_id: event.sourceStageProfileId,
      target_stage_profile_id: event.targetStageProfileId,
      connection_type: connectionType,
      created_at: new Date().toISOString(),
    };
    this.connections.set([...this.connections(), newConnection]);
    this.markUnsaved();
    this.runAutoLayoutIfEnabled();

    // Auto-Devolução: create reverse connection for AVANCO
    if (this.autoReturnEnabled() && connectionType === 'AVANCO') {
      const reverseExists = this.connections().find(
        (c) => c.source_stage_profile_id === event.targetStageProfileId && c.target_stage_profile_id === event.sourceStageProfileId,
      );
      if (!reverseExists) {
        const reverseConnection: BpmsVisualFlowConnection = {
          id: crypto.randomUUID(),
          visual_flow_id: this.flow()?.id ?? '',
          source_stage_profile_id: event.targetStageProfileId,
          target_stage_profile_id: event.sourceStageProfileId,
          connection_type: 'RETORNO',
          created_at: new Date().toISOString(),
        };
        this.connections.set([...this.connections(), reverseConnection]);
      }
    }
  }

  onGroupConnectionCreated(event: { sourceGroupMemberIds: string[]; targetGroupMemberIds: string[] }): void {
    if (GroupConnectionDialogComponent.shouldSkip()) {
      this.executeGroupConnections(event.sourceGroupMemberIds, event.targetGroupMemberIds, this.groupLinkMode());
      return;
    }
    const sources = this.resolveProfileInfos(event.sourceGroupMemberIds);
    const targets = this.resolveProfileInfos(event.targetGroupMemberIds);
    this.groupConnectionDialog?.open(
      { sourceMemberIds: event.sourceGroupMemberIds, targetMemberIds: event.targetGroupMemberIds },
      this.groupLinkMode(),
      sources,
      targets,
    );
  }

  onGroupConnectionConfirmed(result: GroupConnectionDialogResult): void {
    const pending = this.groupConnectionDialog?.getPending();
    if (!pending) return;
    if (result.mode !== this.groupLinkMode()) {
      this.setGroupLinkMode(result.mode);
    }
    this.executeGroupConnections(pending.sourceMemberIds, pending.targetMemberIds, result.mode);
  }

  private executeGroupConnections(sourceIds: string[], targetIds: string[], mode: 'all' | 'sector'): void {
    if (mode === 'sector') {
      for (const sourceId of sourceIds) {
        const sourceUnitId = this.getUnitIdForProfile(sourceId);
        for (const targetId of targetIds) {
          const targetUnitId = this.getUnitIdForProfile(targetId);
          if (sourceUnitId && targetUnitId && sourceUnitId === targetUnitId) {
            this.onConnectionCreated({ sourceStageProfileId: sourceId, targetStageProfileId: targetId });
          }
        }
      }
    } else {
      for (const sourceId of sourceIds) {
        for (const targetId of targetIds) {
          this.onConnectionCreated({ sourceStageProfileId: sourceId, targetStageProfileId: targetId });
        }
      }
    }
  }

  private getUnitIdForProfile(profileId: string): string | null {
    for (const stage of this.stages()) {
      for (const p of stage.profiles ?? []) {
        if (p.id === profileId) return p.unit_profile?.unit_id ?? null;
      }
    }
    return null;
  }

  private resolveProfileInfos(ids: string[]): ProfileInfo[] {
    const result: ProfileInfo[] = [];
    for (const id of ids) {
      for (const stage of this.stages()) {
        for (const p of stage.profiles ?? []) {
          if (p.id === id) {
            result.push({
              id: p.id,
              name: p.unit_profile?.profile?.name ?? 'Perfil',
              unitAcronym: p.unit_profile?.unit?.acronym ?? '',
              unitId: p.unit_profile?.unit_id ?? '',
            });
          }
        }
      }
    }
    return result;
  }

  onConnectionRemoved(connectionId: string): void {
    this.confirmationService.confirm({
      message: this.translate.instant('workflows.confirm.removeConnection'),
      header: this.translate.instant('workflows.confirm.removeHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('workflows.actions.delete'),
      rejectLabel: this.translate.instant('workflows.actions.cancel'),
      accept: () => {
        this.connections.set(this.connections().filter((c) => c.id !== connectionId));
        this.markUnsaved();
      },
    });
  }

  onGroupConnectionRemoved(event: { sourceDisplayId: string; targetDisplayId: string }): void {
    // Find all real connections between members of the source and target display items
    // A display ID can be a real profile ID or a group ID like "group_stageId_profileTypeId"
    const allStages = this.stages();
    const sourceMemberIds = this.getDisplayMemberIds(event.sourceDisplayId, allStages);
    const targetMemberIds = this.getDisplayMemberIds(event.targetDisplayId, allStages);

    const sourceSet = new Set(sourceMemberIds);
    const targetSet = new Set(targetMemberIds);

    const toRemove = this.connections().filter(
      (c) => sourceSet.has(c.source_stage_profile_id) && targetSet.has(c.target_stage_profile_id),
    );

    if (toRemove.length === 0) return;

    this.confirmationService.confirm({
      message: this.translate.instant('workflows.confirm.removeGroupConnections'),
      header: this.translate.instant('workflows.confirm.removeHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('workflows.actions.delete'),
      rejectLabel: this.translate.instant('workflows.actions.cancel'),
      accept: () => {
        const removeIds = new Set(toRemove.map((c) => c.id));
        this.connections.set(this.connections().filter((c) => !removeIds.has(c.id)));
        this.markUnsaved();
      },
    });
  }

  private getDisplayMemberIds(displayId: string, stages: BpmsVisualFlowStage[]): string[] {
    // If it's a real profile ID, return just that
    for (const stage of stages) {
      const profile = (stage.profiles ?? []).find((p) => p.id === displayId);
      if (profile) return [displayId];
    }
    // If it's a group ID like "group_{stageId}_{profileTypeId}", find all members
    if (displayId.startsWith('group_')) {
      const parts = displayId.split('_');
      // group_{stageId}_{profileTypeId}
      const stageId = parts[1];
      const profileTypeId = parts.slice(2).join('_');
      const stage = stages.find((s) => s.id === stageId);
      if (stage) {
        return (stage.profiles ?? [])
          .filter((p) => (p.unit_profile?.profile_id ?? p.id) === profileTypeId)
          .map((p) => p.id);
      }
    }
    return [displayId];
  }

  // ---------------------------------------------------------------------------
  // Other actions
  // ---------------------------------------------------------------------------

  onEditFlow(): void {
    const f = this.flow();
    if (f) this.router.navigate(['/intelligence/workflows/visual-bpms', f.id, 'edit']);
  }

  confirmToggleFlowStatus(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const f = this.flow();
    if (!f) return;
    const willActivate = f.status !== 'ATIVO';
    checkbox.checked = f.status === 'ATIVO';

    if (!willActivate) {
      // Deactivating — single confirmation
      this.confirmationService.confirm({
        message: this.translate.instant('workflows.confirm.deactivateFlow'),
        header: this.translate.instant('workflows.confirm.deactivateHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translate.instant('workflows.actions.deactivate'),
        rejectLabel: this.translate.instant('workflows.actions.cancel'),
        accept: () => this.toggleFlowStatus(),
      });
      return;
    }

    // Activating — check for pending issues first
    this.runAutoValidation();
    const count = this.pendingCount();

    if (count > 0) {
      this.confirmationService.confirm({
        message: this.translate.instant('workflows.confirm.activateWithPending'),
        header: this.translate.instant('workflows.confirm.pendingHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translate.instant('workflows.confirm.activateAnyway'),
        rejectLabel: this.translate.instant('workflows.confirm.viewPending'),
        accept: () => setTimeout(() => this.showActivationConfirmation(), 100),
        reject: () => {
          this.showValidationPanel.set(true);
        },
      });
    } else {
      this.showActivationConfirmation();
    }
  }

  private showActivationConfirmation(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('workflows.confirm.activateFlow'),
      header: this.translate.instant('workflows.confirm.activateHeader'),
      icon: 'pi pi-check-circle',
      acceptLabel: this.translate.instant('workflows.actions.activate'),
      rejectLabel: this.translate.instant('workflows.actions.cancel'),
      accept: () => this.toggleFlowStatus(),
    });
  }

  toggleFlowStatus(): void {
    const f = this.flow();
    if (!f) return;

    // Save unsaved changes before toggling status
    if (this.hasUnsavedChanges()) {
      this.onSave();
      // Wait for save to complete, then toggle
      const checkSaved = setInterval(() => {
        if (!this.saving()) {
          clearInterval(checkSaved);
          this.doToggleFlowStatus(f);
        }
      }, 200);
    } else {
      this.doToggleFlowStatus(f);
    }
  }

  private doToggleFlowStatus(f: BpmsVisualFlow): void {
    const newStatus = f.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    this.visualApi.updateVisualFlow(f.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.flow.set(updated);
        this.visualApi.getFlowVersions(f.id).subscribe({
          next: (versions) => this.versions.set(versions),
          error: () => {},
        });
        this.toast.success(this.translate.instant('workflows.success.statusUpdatedTitle'), this.translate.instant('workflows.success.statusUpdated'));
      },
      error: (err) => {
        const detail = err?.error?.detail ?? this.translate.instant('workflows.errors.statusChangeFailed');
        this.toast.error(this.translate.instant('workflows.errors.errorTitle'), detail);
      },
    });
  }

  onValidate(): void {
    this.runAutoValidation();
    this.showValidationPanel.set(true);
  }

  private runAutoValidation(): void {
    const errors = validateVisualFlow(this.stages(), this.connections());
    this.validationErrors.set(errors);
    this.pendingCount.set(errors.length);
  }

  // ---------------------------------------------------------------------------
  // Profile Context Menu
  // ---------------------------------------------------------------------------

  onProfileReordered(event: { stageId: string; profileId: string; newIndex: number }): void {
    const updated = this.stages().map((s) => {
      if (s.id !== event.stageId) return s;
      const profiles = [...(s.profiles ?? [])];
      const currentIndex = profiles.findIndex((p) => p.id === event.profileId);
      if (currentIndex < 0 || currentIndex === event.newIndex) return s;

      // Move the profile
      const [moved] = profiles.splice(currentIndex, 1);
      profiles.splice(event.newIndex, 0, moved);

      // Update order_index
      const reindexed = profiles.map((p, i) => ({ ...p, order_index: i }));
      return { ...s, profiles: reindexed };
    });
    this.stages.set(updated);
    this.markUnsaved();
  }

  onProfileContextMenu(event: { x: number; y: number; profile: BpmsVisualFlowStageProfile; stage: BpmsVisualFlowStage }): void {
    const stagePermissions = event.stage.step_catalog?.permissions as string[] ?? [];
    this.contextMenu?.open({
      x: event.x,
      y: event.y,
      profile: event.profile,
      stagePermissions,
    });
  }

  onPermissionsChanged(event: PermissionChangeEvent): void {
    const updated = this.stages().map((s) => ({
      ...s,
      profiles: (s.profiles ?? []).map((p) =>
        p.id === event.stageProfileId
          ? { ...p, permissions: event.permissions, permissions_customized: event.customized }
          : p,
      ),
    }));
    this.stages.set(updated);
    this.markUnsaved();
  }

  onContextMenuDelete(stageProfileId: string): void {
    // Find which stage this profile belongs to
    const stage = this.stages().find((s) => (s.profiles ?? []).some((p) => p.id === stageProfileId));
    if (!stage) return;

    const hasConnections = this.connections().some(
      (c) => c.source_stage_profile_id === stageProfileId || c.target_stage_profile_id === stageProfileId,
    );

    if (hasConnections) {
      this.confirmationService.confirm({
        message: this.translate.instant('workflows.confirm.removeProfileWithConnections'),
        header: this.translate.instant('workflows.confirm.removeHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translate.instant('workflows.actions.delete'),
        rejectLabel: this.translate.instant('workflows.actions.cancel'),
        accept: () => this.doRemoveProfileById(stage.id, stageProfileId),
      });
    } else {
      this.doRemoveProfileById(stage.id, stageProfileId);
    }
  }

  private doRemoveProfileById(stageId: string, stageProfileId: string): void {
    this.connections.set(
      this.connections().filter(
        (c) => c.source_stage_profile_id !== stageProfileId && c.target_stage_profile_id !== stageProfileId,
      ),
    );
    this.stages.set(
      this.stages().map((s) =>
        s.id === stageId ? { ...s, profiles: (s.profiles ?? []).filter((p) => p.id !== stageProfileId) } : s,
      ),
    );
    this.markUnsaved();
  }

  markUnsaved(): void {
    this.hasUnsavedChanges.set(true);
    this.runAutoValidation();
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) return; // already running
    this.autoSaveTimer = setInterval(() => {
      if (this.autoSaveEnabled() && this.hasUnsavedChanges() && !this.saving()) {
        this.onSave();
      }
    }, VisualFlowBuilderComponent.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  toggleAutoSave(): void {
    this.autoSaveEnabled.update((v) => !v);
    if (this.autoSaveEnabled()) {
      this.scheduleAutoSave();
    } else {
      this.stopAutoSave();
    }
  }

  getZoomLevel(): number {
    return this.flowCanvas?.zoomLevel() ?? 1;
  }

  setZoomLevel(value: number): void {
    if (this.flowCanvas) {
      this.flowCanvas.zoomLevel.set(Math.round(Math.min(2, Math.max(0.5, value)) * 100) / 100);
    }
  }

  getZoomPercent(): number {
    return Math.round(this.getZoomLevel() * 100);
  }

  onZoomSliderInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.setZoomLevel(value);
  }

  onGlobalGroupingToggle(): void {
    this.globalGrouping.update((v) => !v);
  }

  setGroupLinkMode(mode: 'all' | 'sector'): void {
    this.groupLinkMode.set(mode);
  }

  onConnectionTypeVisibilityChanged(v: ConnectionTypeVisibility): void {
    this.connectionTypeVisibility.set(v);
  }

  toggleAutoLayout(): void {
    this.autoLayoutEnabled.update((v) => !v);
  }

  toggleAutoReturn(): void {
    this.autoReturnEnabled.update((v) => !v);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => {
      const next = !v;
      localStorage.setItem('bpms_drawer_open', String(next));
      return next;
    });
  }

  private runAutoLayoutIfEnabled(): void {
    if (!this.autoLayoutEnabled()) return;
    this.autoLayoutRunning.set(true);
    // Use setTimeout so the overlay renders before the computation
    setTimeout(() => {
      const reordered = computeAutoLayout(this.stages(), this.connections());
      this.stages.set(reordered);
      this.autoLayoutRunning.set(false);
      this.markUnsaved();
    }, 50);
  }

  // ---------------------------------------------------------------------------
  // Version Selector
  // ---------------------------------------------------------------------------

  toggleVersionSelector(): void {
    this.versionSelectorOpen.update((v) => !v);
    if (!this.versionSelectorOpen()) {
      this.versionNewMenuOpen.set(false);
    }
  }

  closeVersionSelector(): void {
    this.versionSelectorOpen.set(false);
    this.versionNewMenuOpen.set(false);
  }

  toggleNewVersionMenu(): void {
    this.versionNewMenuOpen.update((v) => !v);
  }

  onVersionSelect(versionId: string): void {
    const currentFlow = this.flow();
    if (currentFlow && versionId === currentFlow.id) {
      this.closeVersionSelector();
      return;
    }
    this.closeVersionSelector();
    this.router.navigate(['/intelligence/workflows/visual-bpms', versionId]);
  }

  onCreateBlankVersion(): void {
    const currentFlow = this.flow();
    if (!currentFlow || this.creatingVersion()) return;
    this.creatingVersion.set(true);
    this.visualApi.createBlankVersion(currentFlow.id).subscribe({
      next: (newFlow) => {
        this.creatingVersion.set(false);
        this.closeVersionSelector();
        this.toast.success(this.translate.instant('workflows.success.versionCreatedTitle'), this.translate.instant('workflows.success.versionCreated'));
        this.router.navigate(['/intelligence/workflows/visual-bpms', newFlow.id]);
      },
      error: () => {
        this.creatingVersion.set(false);
        this.toast.error(this.translate.instant('workflows.errors.errorTitle'), this.translate.instant('workflows.errors.createVersionFailed'));
      },
    });
  }

  onDuplicateVersion(): void {
    const currentFlow = this.flow();
    if (!currentFlow || this.creatingVersion()) return;
    this.creatingVersion.set(true);
    this.visualApi.duplicateVersion(currentFlow.id).subscribe({
      next: (newFlow) => {
        this.creatingVersion.set(false);
        this.closeVersionSelector();
        this.toast.success(this.translate.instant('workflows.success.versionDuplicatedTitle'), this.translate.instant('workflows.success.versionCreated'));
        this.router.navigate(['/intelligence/workflows/visual-bpms', newFlow.id]);
      },
      error: () => {
        this.creatingVersion.set(false);
        this.toast.error(this.translate.instant('workflows.errors.errorTitle'), this.translate.instant('workflows.errors.duplicateVersionFailed'));
      },
    });
  }

  closeValidationPanel(): void {
    this.showValidationPanel.set(false);
  }
}


// ---------------------------------------------------------------------------
// Validation logic (exported for testability)
// ---------------------------------------------------------------------------

export function validateVisualFlow(
  stages: BpmsVisualFlowStage[],
  connections: BpmsVisualFlowConnection[],
): VisualFlowValidationError[] {
  const errors: VisualFlowValidationError[] = [];

  if (stages.length < 2) {
    errors.push({ code: 'MIN_STAGES', message: 'Flow must have at least 2 stages.', entity_type: 'FLOW' });
    return errors;
  }

  for (const stage of stages) {
    if ((stage.profiles ?? []).length === 0) {
      errors.push({ code: 'EMPTY_STAGE', message: `Stage "${stage.step_catalog?.name ?? stage.order_index}" has no profiles.`, entity_type: 'STAGE', entity_id: stage.id });
    }
  }

  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);
  const first = sorted[0], last = sorted[sorted.length - 1];
  if (first && last && first.id !== last.id) {
    if (!checkAdvancePath(sorted, connections)) {
      errors.push({ code: 'NO_COMPLETE_PATH', message: 'No complete forward path from first to last stage.', entity_type: 'FLOW' });
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const stage = sorted[i];
    for (const profile of stage.profiles ?? []) {
      const hasOut = connections.some((c) => c.source_stage_profile_id === profile.id);
      const hasIn = connections.some((c) => c.target_stage_profile_id === profile.id);

      // Check for auto-link (same unit_profile_id in adjacent stage)
      const hasAutoLinkOut = i < sorted.length - 1 && (sorted[i + 1].profiles ?? []).some((p) => p.unit_profile_id === profile.unit_profile_id);
      const hasAutoLinkIn = i > 0 && (sorted[i - 1].profiles ?? []).some((p) => p.unit_profile_id === profile.unit_profile_id);

      const effectiveOut = hasOut || hasAutoLinkOut;
      const effectiveIn = hasIn || hasAutoLinkIn;
      const isolated = i === 0 ? !effectiveOut : i === sorted.length - 1 ? !effectiveIn : !effectiveOut && !effectiveIn;
      if (isolated) {
        errors.push({ code: 'ISOLATED_PROFILE', message: `Profile "${profile.unit_profile?.profile?.name ?? profile.id}" in stage "${stage.step_catalog?.name ?? stage.order_index}" is isolated.`, entity_type: 'PROFILE', entity_id: profile.id });
      }
    }
  }

  return errors;
}

function checkAdvancePath(sorted: BpmsVisualFlowStage[], connections: BpmsVisualFlowConnection[]): boolean {
  const firstIds = new Set((sorted[0].profiles ?? []).map((p) => p.id));
  const lastIds = new Set((sorted[sorted.length - 1].profiles ?? []).map((p) => p.id));
  if (firstIds.size === 0 || lastIds.size === 0) return false;

  const adj = new Map<string, string[]>();

  // Explicit advance connections
  for (const c of connections) {
    if (c.connection_type === 'AVANCO') {
      const list = adj.get(c.source_stage_profile_id) ?? [];
      list.push(c.target_stage_profile_id);
      adj.set(c.source_stage_profile_id, list);
    }
  }

  // Auto-links (same unit_profile_id in adjacent stages)
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    for (const p of current.profiles ?? []) {
      for (const np of next.profiles ?? []) {
        if (p.unit_profile_id === np.unit_profile_id) {
          const list = adj.get(p.id) ?? [];
          list.push(np.id);
          adj.set(p.id, list);
        }
      }
    }
  }

  const visited = new Set<string>();
  const queue = [...firstIds];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (lastIds.has(cur)) return true;
    for (const n of adj.get(cur) ?? []) { if (!visited.has(n)) queue.push(n); }
  }
  return false;
}
