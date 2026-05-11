// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Real API Data Source
//
// Implements PersonRegistrationDataSource using the existing PersonServiceClient
// and poi-service endpoints. Reuses the platform's HTTP client, auth interceptor,
// and runtime config — no duplicate HTTP setup.
//
// Search methods query already-persisted persons via GET /person/list.
// Registration triggers the async generate-person pipeline and polls task status.
// ─────────────────────────────────────────────────────────────────────────────

import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PersonServiceClient } from '../../../../snap/services/person-service-client';
import { RuntimeConfigService } from '../../../../../services/runtime-config.service';
import { HttpClient } from '@angular/common/http';
import type { Pessoa } from '../../../models/pessoa.model';
import { mapApiPersonToPessoa } from '../../../services/api-person-mapper';
import type {
  DataSource,
  FullProfile,
  NormalizedFormData,
  PersonMatch,
  RegistrationSummary,
  SecrecyOption,
} from '../../../models/registration.model';
import { PersonRegistrationDataSource } from './person-registration-data-source';
import { mapPessoaToPersonMatch, mapPessoaToFullProfile } from './pessoa-to-person-match.mapper';

/** Task status response from GET /api/v1/poi/tasks/{task_id}. */
interface TaskStatusResponse {
  id: string;
  status: string;
  source_type: string;
  organization_id: string;
  correlation_id: string;
  target_graph_id: string | null;
  error_details: Record<string, unknown> | null;
  requested_by: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Generate-person 202 response. */
interface GeneratePersonAcceptedResponse {
  status: string;
  message: string;
  task_id: string | null;
}

/** Terminal task statuses. */
const TERMINAL_STATUSES = new Set(['completed', 'queued_for_ingestion', 'failed', 'cancelled']);

/** Max polling attempts before giving up. */
const MAX_POLL_ATTEMPTS = 30;

/** Initial polling interval in ms. */
const INITIAL_POLL_INTERVAL = 2000;

/** Max polling interval in ms. */
const MAX_POLL_INTERVAL = 8000;

/**
 * Real API implementation of `PersonRegistrationDataSource`.
 *
 * Uses the existing `PersonServiceClient` for person listing and the
 * poi-service generate-person endpoints for registration. Confidence
 * scoring and match type classification are computed client-side.
 *
 * The generate-person endpoints are async (HTTP 202 + task_id), so
 * `registerPerson()` polls the task status until completion.
 */
@Injectable()
export class ApiRegistrationDataSource extends PersonRegistrationDataSource {
  private readonly personClient = inject(PersonServiceClient);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(RuntimeConfigService).config.personServiceUrl;

  /**
   * Search persisted persons in the local database.
   *
   * Calls GET /person/list without a source filter to find all persisted
   * persons matching the input. Results are scored and classified client-side.
   */
  async searchLocal(data: NormalizedFormData): Promise<PersonMatch[]> {
    const query = this.buildSearchQuery(data);
    if (!query) return [];

    try {
      const response = await firstValueFrom(this.personClient.listPersons({ q: query, limit: 20 }));

      return response.items
        .map((pessoa) => mapPessoaToPersonMatch(pessoa, data, 'BASE_LOCAL'))
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      // Network or server error — return empty (local search is non-critical)
      return [];
    }
  }

  /**
   * Search persisted SIPEN persons.
   *
   * Calls GET /person/list?source=SIPEN to find persons previously ingested
   * from SIPEN. Returns null on error to trigger the error UI.
   */
  async searchSipen(data: NormalizedFormData): Promise<PersonMatch[] | null> {
    const query = this.buildSearchQuery(data);
    if (!query) return [];

    try {
      const response = await firstValueFrom(
        this.personClient.listPersons({ source: 'SIPEN', q: query, limit: 20 }),
      );

      return response.items
        .map((pessoa) => mapPessoaToPersonMatch(pessoa, data, 'SIPEN'))
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      return null; // signals error to the flow service
    }
  }

  /**
   * Search persisted SNAP persons.
   *
   * Calls GET /person/list?source=SNAP to find persons previously ingested
   * from SNAP. Returns null on error to trigger the error UI.
   */
  async searchSnap(data: NormalizedFormData): Promise<PersonMatch[] | null> {
    const query = this.buildSearchQuery(data);
    if (!query) return [];

    try {
      const response = await firstValueFrom(
        this.personClient.listPersons({ source: 'SNAP', q: query, limit: 20 }),
      );

      return response.items
        .map((pessoa) => mapPessoaToPersonMatch(pessoa, data, 'SNAP'))
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      return null; // signals error to the flow service
    }
  }

  /**
   * Fetch full person detail from the API.
   *
   * Calls GET /person/{id} and maps the response to a FullProfile.
   */
  async fetchFullProfile(personId: string, source: DataSource): Promise<FullProfile> {
    const raw = await firstValueFrom(this.personClient.getPersonById(personId));
    const pessoa: Pessoa = mapApiPersonToPessoa(raw);

    // Build a minimal NormalizedFormData for the mapper (used for confidence scoring)
    const input: NormalizedFormData = {
      nome: pessoa.nome,
      nomeNormalized: pessoa.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
      uf: '',
      vulgo: '',
      rg: '',
      cpf: pessoa.cpf ?? '',
      cpfNormalized: pessoa.cpf?.replace(/\D/g, '') ?? '',
      hasValidCPF: (pessoa.cpf?.replace(/\D/g, '') ?? '').length === 11,
      hasValidNome: pessoa.nome.length >= 3,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: false,
    };

    return mapPessoaToFullProfile(pessoa, input, source);
  }

