import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { Alerta, Pessoa, Tag, Vinculo } from '../models';
import { MOCK_ALERTAS } from '../data/alertas.data';
import { MOCK_PESSOAS } from '../data/pessoas.data';
import { MOCK_TAGS } from '../data/tags.data';
import { MOCK_VINCULOS } from '../data/vinculos.data';
import { PersonServiceClient } from '../../snap/services/person-service-client';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PersonDataService {
  private readonly personClient = inject(PersonServiceClient);
  private readonly useMocks = environment.useMocks;

  /** Whether the initial API call is still in flight. */
  readonly isLoading = signal<boolean>(true);

  /** Error message from the last API call, or null on success. */
  readonly error = signal<string | null>(null);

  /** Fetches people from the real API with conditional mock fallback. */
  readonly pessoas: Signal<Pessoa[]> = toSignal(
    this.personClient.listPersons({ limit: 200 }).pipe(
      map((res) => res.items),
      tap(() => this.error.set(null)),
      catchError((err) => {
        if (this.useMocks) {
          console.warn('[PersonDataService] API call failed, using mock data:', err.message);
          return of(MOCK_PESSOAS);
        }
        this.error.set(err.message ?? 'Failed to load person data');
        return of([] as Pessoa[]);
      }),
      finalize(() => this.isLoading.set(false)),
    ),
    { initialValue: [] },
  );

  readonly alertas: Signal<Alerta[]> = signal(MOCK_ALERTAS);
  readonly vinculos: Signal<Vinculo[]> = signal(MOCK_VINCULOS);
  readonly tags: Signal<Tag[]> = signal(MOCK_TAGS);

  getPessoaById(id: string): Signal<Pessoa | undefined> {
    return computed(() => this.pessoas().find((p) => p.id === id));
  }

  getAlertasByPessoaId(pessoaId: string): Signal<Alerta[]> {
    return computed(() => this.alertas().filter((a) => a.pessoaId === pessoaId));
  }

  getVinculosByPessoaId(pessoaId: string): Signal<Vinculo[]> {
    return computed(() =>
      this.vinculos().filter(
        (v) => v.pessoaOrigemId === pessoaId || v.pessoaDestinoId === pessoaId,
      ),
    );
  }

  getTagsByPessoaId(pessoaId: string): Signal<Tag[]> {
    return computed(() => {
      const pessoa = this.pessoas().find((p) => p.id === pessoaId);
      return pessoa?.tagsRelevantes ?? [];
    });
  }
}
