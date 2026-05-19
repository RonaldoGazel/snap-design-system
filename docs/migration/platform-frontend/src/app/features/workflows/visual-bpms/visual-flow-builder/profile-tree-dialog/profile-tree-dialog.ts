import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { TreeNode } from 'primeng/api';

import { BpmsOrgUnit, BpmsUnitProfile } from '../../../models/bpms.model';
import { BpmsVisualFlowStage, BpmsVisualFlowStageProfile, BpmsVisualFlowConnection } from '../../../models/visual-bpms.model';
import { TranslateModule } from '@ngx-translate/core';

export interface ProfileDialogResult {
  added: string[];   // unit_profile_ids to add
  removed: string[]; // unit_profile_ids to remove
  removedWithConnections: string[]; // unit_profile_ids removed that had connections
}

@Component({
  selector: 'app-profile-tree-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogModule, TreeModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './profile-tree-dialog.html',
  styleUrl: './profile-tree-dialog.css',
})
export class ProfileTreeDialogComponent {
  readonly visible = signal(false);
  readonly stage = signal<BpmsVisualFlowStage | null>(null);
  readonly treeNodes = signal<TreeNode[]>([]);
  readonly selectedNodes = signal<TreeNode[]>([]);

  private orgUnits: BpmsOrgUnit[] = [];
  private unitProfiles: BpmsUnitProfile[] = [];
  private connections: BpmsVisualFlowConnection[] = [];
  private previouslySelectedUnitProfileIds = new Set<string>();
  private onConfirmCallback?: (result: ProfileDialogResult) => void;

  open(config: {
    stage: BpmsVisualFlowStage;
    orgUnits: BpmsOrgUnit[];
    unitProfiles: BpmsUnitProfile[];
    connections: BpmsVisualFlowConnection[];
    onConfirm: (result: ProfileDialogResult) => void;
  }): void {
    this.stage.set(config.stage);
    this.orgUnits = config.orgUnits;
    this.unitProfiles = config.unitProfiles;
    this.connections = config.connections;
    this.onConfirmCallback = config.onConfirm;

    // Build the set of currently selected unit_profile_ids for this stage
    const currentProfiles = config.stage.profiles ?? [];
    this.previouslySelectedUnitProfileIds = new Set(currentProfiles.map((p) => p.unit_profile_id));

    // Build tree and pre-select
    const { nodes, selected } = this.buildTree(config.orgUnits, config.unitProfiles, currentProfiles);
    this.treeNodes.set(nodes);
    this.selectedNodes.set(selected);
    this.visible.set(true);
  }

  onConfirm(): void {
    const nowSelectedIds = this.extractSelectedUnitProfileIds(this.selectedNodes());
    const previousIds = this.previouslySelectedUnitProfileIds;

    const added = nowSelectedIds.filter((id) => !previousIds.has(id));
    const removed = [...previousIds].filter((id) => !nowSelectedIds.includes(id));

    // Check which removed profiles have connections
    const stageProfiles = this.stage()?.profiles ?? [];
    const removedWithConnections = removed.filter((unitProfileId) => {
      const sp = stageProfiles.find((p) => p.unit_profile_id === unitProfileId);
      if (!sp) return false;
      return this.connections.some(
        (c) => c.source_stage_profile_id === sp.id || c.target_stage_profile_id === sp.id,
      );
    });

    if (this.onConfirmCallback) {
      this.onConfirmCallback({ added, removed, removedWithConnections });
    }
    this.visible.set(false);
  }

  onCancel(): void {
    this.visible.set(false);
  }

  private buildTree(
    orgUnits: BpmsOrgUnit[],
    unitProfiles: BpmsUnitProfile[],
    currentStageProfiles: BpmsVisualFlowStageProfile[],
  ): { nodes: TreeNode[]; selected: TreeNode[] } {
    const selected: TreeNode[] = [];
    const currentUnitProfileIds = new Set(currentStageProfiles.map((p) => p.unit_profile_id));

    // Build a map of unit_id → unit_profiles
    const profilesByUnit = new Map<string, BpmsUnitProfile[]>();
    for (const up of unitProfiles) {
      if (!up.is_active) continue;
      const list = profilesByUnit.get(up.unit_id) ?? [];
      list.push(up);
      profilesByUnit.set(up.unit_id, list);
    }

    // Connection count per stage_profile
    const connectionCountMap = new Map<string, number>();
    for (const sp of currentStageProfiles) {
      const count = this.connections.filter(
        (c) => c.source_stage_profile_id === sp.id || c.target_stage_profile_id === sp.id,
      ).length;
      if (count > 0) connectionCountMap.set(sp.unit_profile_id, count);
    }

    // Build tree recursively from root units
    const rootUnits = orgUnits.filter((u) => !u.parent_id && u.is_active);

    const buildNode = (unit: BpmsOrgUnit): TreeNode => {
      const profileNodes: TreeNode[] = [];
      const unitChildNodes: TreeNode[] = [];

      // Add profiles as leaf nodes FIRST
      const profiles = profilesByUnit.get(unit.id) ?? [];
      for (const up of profiles) {
        const connCount = connectionCountMap.get(up.id) ?? 0;
        const label = connCount > 0
          ? `${up.profile?.name} (${connCount} conexão${connCount > 1 ? 'ões' : ''})`
          : up.profile?.name ?? 'Perfil';

        const profileNode: TreeNode = {
          key: `profile_${up.id}`,
          label,
          data: { type: 'profile', unitProfileId: up.id },
          icon: 'pi pi-user',
          leaf: true,
          styleClass: 'tree-node-profile',
        };

        if (currentUnitProfileIds.has(up.id)) {
          selected.push(profileNode);
        }

        profileNodes.push(profileNode);
      }

      // Add child units AFTER profiles
      const childUnits = orgUnits.filter((u) => u.parent_id === unit.id && u.is_active);
      for (const child of childUnits) {
        unitChildNodes.push(buildNode(child));
      }

      // Profiles first, then sub-units
      const children = [...profileNodes, ...unitChildNodes];

      const unitNode: TreeNode = {
        key: `unit_${unit.id}`,
        label: `${unit.acronym} — ${unit.name}`,
        data: { type: 'unit', unitId: unit.id },
        icon: 'pi pi-building',
        children,
        expanded: false,
      };

      // Check selection state of all selectable descendants (profiles)
      const allSelectableLeaves = this.collectProfileLeaves(children);
      const selectedLeaves = allSelectableLeaves.filter((leaf) => selected.includes(leaf));

      if (allSelectableLeaves.length > 0 && selectedLeaves.length === allSelectableLeaves.length) {
        // All selected → fully checked
        selected.push(unitNode);
      } else if (selectedLeaves.length > 0) {
        // Some selected → partial (indeterminate)
        unitNode.partialSelected = true;
      }

      return unitNode;
    };

    const nodes = rootUnits.map(buildNode);
    return { nodes, selected };
  }

  private extractSelectedUnitProfileIds(nodes: TreeNode[]): string[] {
    const ids: string[] = [];
    for (const node of nodes) {
      if (node.data?.type === 'profile') {
        ids.push(node.data.unitProfileId);
      }
    }
    return ids;
  }

  private collectProfileLeaves(nodes: TreeNode[]): TreeNode[] {
    const leaves: TreeNode[] = [];
    for (const node of nodes) {
      if (node.data?.type === 'profile') {
        leaves.push(node);
      } else if (node.children) {
        leaves.push(...this.collectProfileLeaves(node.children));
      }
    }
    return leaves;
  }
}
