import { Component, computed, input, output, signal, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TreeNode } from 'primeng/api';

import { BpmsOrgUnit, BpmsProfile } from '../../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

export interface CanvasFilter {
  unitIds: Set<string>;    // selected org unit IDs (empty = all)
  profileIds: Set<string>; // selected profile type IDs (empty = all)
}

@Component({
  selector: 'app-canvas-filter-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TreeModule, CheckboxModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './canvas-filter-panel.html',
  styleUrl: './canvas-filter-panel.css',
})
export class CanvasFilterPanelComponent {
  readonly orgUnits = input.required<BpmsOrgUnit[]>();
  readonly profiles = input.required<BpmsProfile[]>();
  readonly filterChanged = output<CanvasFilter>();

  readonly expanded = signal(false);
  readonly selectedUnitNodes = signal<TreeNode[]>([]);
  readonly selectedProfileIds = signal<Set<string>>(new Set());

  readonly unitTree = computed(() => this.buildUnitTree(this.orgUnits()));

  readonly activeProfiles = computed(() =>
    this.profiles().filter((p) => p.is_active),
  );

  readonly hasActiveFilters = computed(() =>
    this.selectedUnitNodes().length > 0 || this.selectedProfileIds().size > 0,
  );

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  onUnitSelectionChange(nodes: TreeNode[]): void {
    this.selectedUnitNodes.set(nodes);
    this.emitFilter();
  }

  toggleProfile(profileId: string): void {
    const current = this.selectedProfileIds();
    const updated = new Set(current);
    if (updated.has(profileId)) {
      updated.delete(profileId);
    } else {
      updated.add(profileId);
    }
    this.selectedProfileIds.set(updated);
    this.emitFilter();
  }

  isProfileSelected(profileId: string): boolean {
    return this.selectedProfileIds().has(profileId);
  }

  clearFilters(): void {
    this.selectedUnitNodes.set([]);
    this.selectedProfileIds.set(new Set());
    this.emitFilter();
  }

  private emitFilter(): void {
    const unitIds = new Set<string>();
    for (const node of this.selectedUnitNodes()) {
      if (node.data?.unitId) unitIds.add(node.data.unitId);
    }
    this.filterChanged.emit({
      unitIds,
      profileIds: new Set(this.selectedProfileIds()),
    });
  }

  private buildUnitTree(orgUnits: BpmsOrgUnit[]): TreeNode[] {
    const roots = orgUnits.filter((u) => !u.parent_id && u.is_active);

    const buildNode = (unit: BpmsOrgUnit): TreeNode => {
      const children = orgUnits
        .filter((u) => u.parent_id === unit.id && u.is_active)
        .map(buildNode);

      return {
        key: unit.id,
        label: `${unit.acronym} — ${unit.name}`,
        data: { unitId: unit.id },
        icon: 'pi pi-building',
        children,
        expanded: false,
      };
    };

    return roots.map(buildNode);
  }
}
