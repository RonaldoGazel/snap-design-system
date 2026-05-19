import { Injectable, inject, signal, computed } from '@angular/core';
import { BpmsApiService } from './bpms-api.service';
import { BpmsOrgUnit, BpmsProfile, BpmsUnitProfile } from '../models/bpms.model';

@Injectable({ providedIn: 'root' })
export class BpmsOrgStateService {
  private readonly api = inject(BpmsApiService);

  readonly units = signal<BpmsOrgUnit[]>([]);
  readonly profiles = signal<BpmsProfile[]>([]);
  readonly unitProfiles = signal<BpmsUnitProfile[]>([]);

  // Computed: flat map of id -> unit
  readonly unitMap = computed(() => {
    const map = new Map<string, BpmsOrgUnit>();
    for (const u of this.units()) map.set(u.id, u);
    return map;
  });

  // Computed: hierarchical tree (root nodes with children populated)
  readonly unitTree = computed(() => buildTree(this.units()));

  // Computed: unitId -> BpmsUnitProfile[]
  readonly profilesByUnit = computed(() => {
    const map = new Map<string, BpmsUnitProfile[]>();
    for (const up of this.unitProfiles()) {
      const list = map.get(up.unit_id) ?? [];
      list.push(up);
      map.set(up.unit_id, list);
    }
    return map;
  });

  loadAll(): void {
    this.api.getOrgUnits().subscribe(units => this.units.set(units));
    this.api.getProfiles().subscribe(profiles => this.profiles.set(profiles));
    this.api.getUnitProfiles().subscribe(ups => this.unitProfiles.set(ups));
  }

  // Returns the path from root to the given unit (inclusive)
  getUnitPath(unitId: string): BpmsOrgUnit[] {
    const map = this.unitMap();
    const path: BpmsOrgUnit[] = [];
    let current = map.get(unitId);
    while (current) {
      path.unshift(current);
      current = current.parent_id ? map.get(current.parent_id) : undefined;
    }
    return path;
  }

  // Returns unit profiles sorted by hierarchy_order for a given unit
  getProfileHierarchy(unitId: string): BpmsUnitProfile[] {
    return (this.profilesByUnit().get(unitId) ?? [])
      .slice()
      .sort((a, b) => a.hierarchy_order - b.hierarchy_order);
  }

  // Returns true if the given unit+profile combination exists and is active
  isValidUnitProfile(unitId: string, profileId: string): boolean {
    return this.unitProfiles().some(
      up => up.unit_id === unitId && up.profile_id === profileId && up.is_active,
    );
  }
}

// Helper: build tree from flat list
function buildTree(units: BpmsOrgUnit[]): BpmsOrgUnit[] {
  const map = new Map<string, BpmsOrgUnit & { children: BpmsOrgUnit[] }>();
  const roots: (BpmsOrgUnit & { children: BpmsOrgUnit[] })[] = [];

  for (const u of units) {
    map.set(u.id, { ...u, children: [] });
  }

  for (const u of map.values()) {
    if (u.parent_id) {
      const parent = map.get(u.parent_id);
      if (parent) parent.children.push(u);
    } else {
      roots.push(u);
    }
  }

  return roots;
}
