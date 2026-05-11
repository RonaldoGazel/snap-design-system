// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Mock Data Source Implementation
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';

import type {
  DataSource,
  FullProfile,
  NormalizedFormData,
  PersonMatch,
  RegistrationSummary,
  SecrecyOption,
} from '../../../models/registration.model';
import {
  MOCK_CONFIG,
  RESULT_SETS,
  findFullProfile,
  getResultSet,
  resolveScenario,
} from '../../../data/registration-mock.data';
import { PersonRegistrationDataSource } from './person-registration-data-source';

/**
 * Mock implementation of `PersonRegistrationDataSource`.
 *
 * Uses static TypeScript data from `registration-mock.data.ts` and simulates
 * network latency via `setTimeout`. Drives the full UX for all 10 scenarios
 * (CEN-001 through CEN-010) without any backend dependency.
 *
 * Latencies (from `MOCK_CONFIG`):
 * - Local search: 800 ms
 * - SIPEN basic search: 1 400 ms
 * - SNAP basic search: 1 600 ms
 * - SIPEN full profile: 6 000 ms
 * - SNAP full profile: 6 500 ms
 * - Registration save: 500 ms
 */
@Injectable()
export class MockRegistrationDataSource extends PersonRegistrationDataSource {
  async searchLocal(data: NormalizedFormData): Promise<PersonMatch[]> {
    const scenario = resolveScenario(data);
    const setName = scenario?.localResultSet ?? 'local-empty';
    const results = getResultSet(setName) ?? [];
    await this.delay(MOCK_CONFIG.latencyMs.localSearch);
    return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  async searchSipen(data: NormalizedFormData): Promise<PersonMatch[] | null> {
    const scenario = resolveScenario(data);
    const setName = scenario?.sipenResultSet;

    if (setName === null || setName === undefined) {
      await this.delay(MOCK_CONFIG.latencyMs.sipenBasicSearch);
      return [];
    }

    const resultSetValue = RESULT_SETS[setName];
    await this.delay(MOCK_CONFIG.latencyMs.sipenBasicSearch);

    // null in RESULT_SETS signals a simulated error
    if (resultSetValue === null) return null;

    return (resultSetValue ?? []).sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  async searchSnap(data: NormalizedFormData): Promise<PersonMatch[] | null> {
    const scenario = resolveScenario(data);
    const setName = scenario?.snapResultSet;

    if (setName === null || setName === undefined) {
      await this.delay(MOCK_CONFIG.latencyMs.snapBasicSearch);
      return [];
    }

    const resultSetValue = RESULT_SETS[setName];
    await this.delay(MOCK_CONFIG.latencyMs.snapBasicSearch);

    // null in RESULT_SETS signals a simulated error
    if (resultSetValue === null) return null;

    return (resultSetValue ?? []).sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  async fetchFullProfile(personId: string, source: DataSource): Promise<FullProfile> {
    const latency =
      source === 'SIPEN'
        ? MOCK_CONFIG.latencyMs.sipenFullProfile
        : MOCK_CONFIG.latencyMs.snapFullProfile;
    await this.delay(latency);
    return findFullProfile(personId, source)!;
  }

  async registerPerson(person: PersonMatch, secrecy: SecrecyOption): Promise<RegistrationSummary> {
    await this.delay(500);
    return {
      personName: person.fullName,
      cpf: person.cpf,
      source: person.source,
      secrecy,
      sector: secrecy === 'RESERVADO' ? MOCK_CONFIG.reservedSector.name : undefined,
    };
  }

  async generateFromSource(
    _cpf: string,
    source: 'SIPEN' | 'SNAP',
    _visibility?: 'public' | 'private',
  ): Promise<PersonMatch[] | null> {
    // Mock: simulate generation latency, then return the first result set for the source
    const latency =
      source === 'SIPEN'
        ? MOCK_CONFIG.latencyMs.sipenBasicSearch
        : MOCK_CONFIG.latencyMs.snapBasicSearch;
    await this.delay(latency);

    const results =
      source === 'SIPEN' ? getResultSet('sipen-person-found') : getResultSet('snap-person-found');

    return results ? [...results].sort((a, b) => b.confidenceScore - a.confidenceScore) : [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
