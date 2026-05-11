import { Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsOrgStateService } from '../../services/bpms-org-state.service';
import { OrgSelectorComponent } from '../../shared/org-selector/org-selector';
import { BpmsFlowRole, UnitProfileCombo } from '../../models/bpms.model';
import { RoleCode } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-role-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, TagModule, OrgSelectorComponent,
    TranslateModule
  ],
  templateUrl: './flow-role-editor.html',
  styleUrl: './flow-role-editor.css',
})
export class FlowRoleEditorComponent {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly orgState = inject(BpmsOrgStateService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly roles = this.flowState.roles;
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedCombos = signal<UnitProfileCombo[]>([]);

  readonly roleCodeOptions = [
    { label: 'Criador', value: RoleCode.CRIADOR },
    { label: 'Produtor', value: RoleCode.PRODUTOR },
    { label: 'Revisor', value: RoleCode.REVISOR },
    { label: this.translate.instant('workflows.capability.FORMALIZE'), value: RoleCode.FORMALIZADOR },
    { label: this.translate.instant('workflows.capability.AUTHORIZE_DISSEMINATION'), value: RoleCode.AUTORIZADOR_DIFUSAO },
    { label: this.translate.instant('workflows.capability.EXECUTE_DISSEMINATION'), value: RoleCode.EXECUTOR_DIFUSAO }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: [RoleCode.CRIADOR as string, Validators.required],
    description: [''],
  });

  openForm(role?: BpmsFlowRole): void {
    if (role) {
      this.editingId.set(role.id);
      this.form.patchValue({ name: role.name, code: role.code, description: role.description ?? '' });
      const combos: UnitProfileCombo[] = [];
      if (role.unit_id && role.profile_id) {
        const unit = this.orgState.unitMap().get(role.unit_id);
        const profile = this.orgState.profiles().find(p => p.id === role.profile_id);
        combos.push({ unit_id: role.unit_id, profile_id: role.profile_id, unit, profile });
      }
      this.selectedCombos.set(combos);
    } else {
      this.editingId.set(null);
      this.form.reset({ code: RoleCode.CRIADOR });
      this.selectedCombos.set([]);
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); this.form.reset(); this.selectedCombos.set([]); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const combo = this.selectedCombos()[0] ?? null;
    const id = this.editingId();
    if (id) {
      this.flowState.roles.update(list => list.map(r => r.id === id
        ? { ...r, name: value.name ?? '', code: value.code as RoleCode, description: value.description ?? undefined, unit_id: combo?.unit_id ?? undefined, profile_id: combo?.profile_id ?? undefined }
        : r));
    } else {
      const newRole: BpmsFlowRole = {
        id: crypto.randomUUID(), flow_version_id: this.flowState.currentVersion()?.id ?? '',
        name: value.name ?? '', code: value.code as RoleCode, description: value.description ?? undefined,
        unit_id: combo?.unit_id ?? undefined, profile_id: combo?.profile_id ?? undefined,
      };
      this.flowState.addRole(newRole);
    }
    this.closeForm();
  }

  removeRole(id: string): void { this.flowState.roles.update(list => list.filter(r => r.id !== id)); }
  saveAll(): void { this.flowState.saveAll(); }
  onSelectionChange(combos: UnitProfileCombo[]): void { this.selectedCombos.set(combos); }
  roleName(code: string): string { return this.roleCodeOptions.find(o => o.value === code)?.label ?? code; }
  unitName(id: string): string { const u = this.orgState.unitMap().get(id); return u ? `${u.acronym}` : id; }
  profileName(id: string): string { return this.orgState.profiles().find(p => p.id === id)?.name ?? id; }
  isInvalid(field: string): boolean { const ctrl = this.form.get(field); return !!(ctrl?.invalid && ctrl.touched); }
}
