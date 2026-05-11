// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — State Machine Service
// ─────────────────────────────────────────────────────────────────────────────

import { computed, inject, Injectable, signal } from '@angular/core';

import type {
  DataSource,
  FlowPhase,
  NormalizedFormData,
  PersonMatch,
  QueryStatus,
  RegistrationSummary,
  ResultGroup,
  Scenario,
  SecrecyOption,
  SourceStatus,
} from '../../../models/registration.model';
import { resolveScenario, STATUS_MESSAGES } from '../../../data/registration-mock.data';
import { evaluateSnapEligibility } from '../../../models/registration.utils';
import { PersonRegistrationDataSource } from '../adapters/person-registration-data-source';

// ── Constants ───────────────────────────────────────────────────────────────

/** Initial source statuses — all sources start as CONSULTANDO with empty message. */
const INITIAL_STATUSES: SourceStatus[] = [
  { source: 'BASE_LOCAL', status: 'CONSULTANDO', message: '' },
  { source: 'SIPEN', status: 'CONSULTANDO', message: '' },
  { source: 'SNAP', status: 'CONSULTANDO', message: '' },
];

/**
 * Core state machine service for the person registration flow.
 *
 * Orchestrates sequential queries across local database, SIPEN, and SNAP,
 * manages phase transitions, and coordinates person selection, secrecy
 * selection, and registration completion.
 *
 * Provided at the component level (not root) so each registration page
 * instance gets a fresh state. Depends on `PersonRegistrationDataSource`
 * (abstract) — never on a concrete implementation directly.
 */
@Injectable()
export class RegistrationFlowService {
  private readonly dataSource = inject(PersonRegistrationDataSource);

  // ── State Signals ─────────────────────────────────────────────────────────

  readonly phase = signal<FlowPhase>('IDLE');
  readonly formData = signal<NormalizedFormData | null>(null);
  readonly scenario = signal<Scenario | null>(null);
  readonly localResults = signal<PersonMatch[]>([]);
  readonly sipenResults = signal<PersonMatch[]>([]);
  readonly snapResults = signal<PersonMatch[]>([]);
  readonly selectedPerson = signal<PersonMatch | null>(null);
  readonly selectedSource = signal<DataSource | null>(null);
  readonly selectedSecrecy = signal<SecrecyOption | null>(null);
  readonly sourceStatuses = signal<SourceStatus[]>(INITIAL_STATUSES);
  readonly resultGroups = signal<ResultGroup[]>([]);
  readonly summary = signal<RegistrationSummary | null>(null);

  // ── Computed Signals ──────────────────────────────────────────────────────

  readonly isOverlayVisible = computed(() => {
    const p = this.phase();
    return p !== 'IDLE' && p !== 'COMPLETED';
  });

  readonly isFormDisabled = computed(() => this.phase() !== 'IDLE');

  readonly isResultsVisible = computed(() => this.resultGroups().length > 0);

  readonly isDrawerOpen = computed(() => {
    const p = this.phase();
    return (
      this.selectedPerson() !== null && (p === 'SECRECY_SELECTION' || p === 'BACKGROUND_QUERY')
    );
  });

  // ── Public Methods ────────────────────────────────────────────────────────

  /**
   * Start the registration flow with normalized form data.
   * Resolves the scenario from the mock data and begins the local search.
   */
  startFlow(data: NormalizedFormData): void {
    this.formData.set(data);
    this.scenario.set(resolveScenario(data));
    this.transition('QUERYING_LOCAL');
    this.updateSourceStatus(
      'BASE_LOCAL',
      'CONSULTANDO',
      STATUS_MESSAGES['BASE_LOCAL']['CONSULTANDO'],
    );
    this.searchLocal(data);
  }

