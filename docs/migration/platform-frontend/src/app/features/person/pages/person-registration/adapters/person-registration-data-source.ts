// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Abstract Data Source
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

/**
 * Abstract contract for all data access in the person registration flow.
 *
 * Components and the `RegistrationFlowService` depend on this abstraction —
 * never on mock data or HTTP clients directly. Swapping implementations
 * (mock ↔ real API) is a single Angular provider change at the component level.
 *
 * **Return semantics:**
 * - Empty array (`[]`) = query succeeded but found no matches.
 * - `null` = query failed (network error, timeout, service unavailable).
 *   The flow service uses this distinction to show error UI vs "no results" UI.
 */
@Injectable()
export abstract class PersonRegistrationDataSource {
  /**
   * Search the local intelligence database for existing persons matching the input.
   *
   * Used to detect duplicates before querying external sources.
   * Returns an empty array if no matches are found — never returns `null`.
   *
   * **Target poi-service endpoint:**
   * `GET /api/v1/poi/person/list?q=<name>&source=LOCAL`
   *
   * @param data - Normalized form data from the registration form.
   * @returns Persons matching the input, sorted by confidence score (highest first).
   */
  abstract searchLocal(data: NormalizedFormData): Promise<PersonMatch[]>;

  /**
   * Search SIPEN (prison management system) for persons matching the input.
   *
   * SIPEN is the primary authoritative source for penitentiary data.
   * Returns `null` to signal a query error (distinct from empty results `[]`).
   *
   * **Target poi-service endpoint:**
   * Live SIPEN search endpoint (not yet defined — current `person/list` returns
   * persisted persons only, not live SIPEN engine results).
   *
   * @param data - Normalized form data from the registration form.
   * @returns Persons matching the input sorted by confidence, or `null` on error.
   */
  abstract searchSipen(data: NormalizedFormData): Promise<PersonMatch[] | null>;

  /**
   * Search SNAP (intelligence enrichment system) for persons matching the input.
   *
   * SNAP is a complementary source for cadastral data, contacts, and addresses.
   * Returns `null` to signal a query error (distinct from empty results `[]`).
   *
   * **Target poi-service endpoint:**
   * Live SNAP search endpoint (not yet defined — current `person/list` returns
   * persisted persons only, not live SNAP engine results).
   *
   * @param data - Normalized form data from the registration form.
   * @returns Persons matching the input sorted by confidence, or `null` on error.
   */
  abstract searchSnap(data: NormalizedFormData): Promise<PersonMatch[] | null>;

  /**
   * Fetch the full detailed profile for a person after the user selects them.
   *
   * This is the "slow" background query that retrieves all enrichment data
   * (contacts, addresses, prison data, related people) from the selected source.
   *
   * **Target poi-service endpoint:**
   * `GET /api/v1/poi/person/{person_id}`
   * (available for persisted persons; for unpersisted candidates, a new endpoint
   * or enriched search response is needed).
   *
   * @param personId - The ID of the person from the basic search results.
   * @param source - The data source to query (`'SIPEN'` or `'SNAP'`).
   * @returns The full profile with all enrichment data.
   */
  abstract fetchFullProfile(personId: string, source: DataSource): Promise<FullProfile>;

  /**
   * Create a person record from the selected external source with the chosen
   * secrecy/visibility level.
   *
   * **Target poi-service endpoint:**
   * `POST /api/v1/poi/generate-person/sipen` or
   * `POST /api/v1/poi/generate-person/snap`
   * (not yet implemented — planned in poi-person-api spec, Requirements 9–11).
   *
   * @param person - The person match selected by the user.
   * @param secrecy - The chosen visibility level (`'PUBLICO'` or `'RESERVADO'`).
   * @returns A summary of the completed registration.
   */
  abstract registerPerson(
    person: PersonMatch,
    secrecy: SecrecyOption,
  ): Promise<RegistrationSummary>;

  /**
   * Trigger person generation from an external source (SIPEN or SNAP).
   *
   * Calls the generate-person pipeline with the given CPF. The pipeline
   * fetches data from the external source, creates the person in the graph,
   * and returns the generated person's data.
   *
   * This is used when searches return empty results but the user wants to
   * create a person from the external source using their CPF.
   *
   * **Target poi-service endpoint:**
   * `POST /api/v1/poi/generate-person/sipen` or `/snap`
   *
   * @param cpf - The CPF to generate the person for (11 digits, no formatting).
   * @param source - The external source to generate from (`'SIPEN'` or `'SNAP'`).
   * @param visibility - Target visibility (`'public'` or `'private'`).
   * @returns The generated persons found after the pipeline completes, or null on error.
   */
  abstract generateFromSource(
    cpf: string,
    source: 'SIPEN' | 'SNAP',
    visibility?: 'public' | 'private',
  ): Promise<PersonMatch[] | null>;
}
