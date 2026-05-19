import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  DataSource,
  NormalizedFormData,
  PersonMatch,
} from '../../../models/registration.model';
import { MockRegistrationDataSource } from '../adapters/mock-registration-data-source';
import { PersonRegistrationDataSource } from '../adapters/person-registration-data-source';
import { evaluateSnapEligibility } from '../../../models/registration.utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — build NormalizedFormData for specific scenarios
// ─────────────────────────────────────────────────────────────────────────────

function makeFormData(overrides: Partial<NormalizedFormData> = {}): NormalizedFormData {
  return {
    nome: '',
    nomeNormalized: '',
    uf: '',
    vulgo: '',
    rg: '',
    cpf: '',
    cpfNormalized: '',
    hasValidCPF: false,
    hasValidNome: false,
    hasValidVulgo: false,
    hasValidRG: false,
    isSnapEligible: false,
    ...overrides,
  };
}

/** CEN-001: CPF found locally */
function cen001Data(): NormalizedFormData {
  return makeFormData({
    cpf: '013.511.976-65',
    cpfNormalized: '01351197665',
    hasValidCPF: true,
    isSnapEligible: true,
  });
}

/** CEN-003: Found in SIPEN */
function cen003Data(): NormalizedFormData {
  return makeFormData({
    cpf: '222.333.444-05',
    cpfNormalized: '22233344405',
    hasValidCPF: true,
    isSnapEligible: true,
  });
}

/** CEN-004: Found only in SNAP */
function cen004Data(): NormalizedFormData {
  return makeFormData({
    cpf: '333.444.555-06',
    cpfNormalized: '33344455506',
    hasValidCPF: true,
    isSnapEligible: true,
  });
}

/** CEN-007: RG-only — SNAP not applicable */
function cen007Data(): NormalizedFormData {
  return makeFormData({
    rg: '99999999',
    hasValidRG: true,
    isSnapEligible: false,
  });
}

