import { Component, inject, computed, ChangeDetectionStrategy} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { RoleCode, StepType } from '../../models/bpms.enums';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-progressive-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagModule, CardModule,
    TranslateModule
  ],
  templateUrl: './progressive-summary.html',
  styleUrl: './progressive-summary.css',
})
export class ProgressiveSummaryComponent {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly orgState = inject(BpmsOrgStateService);

  readonly flow = this.flowState.currentFlow;
  readonly steps = this.flowState.steps;
  readonly roles = this.flowState.roles;
  readonly rules = this.flowState.rules;
  readonly orphanSteps = this.flowState.orphanSteps;
  readonly deadEndTransitions = this.flowState.deadEndTransitions;

  readonly hasInitialStep = this.flowState.hasInitialStep;
  readonly hasFinalStep = this.flowState.hasFinalStep;

  readonly creatorRole = computed(() => this.roles().find(r => r.code === RoleCode.CRIADOR));
  readonly producerRole = computed(() => this.roles().find(r => r.code === RoleCode.PRODUTOR));
  readonly reviewerRole = computed(() => this.roles().find(r => r.code === RoleCode.REVISOR));
  readonly formalizerRole = computed(() => this.roles().find(r => r.code === RoleCode.FORMALIZADOR));
  readonly disseminatorRole = computed(() => this.roles().find(r => r.code === RoleCode.EXECUTOR_DIFUSAO));

  readonly formalizationSteps = computed(() =>
    this.steps().filter(s => s.type === StepType.FORMALIZATION)
  );

  readonly internalDisseminationSteps = computed(() =>
    this.steps().filter(s => s.type === StepType.INTERNAL_DISSEMINATION)
  );

  readonly externalDisseminationSteps = computed(() =>
    this.steps().filter(s => s.type === StepType.EXTERNAL_DISSEMINATION)
  );

  readonly hasConflicts = computed(() =>
    this.orphanSteps().length > 0 || this.deadEndTransitions().length > 0 || !this.hasInitialStep() || !this.hasFinalStep()
  );

  getRoleName(role: { unit_id?: string; profile_id?: string } | undefined): string {
    if (!role) return 'Não configurado';
    const parts: string[] = [];
    if (role.unit_id) {
      const unit = this.orgState.unitMap().get(role.unit_id);
      if (unit) parts.push(unit.acronym);
    }
    if (role.profile_id) {
      const profile = this.orgState.profiles().find(p => p.id === role.profile_id);
      if (profile) parts.push(profile.name);
    }
    return parts.length > 0 ? parts.join(' + ') : 'Qualquer ator autorizado';
  }
}
