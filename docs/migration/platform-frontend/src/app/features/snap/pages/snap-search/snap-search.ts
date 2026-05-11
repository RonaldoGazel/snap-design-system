import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TranslateModule } from '@ngx-translate/core';

import {
  GeneratePersonResponse,
  SnapSearchError,
  SnapSearchErrorCode,
} from '../../models/person.model';
import { PersonServiceClient } from '../../services/person-service-client';
import { formatCpf } from '../../utils/cpf-format';

@Component({
  selector: 'app-snap-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, InputTextModule, Message, ProgressSpinner, TranslateModule],
  templateUrl: './snap-search.html',
  styleUrl: './snap-search.scss',
})
export class SnapSearchPage {
  private readonly personService = inject(PersonServiceClient);

  protected readonly cpfInput = signal('');
  protected readonly cpfDigits = computed(() => this.cpfInput().replace(/\D/g, ''));
  protected readonly isValid = computed(() => this.cpfDigits().length === 11);
  protected readonly loading = signal(false);
  protected readonly result = signal<GeneratePersonResponse | null>(null);
  protected readonly error = signal<SnapSearchError | null>(null);
  protected readonly targetVisibility = signal<'public' | 'private'>('public');

  protected onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCpf(input.value);
    this.cpfInput.set(formatted);
    input.value = formatted;
  }

  protected search(): void {
    this.error.set(null);
    this.result.set(null);

    if (!this.isValid()) {
      return;
    }

    this.loading.set(true);

    this.personService.generatePerson(this.cpfDigits(), this.targetVisibility()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.result.set(response);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.mapError(err));
      },
    });
  }

  protected retry(): void {
    this.search();
  }

  private mapError(err: HttpErrorResponse): SnapSearchError {
    const map: Record<number, { code: SnapSearchErrorCode; retryable: boolean }> = {
      400: { code: 'badRequest', retryable: false },
      403: { code: 'forbidden', retryable: false },
      404: { code: 'notFound', retryable: false },
      503: { code: 'serviceUnavailable', retryable: true },
    };

    if (err.status === 0) {
      return { code: 'networkError', retryable: true };
    }

    return map[err.status] ?? { code: 'badRequest', retryable: false };
  }
}