  /**
   * Register a person by triggering the generate-person pipeline.
   *
   * 1. POST /generate-person/sipen or /snap → receives task_id (HTTP 202)
   * 2. Poll GET /tasks/{task_id} until terminal status
   * 3. Return a RegistrationSummary
   *
   * The `secrecy` option maps to `target_visibility`:
   * - PUBLICO → "public"
   * - RESERVADO → "private"
   */
  async registerPerson(person: PersonMatch, secrecy: SecrecyOption): Promise<RegistrationSummary> {
    const cpf = person.cpfNormalized || person.cpf.replace(/\D/g, '');
    const targetVisibility = secrecy === 'RESERVADO' ? 'private' : 'public';
    const source = person.source === 'SIPEN' ? 'sipen' : 'snap';

    // 1. Trigger the pipeline
    const accepted = await firstValueFrom(
      this.http.post<GeneratePersonAcceptedResponse>(`${this.apiUrl}/generate-person/${source}`, {
        cpf,
        target_visibility: targetVisibility,
      }),
    );

    // 2. Poll task status if we got a task_id
    if (accepted.task_id) {
      await this.pollTaskUntilDone(accepted.task_id);
    }

    // 3. Return summary
    return {
      personName: person.fullName,
      cpf: person.cpf,
      source: person.source,
      secrecy,
      sector: secrecy === 'RESERVADO' ? 'Superintendência de Inteligência' : undefined,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Trigger person generation from an external source and return the results.
   *
   * 1. POST /generate-person/{source} with the CPF → receives task_id (HTTP 202)
   * 2. Poll GET /tasks/{task_id} until terminal status
   * 3. Re-search GET /person/list?source={SOURCE}&q={cpf} to find the generated person
   * 4. Return the matched persons
   */
  async generateFromSource(
    cpf: string,
    source: 'SIPEN' | 'SNAP',
    visibility: 'public' | 'private' = 'public',
  ): Promise<PersonMatch[] | null> {
    const sourceLower = source.toLowerCase();
    const dataSource: DataSource = source;

    try {
      // 1. Trigger the pipeline
      const accepted = await firstValueFrom(
        this.http.post<GeneratePersonAcceptedResponse>(
          `${this.apiUrl}/generate-person/${sourceLower}`,
          { cpf, target_visibility: visibility },
        ),
      );

      // 2. Poll task status
      if (accepted.task_id) {
        await this.pollTaskUntilDone(accepted.task_id);
      }

      // 3. Re-search to find the generated person
      const response = await firstValueFrom(
        this.personClient.listPersons({ source, q: cpf, limit: 10 }),
      );

      // Build a minimal NormalizedFormData for the mapper
      const input: NormalizedFormData = {
        nome: '',
        nomeNormalized: '',
        uf: '',
        vulgo: '',
        rg: '',
        cpf,
        cpfNormalized: cpf.replace(/\D/g, ''),
        hasValidCPF: true,
        hasValidNome: false,
        hasValidVulgo: false,
        hasValidRG: false,
        isSnapEligible: true,
      };

      return response.items
        .map((pessoa) => mapPessoaToPersonMatch(pessoa, input, dataSource))
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      return null;
    }
  }

  /**
   * Build a search query string from the normalized form data.
   * Prioritizes CPF (exact), then name, then vulgo.
   */
  private buildSearchQuery(data: NormalizedFormData): string {
    if (data.cpfNormalized) return data.cpfNormalized;
    if (data.nomeNormalized) return data.nome; // use original (not normalized) for API
    if (data.vulgo) return data.vulgo;
    if (data.rg) return data.rg;
    return '';
  }

  /**
   * Poll GET /tasks/{task_id} with exponential backoff until the task
   * reaches a terminal status or we exceed the max attempts.
   */
  private async pollTaskUntilDone(taskId: string): Promise<TaskStatusResponse> {
    let interval = INITIAL_POLL_INTERVAL;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await this.delay(interval);

      try {
        const task = await firstValueFrom(
          this.http.get<TaskStatusResponse>(`${this.apiUrl}/tasks/${taskId}`),
        );

        if (TERMINAL_STATUSES.has(task.status)) {
          if (task.status === 'failed') {
            throw new Error(
              `Task ${taskId} failed: ${task.error_details?.['message'] ?? 'unknown error'}`,
            );
          }
          return task;
        }
      } catch (err) {
        // If it's our own thrown error (task failed), re-throw
        if (err instanceof Error && err.message.startsWith('Task ')) {
          throw err;
        }
        // Otherwise it's a network error — continue polling
      }

      // Exponential backoff capped at MAX_POLL_INTERVAL
      interval = Math.min(interval * 1.5, MAX_POLL_INTERVAL);
    }

    throw new Error(`Task ${taskId} did not complete within polling timeout`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
