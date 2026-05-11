import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { BpmsOrgUnit, BpmsUnitProfile } from '../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-org-unit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagModule, CardModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './org-unit-detail.html',
  styleUrl: './org-unit-detail.css',
})
export class OrgUnitDetailComponent implements OnInit {
  private readonly orgState = inject(BpmsOrgStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly unitId = signal<string | null>(null);

  readonly unit = computed<BpmsOrgUnit | undefined>(() => {
    const id = this.unitId();
    if (!id) return undefined;
    return this.orgState.unitMap().get(id);
  });

  readonly parentUnit = computed<BpmsOrgUnit | undefined>(() => {
    const u = this.unit();
    if (!u?.parent_id) return undefined;
    return this.orgState.unitMap().get(u.parent_id);
  });

  readonly unitPath = computed(() => {
    const id = this.unitId();
    if (!id) return [];
    return this.orgState.getUnitPath(id);
  });

  readonly profiles = computed<BpmsUnitProfile[]>(() => {
    const id = this.unitId();
    if (!id) return [];
    return this.orgState.getProfileHierarchy(id);
  });

  readonly subUnits = computed<BpmsOrgUnit[]>(() => {
    const id = this.unitId();
    if (!id) return [];
    return this.orgState.units().filter(u => u.parent_id === id);
  });

  ngOnInit(): void {
    this.orgState.loadAll();
    this.route.paramMap.subscribe(params => {
      this.unitId.set(params.get('id'));
    });
  }

  goBack(): void {
    this.router.navigate(['/intelligence/workflows/org-structure']);
  }

  navigateToUnit(unit: BpmsOrgUnit): void {
    this.router.navigate(['/intelligence/workflows/org-structure', unit.id]);
  }

  getLevelLabel(level: number): string {
    const labels: Record<number, string> = { 0: 'Raiz', 1: 'Nível 1', 2: 'Subunidade' };
    return labels[level] ?? `Nível ${level}`;
  }
}
