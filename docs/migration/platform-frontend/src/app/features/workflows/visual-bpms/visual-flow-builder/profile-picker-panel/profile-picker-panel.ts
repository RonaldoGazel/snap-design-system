import { Component, computed, input, output, signal, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { BpmsVisualFlowStage } from '../../../models/visual-bpms.model';
import { BpmsUnitProfile, BpmsOrgUnit, BpmsProfile } from '../../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-picker-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, SelectModule, ButtonModule, TooltipModule,
    TranslateModule
  ],
  templateUrl: './profile-picker-panel.html',
  styleUrl: './profile-picker-panel.css',
})
export class ProfilePickerPanelComponent {
  // --- Inputs ---
  readonly selectedStage = input.required<BpmsVisualFlowStage | null>();
  readonly unitProfiles = input.required<BpmsUnitProfile[]>();
  readonly orgUnits = input.required<BpmsOrgUnit[]>();
  readonly profiles = input.required<BpmsProfile[]>();

  // --- Outputs ---
  readonly profileAdded = output<{ stageId: string; unitProfileId: string }>();
  readonly profileRemoved = output<{ stageId: string; stageProfileId: string }>();

  // --- Filter signals ---
  readonly filterUnit = signal<string | null>(null);
  readonly filterProfile = signal<string | null>(null);

  // --- Computed: dropdown options ---
  readonly unitOptions = computed(() => {
    const all = { label: 'Todos', value: null as string | null };
    const units = this.orgUnits()
      .filter((u) => u.is_active)
      .map((u) => ({ label: `${u.acronym} — ${u.name}`, value: u.id }));
    return [all, ...units];
  });

  readonly profileOptions = computed(() => {
    const all = { label: 'Todos', value: null as string | null };
    const profs = this.profiles()
      .filter((p) => p.is_active)
      .map((p) => ({ label: p.name, value: p.id }));
    return [all, ...profs];
  });

  // --- Computed: IDs of unit_profiles already added to the selected stage ---
  readonly addedUnitProfileIds = computed(() => {
    const stage = this.selectedStage();
    if (!stage) return new Set<string>();
    return new Set((stage.profiles ?? []).map((p) => p.unit_profile_id));
  });

  // --- Computed: filtered unit profiles with AND logic ---
  readonly filteredUnitProfiles = computed(() => {
    const unitFilter = this.filterUnit();
    const profileFilter = this.filterProfile();

    return this.unitProfiles()
      .filter((up) => up.is_active)
      .filter((up) => !unitFilter || up.unit_id === unitFilter)
      .filter((up) => !profileFilter || up.profile_id === profileFilter);
  });

  // --- Actions ---

  isAlreadyAdded(unitProfileId: string): boolean {
    return this.addedUnitProfileIds().has(unitProfileId);
  }

  addProfile(unitProfileId: string): void {
    const stage = this.selectedStage();
    if (!stage || this.isAlreadyAdded(unitProfileId)) return;
    this.profileAdded.emit({ stageId: stage.id, unitProfileId });
  }

  removeProfile(stageProfileId: string): void {
    const stage = this.selectedStage();
    if (!stage) return;
    this.profileRemoved.emit({ stageId: stage.id, stageProfileId });
  }

  getDisplayName(up: BpmsUnitProfile): string {
    const profileName = up.profile?.name ?? 'Perfil';
    const unitAcronym = up.unit?.acronym ?? 'Unidade';
    return `${profileName} — ${unitAcronym}`;
  }
}
