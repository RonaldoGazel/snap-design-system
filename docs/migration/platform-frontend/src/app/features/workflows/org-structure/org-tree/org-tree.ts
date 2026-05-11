import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { BpmsOrgUnit } from '../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-org-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TreeModule, InputTextModule, CardModule, TagModule,
    TranslateModule
  ],
  templateUrl: './org-tree.html',
  styleUrl: './org-tree.css',
})
export class OrgTreeComponent implements OnInit {
  private readonly orgState = inject(BpmsOrgStateService);
  private readonly router = inject(Router);

  readonly searchText = signal('');
  readonly selectedUnit = signal<BpmsOrgUnit | null>(null);
  readonly treeSelection = signal<TreeNode | null>(null);

  readonly treeNodes = computed<TreeNode[]>(() => {
    const units = this.orgState.units();
    const search = this.searchText().toLowerCase();
    return buildOrgTree(units, search);
  });

  readonly unitPath = computed(() => {
    const unit = this.selectedUnit();
    if (!unit) return [];
    return this.orgState.getUnitPath(unit.id);
  });

  readonly unitProfiles = computed(() => {
    const unit = this.selectedUnit();
    if (!unit) return [];
    return this.orgState.getProfileHierarchy(unit.id);
  });

  ngOnInit(): void {
    this.orgState.loadAll();
  }

  onNodeSelect(event: { node: TreeNode }): void {
    const data = event.node.data as BpmsOrgUnit;
    this.selectedUnit.set(data);
  }

  navigateToDetail(unit: BpmsOrgUnit): void {
    this.router.navigate(['/intelligence/workflows/org-structure', unit.id]);
  }
}

function buildOrgTree(units: BpmsOrgUnit[], search: string): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const u of units) {
    const label = `${u.acronym} — ${u.name}`;
    map.set(u.id, {
      key: u.id,
      label,
      data: u,
      icon: u.level === 0 ? 'pi pi-building' : u.level === 1 ? 'pi pi-sitemap' : 'pi pi-circle',
      expanded: true,
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

  if (search) {
    return filterTree(roots, search);
  }

  return roots;
}

function filterTree(nodes: TreeNode[], search: string): TreeNode[] {
  return nodes.reduce<TreeNode[]>((acc, node) => {
    const children = filterTree((node.children as TreeNode[]) ?? [], search);
    const matches = (node.label ?? '').toLowerCase().includes(search);
    if (matches || children.length > 0) {
      acc.push({ ...node, children, expanded: true });
    }
    return acc;
  }, []);
}
