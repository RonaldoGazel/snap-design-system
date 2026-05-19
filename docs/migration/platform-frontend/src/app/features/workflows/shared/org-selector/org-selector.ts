import { Component, OnInit, inject, signal, computed, input, output, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { BpmsOrgUnit, BpmsUnitProfile, UnitProfileCombo } from '../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-org-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TreeModule, InputTextModule, TagModule,
    TranslateModule
  ],
  templateUrl: './org-selector.html',
  styleUrl: './org-selector.css',
})
export class OrgSelectorComponent implements OnInit {
  private readonly orgState = inject(BpmsOrgStateService);

  // Inputs
  readonly multiple = input<boolean>(false);
  readonly selectedCombos = input<UnitProfileCombo[]>([]);

  // Outputs
  readonly selectionChange = output<UnitProfileCombo[]>();

  // State
  readonly searchText = signal('');
  readonly selectedUnit = signal<BpmsOrgUnit | null>(null);
  readonly selectedProfileId = signal<string | null>(null);
  readonly treeSelection = signal<TreeNode | TreeNode[] | null>(null);

  // Computed: tree nodes from org state
  readonly treeNodes = computed<TreeNode[]>(() => {
    const units = this.orgState.units();
    const search = this.searchText().toLowerCase();
    return buildTreeNodes(units, search);
  });

  // Computed: profiles for selected unit
  readonly unitProfiles = computed<BpmsUnitProfile[]>(() => {
    const unit = this.selectedUnit();
    if (!unit) return [];
    return this.orgState.getProfileHierarchy(unit.id);
  });

  ngOnInit(): void {
    if (this.orgState.units().length === 0) {
      this.orgState.loadAll();
    }
  }

  onNodeSelect(event: { node: TreeNode }): void {
    const data = event.node.data as { type: 'unit'; unit: BpmsOrgUnit };
    if (data.type === 'unit') {
      this.selectedUnit.set(data.unit);
      this.selectedProfileId.set(null);
    }
  }

  onProfileSelect(profile: BpmsUnitProfile): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    const combo: UnitProfileCombo = {
      unit_id: unit.id,
      profile_id: profile.profile_id,
      unit,
      profile: profile.profile,
    };

    if (this.multiple()) {
      const current = this.selectedCombos();
      const exists = current.some(
        (c) => c.unit_id === combo.unit_id && c.profile_id === combo.profile_id,
      );
      const updated = exists
        ? current.filter(
            (c) => !(c.unit_id === combo.unit_id && c.profile_id === combo.profile_id),
          )
        : [...current, combo];
      this.selectionChange.emit(updated);
    } else {
      this.selectedProfileId.set(profile.profile_id);
      this.selectionChange.emit([combo]);
    }
  }

  isProfileSelected(profileId: string): boolean {
    const unit = this.selectedUnit();
    if (!unit) return false;
    return this.selectedCombos().some((c) => c.unit_id === unit.id && c.profile_id === profileId);
  }

  getUnitPath(unitId: string): string {
    return this.orgState
      .getUnitPath(unitId)
      .map((u) => u.acronym)
      .join(' > ');
  }
}

function buildTreeNodes(units: BpmsOrgUnit[], search: string): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const u of units) {
    const label = `${u.acronym} — ${u.name}`;
    const matches = !search || label.toLowerCase().includes(search);
    map.set(u.id, {
      key: u.id,
      label,
      data: { type: 'unit', unit: u },
      icon: u.level === 0 ? 'pi pi-building' : u.level === 1 ? 'pi pi-sitemap' : 'pi pi-circle',
      expanded: !search || matches,
      children: [],
    });
  }

  for (const u of units) {
    const node = map.get(u.id)!;
    if (u.parent_id) {
      const parent = map.get(u.parent_id);
      if (parent) (parent.children as TreeNode[]).push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
