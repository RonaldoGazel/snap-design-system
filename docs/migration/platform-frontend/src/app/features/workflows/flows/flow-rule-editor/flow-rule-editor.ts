import { Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { OrgSelectorComponent } from '../../shared/org-selector/org-selector';
import { BpmsFlowRule, UnitProfileCombo } from '../../models/bpms.model';
import { RuleType, RuleScope } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-rule-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, SelectModule, ButtonModule, TagModule, CheckboxModule, InputNumberModule, OrgSelectorComponent,
    TranslateModule
  ],
  templateUrl: './flow-rule-editor.html',
  styleUrl: './flow-rule-editor.css',
})
export class FlowRuleEditorComponent {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly orgState = inject(BpmsOrgStateService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly rules = computed(() => this.flowState.rules().filter(r => !r.is_exception));
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly sourceCombo = signal<UnitProfileCombo[]>([]);
  readonly targetCombo = signal<UnitProfileCombo[]>([]);

  readonly ruleTypeOptions = [
    { label: this.translate.instant('workflows.eventType.creation'), value: RuleType.CRIACAO },
    { label: this.translate.instant('workflows.eventType.routing'), value: RuleType.TRAMITACAO },
    { label: this.translate.instant('workflows.stepType.formalization'), value: RuleType.FORMALIZACAO },
    { label: this.translate.instant('workflows.stepType.internal_dissemination'), value: RuleType.DIFUSAO_INTERNA },
    { label: this.translate.instant('workflows.stepType.external_dissemination'), value: RuleType.DIFUSAO_EXTERNA }
  ];

  readonly ruleScopeOptions = [
    { label: 'Permissão', value: RuleScope.PERMISSAO },
    { label: 'Restrição', value: RuleScope.RESTRICAO },
    { label: 'Vedação', value: RuleScope.VEDACAO }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    type: [RuleType.CRIACAO as string, Validators.required],
    scope: [RuleScope.PERMISSAO as string, Validators.required],
    action: [''],
    priority: [0],
    is_active: [true],
  });

  openForm(rule?: BpmsFlowRule): void {
    if (rule) {
      this.editingId.set(rule.id);
      this.form.patchValue({ name: rule.name, type: rule.type, scope: rule.scope, action: rule.action ?? '', priority: rule.priority, is_active: rule.is_active });
      const src: UnitProfileCombo[] = [];
      if (rule.source_unit_id && rule.source_profile_id) {
        src.push({ unit_id: rule.source_unit_id, profile_id: rule.source_profile_id, unit: this.orgState.unitMap().get(rule.source_unit_id), profile: this.orgState.profiles().find(p => p.id === rule.source_profile_id) });
      }
      const tgt: UnitProfileCombo[] = [];
      if (rule.target_unit_id && rule.target_profile_id) {
        tgt.push({ unit_id: rule.target_unit_id, profile_id: rule.target_profile_id, unit: this.orgState.unitMap().get(rule.target_unit_id), profile: this.orgState.profiles().find(p => p.id === rule.target_profile_id) });
      }
      this.sourceCombo.set(src);
      this.targetCombo.set(tgt);
    } else {
      this.editingId.set(null);
      this.form.reset({ type: RuleType.CRIACAO, scope: RuleScope.PERMISSAO, priority: 0, is_active: true });
      this.sourceCombo.set([]);
      this.targetCombo.set([]);
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); this.form.reset(); this.sourceCombo.set([]); this.targetCombo.set([]); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const src = this.sourceCombo()[0] ?? null;
    const tgt = this.targetCombo()[0] ?? null;
    const id = this.editingId();
    if (id) {
      this.flowState.rules.update(list => list.map(r => r.id === id
        ? { ...r, name: value.name ?? '', type: value.type as RuleType, scope: value.scope as RuleScope, action: value.action ?? undefined, priority: value.priority ?? 0, is_active: value.is_active ?? true, source_unit_id: src?.unit_id ?? undefined, source_profile_id: src?.profile_id ?? undefined, target_unit_id: tgt?.unit_id ?? undefined, target_profile_id: tgt?.profile_id ?? undefined }
        : r));
    } else {
      const newRule: BpmsFlowRule = {
        id: crypto.randomUUID(), flow_version_id: this.flowState.currentVersion()?.id ?? '',
        name: value.name ?? '', type: value.type as RuleType, scope: value.scope as RuleScope,
        action: value.action ?? undefined, priority: value.priority ?? 0, is_active: value.is_active ?? true, is_exception: false,
        source_unit_id: src?.unit_id ?? undefined, source_profile_id: src?.profile_id ?? undefined,
        target_unit_id: tgt?.unit_id ?? undefined, target_profile_id: tgt?.profile_id ?? undefined,
      };
      this.flowState.addRule(newRule);
    }
    this.closeForm();
  }

  removeRule(id: string): void { this.flowState.rules.update(list => list.filter(r => r.id !== id)); }
  saveAll(): void { this.flowState.saveAll(); }
  onSourceChange(combos: UnitProfileCombo[]): void { this.sourceCombo.set(combos); }
  onTargetChange(combos: UnitProfileCombo[]): void { this.targetCombo.set(combos); }
  ruleTypeName(type: string): string { return this.ruleTypeOptions.find(o => o.value === type)?.label ?? type; }
  ruleScopeName(scope: string): string { return this.ruleScopeOptions.find(o => o.value === scope)?.label ?? scope; }
  unitName(id: string): string { const u = this.orgState.unitMap().get(id); return u ? u.acronym : id; }
  profileName(id: string): string { return this.orgState.profiles().find(p => p.id === id)?.name ?? id; }
  isInvalid(field: string): boolean { const ctrl = this.form.get(field); return !!(ctrl?.invalid && ctrl.touched); }
}