/** CEN-008: SIPEN error scenario */
function cen008Data(): NormalizedFormData {
  return makeFormData({
    cpf: '555.666.777-08',
    cpfNormalized: '55566677708',
    hasValidCPF: true,
    isSnapEligible: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 15.9 — MockRegistrationDataSource
// ─────────────────────────────────────────────────────────────────────────────

describe('MockRegistrationDataSource', () => {
  let ds: MockRegistrationDataSource;

  beforeEach(() => {
    // Mock setTimeout to resolve immediately so tests don't wait for real delays
    vi.useFakeTimers();
    ds = new MockRegistrationDataSource();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Helper to advance all pending timers and flush promises */
  async function flushAsync<T>(promise: Promise<T>): Promise<T> {
    vi.advanceTimersByTime(10_000);
    return promise;
  }

  it('searchLocal() with CEN-001 trigger returns array with person having CPF_EXATO match type', async () => {
    const resultPromise = ds.searchLocal(cen001Data());
    const results = await flushAsync(resultPromise);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].matchType).toBe('CPF_EXATO');
  });

  it('searchSipen() with CEN-003 trigger returns array with person having PRESO profile', async () => {
    const resultPromise = ds.searchSipen(cen003Data());
    const results = await flushAsync(resultPromise);

    expect(results).not.toBeNull();
    expect(Array.isArray(results)).toBe(true);
    expect(results!.length).toBeGreaterThanOrEqual(1);
    expect(results![0].profileType).toBe('PRESO');
  });

  it('searchSipen() with CEN-008 trigger returns null (error scenario)', async () => {
    const resultPromise = ds.searchSipen(cen008Data());
    const result = await flushAsync(resultPromise);

    expect(result).toBeNull();
  });

  it('searchSnap() with CEN-004 trigger returns array with person', async () => {
    const resultPromise = ds.searchSnap(cen004Data());
    const results = await flushAsync(resultPromise);

    expect(results).not.toBeNull();
    expect(Array.isArray(results)).toBe(true);
    expect(results!.length).toBeGreaterThanOrEqual(1);
  });

  it('evaluateSnapEligibility returns false for RG-only input (CEN-007)', () => {
    const data = cen007Data();
    expect(evaluateSnapEligibility(data)).toBe(false);
  });

  it('results are always sorted by confidenceScore descending', async () => {
    // CEN-002 returns multiple local homonyms
    const data = makeFormData({
      nome: 'João Carlos',
      nomeNormalized: 'joao carlos',
      uf: 'MG',
      hasValidNome: true,
      isSnapEligible: true,
    });

    const resultPromise = ds.searchLocal(data);
    const results = await flushAsync(resultPromise);

    expect(results.length).toBeGreaterThan(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidenceScore).toBeGreaterThanOrEqual(results[i].confidenceScore);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.10 — RegistrationFlowService (with MockRegistrationDataSource injected)
// ─────────────────────────────────────────────────────────────────────────────

import { Injector, runInInjectionContext } from '@angular/core';
import { RegistrationFlowService } from './registration-flow.service';

describe('RegistrationFlowService', () => {
  let service: RegistrationFlowService;
  let injector: Injector;

  beforeEach(() => {
    vi.useFakeTimers();

    injector = Injector.create({
      providers: [
        { provide: RegistrationFlowService, deps: [PersonRegistrationDataSource] },
        { provide: PersonRegistrationDataSource, useClass: MockRegistrationDataSource, deps: [] },
      ],
    });

    service = injector.get(RegistrationFlowService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Advance fake timers and flush microtasks */
  async function flushAll(): Promise<void> {
    // Advance timers to resolve all simulated delays
    await vi.advanceTimersByTimeAsync(10_000);
  }

  it('startFlow() transitions from IDLE to QUERYING_LOCAL', () => {
    expect(service.phase()).toBe('IDLE');
    service.startFlow(cen001Data());
    expect(service.phase()).toBe('QUERYING_LOCAL');
  });

  it('after local results, advanceFromSource("BASE_LOCAL") transitions to QUERYING_SIPEN', async () => {
    service.startFlow(cen001Data());
    // Wait for local search to complete
    await flushAll();

    // CEN-001 has local results, so phase should be LOCAL_RESULTS
    expect(service.phase()).toBe('LOCAL_RESULTS');

    // User clicks "Nenhuma corresponde"
    service.advanceFromSource('BASE_LOCAL');
    expect(service.phase()).toBe('QUERYING_SIPEN');
  });

  it('selectPerson() sets selectedPerson and transitions to SECRECY_SELECTION', async () => {
    service.startFlow(cen003Data());
    // Wait for local search (empty) + auto-advance to SIPEN + SIPEN search
    await flushAll();

    const sipenResults = service.sipenResults();
    expect(sipenResults.length).toBeGreaterThanOrEqual(1);

    const person = sipenResults[0];
    service.selectPerson(person, 'SIPEN');

    expect(service.selectedPerson()).toBe(person);
    expect(service.phase()).toBe('SECRECY_SELECTION');
  });

  it('confirmRegistration() with secrecy transitions to BACKGROUND_QUERY then COMPLETED', async () => {
    service.startFlow(cen003Data());
    await flushAll();

    const person = service.sipenResults()[0];
    service.selectPerson(person, 'SIPEN');
    expect(service.phase()).toBe('SECRECY_SELECTION');

    service.confirmRegistration('PUBLICO');
    expect(service.phase()).toBe('BACKGROUND_QUERY');

    // Wait for background query + registration to complete
    await flushAll();
    expect(service.phase()).toBe('COMPLETED');
  });

  it('reset() returns all signals to initial state', async () => {
    service.startFlow(cen003Data());
    await flushAll();

    // Service should have some state set
    expect(service.phase()).not.toBe('IDLE');

    service.reset();

    expect(service.phase()).toBe('IDLE');
    expect(service.formData()).toBeNull();
    expect(service.scenario()).toBeNull();
    expect(service.localResults()).toEqual([]);
    expect(service.sipenResults()).toEqual([]);
    expect(service.snapResults()).toEqual([]);
    expect(service.selectedPerson()).toBeNull();
    expect(service.selectedSource()).toBeNull();
    expect(service.selectedSecrecy()).toBeNull();
    expect(service.resultGroups()).toEqual([]);
    expect(service.summary()).toBeNull();
  });
});