  /**
   * Advance the flow from one source to the next.
   * Called when the user clicks "Nenhuma corresponde" or when a source returns no results.
   */
  advanceFromSource(source: DataSource): void {
    const data = this.formData();
    if (!data) return;

    switch (source) {
      case 'BASE_LOCAL':
        this.transition('QUERYING_SIPEN');
        this.updateSourceStatus('SIPEN', 'CONSULTANDO', STATUS_MESSAGES['SIPEN']['CONSULTANDO']);
        this.searchSipen(data);
        break;

      case 'SIPEN':
        this.transition('EVALUATING_SNAP');
        this.evaluateAndQuerySnap(data);
        break;

      case 'SNAP':
        this.transition('MANUAL_OPTION');
        this.addManualResultGroup();
        break;
    }
  }

  /**
   * Select a person for registration. Opens the review drawer.
   */
  selectPerson(person: PersonMatch, source: DataSource): void {
    this.selectedPerson.set(person);
    this.selectedSource.set(source);
    this.transition('SECRECY_SELECTION');
  }

  /**
   * Confirm registration with the selected secrecy option.
   * Triggers the background full-profile query and registration.
   */
  confirmRegistration(secrecy: SecrecyOption): void {
    const person = this.selectedPerson();
    const source = this.selectedSource();
    if (!person || !source) return;

    this.selectedSecrecy.set(secrecy);
    this.transition('BACKGROUND_QUERY');

    this.updateSourceStatus(
      source,
      'CADASTRO_COMPLETO_EM_ANDAMENTO',
      STATUS_MESSAGES[source]['CADASTRO_COMPLETO_EM_ANDAMENTO'],
    );

    this.executeRegistration(person, source, secrecy);
  }

  /**
   * Retry the query for a given source after an error.
   */
  retrySource(source: DataSource): void {
    const data = this.formData();
    if (!data) return;

    switch (source) {
      case 'BASE_LOCAL':
        this.transition('QUERYING_LOCAL');
        this.updateSourceStatus(
          'BASE_LOCAL',
          'CONSULTANDO',
          STATUS_MESSAGES['BASE_LOCAL']['CONSULTANDO'],
        );
        this.searchLocal(data);
        break;

      case 'SIPEN':
        this.transition('QUERYING_SIPEN');
        this.updateSourceStatus('SIPEN', 'CONSULTANDO', STATUS_MESSAGES['SIPEN']['CONSULTANDO']);
        this.searchSipen(data);
        break;

      case 'SNAP':
        this.transition('QUERYING_SNAP');
        this.updateSourceStatus('SNAP', 'CONSULTANDO', STATUS_MESSAGES['SNAP']['CONSULTANDO']);
        this.searchSnap(data);
        break;
    }
  }

  /**
   * Trigger person generation from an external source (SIPEN or SNAP).
   *
   * Called when searches return empty but the user has a valid CPF and wants
   * to create the person from the external source. Triggers the generate-person
   * pipeline, waits for completion, then displays the results.
   */
  generateFromSource(source: 'SIPEN' | 'SNAP'): void {
    const data = this.formData();
    if (!data || !data.cpfNormalized) return;

    const dataSource: DataSource = source;
    this.transition(source === 'SIPEN' ? 'QUERYING_SIPEN' : 'QUERYING_SNAP');
    this.updateSourceStatus(dataSource, 'CONSULTANDO', `Gerando pessoa via ${source}...`);

    this.executeGeneration(data.cpfNormalized, source, dataSource);
  }

  /**
   * Reset all signals to their initial state.
   */
  reset(): void {
    this.phase.set('IDLE');
    this.formData.set(null);
    this.scenario.set(null);
    this.localResults.set([]);
    this.sipenResults.set([]);
    this.snapResults.set([]);
    this.selectedPerson.set(null);
    this.selectedSource.set(null);
    this.selectedSecrecy.set(null);
    this.sourceStatuses.set(INITIAL_STATUSES);
    this.resultGroups.set([]);
    this.summary.set(null);
  }

  // ── Private Methods ───────────────────────────────────────────────────────

  /** Update the flow phase. */
  private transition(newPhase: FlowPhase): void {
    this.phase.set(newPhase);
  }

