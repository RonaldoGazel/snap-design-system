import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

import { normalizeFormData, applyCPFMask } from '../../../../models/registration.utils';
import { UF_LIST } from '../../../../models/registration.model';
import type { NormalizedFormData } from '../../../../models/registration.model';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ButtonModule],
})
export class RegistrationFormComponent {
  private readonly location = inject(Location);

  /** Whether the form should be disabled (e.g. during queries). */
  readonly isDisabled = input<boolean>(false);

  /** Emits normalized form data when the user submits a valid form. */
  readonly formSubmit = output<NormalizedFormData>();

  /** Inline validation error message. */
  readonly errorMessage = signal<string>('');

  /** Reactive form with all registration fields. */
  protected readonly form = new FormGroup({
    nome: new FormControl(''),
    uf: new FormControl(''),
    vulgo: new FormControl(''),
    rg: new FormControl(''),
    cpf: new FormControl(''),
  });

  /** UF dropdown options mapped to PrimeNG SelectItem format. */
  protected readonly ufOptions = UF_LIST.map((uf) => ({ label: uf, value: uf }));

  /**
   * Apply progressive CPF mask on each input event.
   */
  protected onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = applyCPFMask(input.value);
    this.form.get('cpf')!.setValue(masked, { emitEvent: false });
    input.value = masked;
  }

  /**
   * Validate and submit the form.
   *
   * - Normalizes form data
   * - Checks that at least one valid datum exists
   * - Emits normalized data on success
   */
  protected onSubmit(): void {
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const normalized = normalizeFormData({
      nome: raw.nome ?? '',
      uf: raw.uf ?? '',
      vulgo: raw.vulgo ?? '',
      rg: raw.rg ?? '',
      cpf: raw.cpf ?? '',
    });

    // Check at least one valid datum
    if (
      !normalized.hasValidCPF &&
      !normalized.hasValidNome &&
      !normalized.hasValidVulgo &&
      !normalized.hasValidRG
    ) {
      this.errorMessage.set('Informe pelo menos um dado válido para iniciar o cadastro da pessoa.');
      return;
    }

    this.formSubmit.emit(normalized);
  }

  /**
   * Navigate back (cancel registration).
   */
  protected onCancel(): void {
    this.location.back();
  }
}
