import { Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { BpmsApiService } from '../../services/bpms-api.service';
import { OrgSelectorComponent } from '../../shared/org-selector/org-selector';
import { UnitProfileCombo } from '../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bpms-process-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, TextareaModule, ButtonModule, OrgSelectorComponent,
    TranslateModule
  ],
  templateUrl: './process-form.html',
  styleUrl: './process-form.css',
})
export class ProcessFormComponent {
  private readonly api = inject(BpmsApiService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly originCombos = signal<UnitProfileCombo[]>([]);

  readonly form = this.fb.group({
    identifier: ['', [Validators.required, Validators.maxLength(100)]],
    subject: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
  });

  onOriginChange(combos: UnitProfileCombo[]): void { this.originCombos.set(combos); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage.set(null);
    this.saving.set(true);
    const value = this.form.getRawValue();
    const origin = this.originCombos()[0];
    const payload = {
      identifier: value.identifier ?? '',
      subject: value.subject ?? '',
      description: value.description ?? undefined,
      origin_unit_id: origin?.unit_id,
      origin_profile_id: origin?.profile_id,
    };
    this.api.createProcess(payload).subscribe({
      next: (process) => this.router.navigate(['/intelligence/workflows/processes', process.id]),
      error: (err: { error?: { message?: string } }) => { this.saving.set(false); this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.createProcessFailed')); },
    });
  }

  goBack(): void { this.router.navigate(['/intelligence/workflows/processes']); }
  isInvalid(field: string): boolean { const ctrl = this.form.get(field); return !!(ctrl?.invalid && ctrl.touched); }
}