  /** Update the status of a single data source in the overlay. */
  private updateSourceStatus(source: DataSource, status: QueryStatus, message: string): void {
    this.sourceStatuses.update((statuses) =>
      statuses.map((s) => (s.source === source ? { ...s, status, message } : s)),
    );
  }

  /** Append a result group to the result groups list. */
  private addResultGroup(group: ResultGroup): void {
    this.resultGroups.update((groups) => [...groups, group]);
  }

  // ── Query Orchestration ───────────────────────────────────────────────────

  /** Execute the local database search and handle results. */
  private async searchLocal(data: NormalizedFormData): Promise<void> {
    const results = await this.dataSource.searchLocal(data);
    const sorted = [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (sorted.length > 0) {
      this.localResults.set(sorted);
      this.updateSourceStatus(
        'BASE_LOCAL',
        'CONCLUIDA_COM_RESULTADOS',
        STATUS_MESSAGES['BASE_LOCAL']['CONCLUIDA_COM_RESULTADOS'],
      );
      this.addResultGroup({
        source: 'BASE_LOCAL',
        title: 'Base Local',
        icon: 'pi pi-database',
        persons: sorted,
        type: 'results',
      });
      this.transition('LOCAL_RESULTS');
    } else {
      this.updateSourceStatus(
        'BASE_LOCAL',
        'CONCLUIDA_SEM_RESULTADOS',
        STATUS_MESSAGES['BASE_LOCAL']['CONCLUIDA_SEM_RESULTADOS'],
      );
      // Auto-advance to SIPEN when no local results
      this.advanceFromSource('BASE_LOCAL');
    }
  }

  /** Execute the SIPEN search and handle results. */
  private async searchSipen(data: NormalizedFormData): Promise<void> {
    const results = await this.dataSource.searchSipen(data);

    if (results === null) {
      // Error scenario
      this.updateSourceStatus('SIPEN', 'ERRO', STATUS_MESSAGES['SIPEN']['ERRO']);
      this.addResultGroup({
        source: 'SIPEN',
        title: 'SIPEN',
        icon: 'pi pi-shield',
        persons: [],
        type: 'error',
      });
      this.transition('SIPEN_ERROR');
      return;
    }

    const sorted = [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (sorted.length > 0) {
      this.sipenResults.set(sorted);
      this.updateSourceStatus(
        'SIPEN',
        'CONCLUIDA_COM_RESULTADOS',
        STATUS_MESSAGES['SIPEN']['CONCLUIDA_COM_RESULTADOS'],
      );
      this.addResultGroup({
        source: 'SIPEN',
        title: 'SIPEN',
        icon: 'pi pi-shield',
        persons: sorted,
        type: 'results',
      });
      this.transition('SIPEN_RESULTS');
    } else {
      this.updateSourceStatus(
        'SIPEN',
        'CONCLUIDA_SEM_RESULTADOS',
        STATUS_MESSAGES['SIPEN']['CONCLUIDA_SEM_RESULTADOS'],
      );
      // Auto-advance to SNAP evaluation when no SIPEN results
      this.advanceFromSource('SIPEN');
    }
  }

  /** Evaluate SNAP eligibility and query if eligible. */
  private evaluateAndQuerySnap(data: NormalizedFormData): void {
    const eligible = evaluateSnapEligibility(data);

    if (eligible) {
      this.transition('QUERYING_SNAP');
      this.updateSourceStatus('SNAP', 'CONSULTANDO', STATUS_MESSAGES['SNAP']['CONSULTANDO']);
      this.searchSnap(data);
    } else {
      this.updateSourceStatus('SNAP', 'NAO_APLICAVEL', STATUS_MESSAGES['SNAP']['NAO_APLICAVEL']);
      this.addResultGroup({
        source: 'SNAP',
        title: 'SNAP',
        icon: 'pi pi-search',
        persons: [],
        type: 'not-applicable',
      });
      this.transition('MANUAL_OPTION');
      this.addManualResultGroup();
    }
  }

  /** Execute the SNAP search and handle results. */
  private async searchSnap(data: NormalizedFormData): Promise<void> {
    const results = await this.dataSource.searchSnap(data);

    if (results === null) {
      // Error scenario
      this.updateSourceStatus('SNAP', 'ERRO', STATUS_MESSAGES['SNAP']['ERRO']);
      this.addResultGroup({
        source: 'SNAP',
        title: 'SNAP',
        icon: 'pi pi-search',
        persons: [],
        type: 'error',
      });
      this.transition('SNAP_ERROR');
      return;
    }

    const sorted = [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (sorted.length > 0) {
      this.snapResults.set(sorted);
      this.updateSourceStatus(
        'SNAP',
        'CONCLUIDA_COM_RESULTADOS',
        STATUS_MESSAGES['SNAP']['CONCLUIDA_COM_RESULTADOS'],
      );
      this.addResultGroup({
        source: 'SNAP',
        title: 'SNAP',
        icon: 'pi pi-search',
        persons: sorted,
        type: 'results',
      });
      this.transition('SNAP_RESULTS');
    } else {
      this.updateSourceStatus(
        'SNAP',
        'CONCLUIDA_SEM_RESULTADOS',
        STATUS_MESSAGES['SNAP']['CONCLUIDA_SEM_RESULTADOS'],
      );
      this.transition('MANUAL_OPTION');
      this.addManualResultGroup();
    }
  }

  /** Add the manual registration option as a result group. */
  private addManualResultGroup(): void {
    this.addResultGroup({
      source: 'BASE_LOCAL',
      title: 'Cadastro Manual',
      icon: 'pi pi-user-plus',
      persons: [],
      type: 'manual',
    });
  }

  /** Execute the full-profile fetch and registration after secrecy confirmation. */
  private async executeRegistration(
    person: PersonMatch,
    source: DataSource,
    secrecy: SecrecyOption,
  ): Promise<void> {
    await this.dataSource.fetchFullProfile(person.id, source);
    const registrationSummary = await this.dataSource.registerPerson(person, secrecy);
    this.summary.set(registrationSummary);
    this.transition('COMPLETED');
  }

  /** Execute person generation from an external source and display results. */
  private async executeGeneration(
    cpf: string,
    source: 'SIPEN' | 'SNAP',
    dataSource: DataSource,
  ): Promise<void> {
    const results = await this.dataSource.generateFromSource(cpf, source);

    if (results === null) {
      this.updateSourceStatus(dataSource, 'ERRO', STATUS_MESSAGES[dataSource]['ERRO']);
      this.addResultGroup({
        source: dataSource,
        title: `${source} — Geração`,
        icon: source === 'SIPEN' ? 'pi pi-shield' : 'pi pi-search',
        persons: [],
        type: 'error',
      });
      this.transition(source === 'SIPEN' ? 'SIPEN_ERROR' : 'SNAP_ERROR');
      return;
    }

    const sorted = [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (sorted.length > 0) {
      if (source === 'SIPEN') {
        this.sipenResults.set(sorted);
      } else {
        this.snapResults.set(sorted);
      }
      this.updateSourceStatus(
        dataSource,
        'CONCLUIDA_COM_RESULTADOS',
        `Pessoa gerada via ${source} com sucesso.`,
      );
      this.addResultGroup({
        source: dataSource,
        title: `${source} — Geração`,
        icon: source === 'SIPEN' ? 'pi pi-shield' : 'pi pi-search',
        persons: sorted,
        type: 'results',
      });
      this.transition(source === 'SIPEN' ? 'SIPEN_RESULTS' : 'SNAP_RESULTS');
    } else {
      this.updateSourceStatus(
        dataSource,
        'CONCLUIDA_SEM_RESULTADOS',
        `Nenhuma pessoa encontrada via ${source} para este CPF.`,
      );
      this.transition('MANUAL_OPTION');
      this.addManualResultGroup();
    }
  }
}
