# Requirements Document

## Introduction

This document defines the requirements for the Person Profile Page feature. The feature creates a unified profile page at route `:id/profile` that consolidates all person data from SIPEN (prison system) and SNAP (intelligence enrichment) into a single three-column view. The page coexists with the existing tela-12 and tela-19 pages, which are kept for reference. All data is static mock data with no backend integration. The implementation targets Angular 21 with PrimeNG 21.

## Glossary

- **Profile_Page**: The new unified person profile page component rendered at route `:id/profile`, displaying all person data in a three-column layout.
- **UnifiedPerson**: The consolidated data model interface that merges fields from `PessoaSnapVisao` (SNAP) and `PresoVisaoMock` (SIPEN) into a single flat structure with optional sections.
- **SIPEN**: The prison management system that provides custody, penal history, legal record, visitors, images, movements, occurrences, and activities data.
- **SNAP**: The intelligence enrichment system that provides contacts, relationships, companies, judicial processes, warrants, journals, digital profiles, electoral data, and transparency data.
- **Profile_Precedence**: The ordered list of profile types used to determine the primary profile: alvo > preso > ex-preso > advogado > visitante > familiar > servidor.
- **Primary_Profile**: The highest-precedence active profile type for a given person, resolved by the `resolvePrimaryProfile()` function.
- **Tab_Visibility_Algorithm**: The logic that determines which tabs are visible based on whether the person has data for optional SIPEN sections.
- **Dashboard**: The existing dashboard component that lists monitored persons and provides navigation to person pages.
- **Mock_Data**: Static TypeScript constants providing three test persons: a merged SIPEN+SNAP person, a SNAP-only person, and a SIPEN-only person.
- **UUID_v4**: Universally unique identifier version 4 format used for all person IDs (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

## Requirements

### Requirement 1: Unified Data Model

**User Story:** As a developer, I want a single data model that merges SIPEN and SNAP person data, so that the profile page can render all information from a unified source.

#### Acceptance Criteria

1. THE UnifiedPerson interface SHALL define all identity fields (id, name, aliases, cpf, rg, photoUrl, birthDate, age, sex, father, mother, birthPlace, nationality, maritalStatus, profession, education, religion, ethnicity, language, cpfStatus) as a flat structure
2. THE UnifiedPerson interface SHALL define optional SIPEN sections (custody, penalHistory, legalRecord, visitors, images, movements, occurrences, activities) as `undefined` when the person has no SIPEN data
3. THE UnifiedPerson interface SHALL define always-present SNAP sections (contacts, relatedPersons, companies, judicialProcesses, escavadorProcesses, seeuProcesses, warrants, officialJournals, queridoDiarioJournals, digitalProfiles, electoral, publicServants, publicExpenses) as required fields
4. THE UnifiedPerson interface SHALL require `id` as a non-empty string in UUID v4 format, `name` as a non-empty string, `cpf` as a non-empty string, and `profiles` with at least one entry
5. THE UnifiedPerson interface SHALL define `riskLevel` as one of four allowed values: `critico`, `alto`, `medio`, `baixo`

### Requirement 2: Profile Precedence Resolution

**User Story:** As a developer, I want a deterministic function to resolve the primary profile type, so that the page displays the correct emphasis based on the person's most important role.

#### Acceptance Criteria

1. THE `resolvePrimaryProfile` function SHALL accept an array of `ProfileInfo` objects and return the `TipoPerfil` of the highest-precedence active profile
2. THE `resolvePrimaryProfile` function SHALL use the precedence order: alvo > preso > ex-preso > advogado > visitante > familiar > servidor
3. WHEN no active profiles exist, THE `resolvePrimaryProfile` function SHALL fall back to the highest-precedence profile regardless of active status
4. WHEN the profiles array is empty, THE `resolvePrimaryProfile` function SHALL return `undefined`
5. WHEN a profile type is not found in the precedence list, THE `resolvePrimaryProfile` function SHALL fall back to the first profile in the array

### Requirement 3: Tab Visibility

**User Story:** As a user, I want to see only relevant tabs for the person I am viewing, so that I am not presented with empty SIPEN tabs for non-prisoner persons.

#### Acceptance Criteria

1. THE Profile_Page SHALL always display the following SNAP tabs regardless of person type: Visão Geral, Contatos, Vínculos, Processos Judiciais, Mandados (BNMP), Diários Oficiais, Perfis Digitais, Dados Eleitorais, Transparência
2. WHEN the person has custody data (custody section is defined), THE Profile_Page SHALL additionally display SIPEN tabs: Histórico Penal, Prontuário Jurídico, Visitas e Comunicações, Imagens, Movimentação, Ocorrências, Atividades
3. WHEN the person has no custody data (custody section is undefined), THE Profile_Page SHALL hide all SIPEN-specific tabs
4. THE Tab_Visibility_Algorithm SHALL preserve the defined tab order when filtering visible tabs
5. THE Profile_Page SHALL default to the "Visão Geral" tab (index 0) on initial load

### Requirement 4: Three-Column Layout

**User Story:** As a user, I want to see the person's identity, detailed data, and quick-access panels in a structured layout, so that I can efficiently review all available information.

#### Acceptance Criteria

1. THE Profile_Page SHALL render a left sidebar containing the identity card with photo (or placeholder initial), name, aliases, CPF, RG (when available), SIPEN registration (when custody data exists), profile tags, custody status (when applicable), risk level indicator, and monitoring badges
2. THE Profile_Page SHALL render a center area containing the tabbed content panel with dynamic tabs based on the Tab_Visibility_Algorithm
3. THE Profile_Page SHALL render a right sidebar containing quick-access panels for recent visitors, lawyers, relationships, alerts and monitoring, and a relationship graph button
4. WHEN the person has no photo URL, THE Profile_Page SHALL display a placeholder with the first character of the person's name
5. THE Profile_Page SHALL use `ChangeDetectionStrategy.OnPush` and Angular signals for state management

### Requirement 5: Mock Data

**User Story:** As a developer, I want three distinct mock persons covering all data scenarios, so that I can verify the profile page renders correctly for merged, SNAP-only, and SIPEN-only cases.

#### Acceptance Criteria

1. THE Mock_Data SHALL provide `UNIFIED_PERSON_MOCK` representing Maurício Nascimento with merged SIPEN and SNAP data, where SIPEN identity fields (name, CPF, birthDate, RG) take precedence over SNAP fields
2. THE Mock_Data SHALL provide `SNAP_ONLY_PERSON_MOCK` representing Carlos Eduardo Fonseca with SNAP data only and all SIPEN optional sections set to `undefined`
3. THE Mock_Data SHALL provide `SIPEN_ONLY_PERSON_MOCK` representing João Carlos Pires Ribeiro da Silva with SIPEN data and minimal SNAP sections
4. THE Mock_Data SHALL assign UUID v4 format identifiers to all three mock persons
5. WHEN merging data for `UNIFIED_PERSON_MOCK`, THE Mock_Data SHALL combine overlapping sections (contacts, companies, warrants, judicial processes, journals, digital profiles) from both sources without data loss

### Requirement 6: Route Configuration

**User Story:** As a user, I want to access the unified profile page via a clean URL, so that I can navigate directly to any person's profile.

#### Acceptance Criteria

1. THE person routes SHALL include a new route `:id/profile` that lazy-loads the ProfileComponent
2. THE person routes SHALL keep the existing route `pessoas/:id` loading Tela12Component
3. THE person routes SHALL keep the existing route `pessoas/:id/perfil/preso` loading Tela19Component
4. THE new `:id/profile` route SHALL coexist with existing routes without conflicts

### Requirement 7: Dashboard Navigation

**User Story:** As a user, I want to navigate from the dashboard to the unified profile page, so that I can view complete person data from the monitored persons list.

#### Acceptance Criteria

1. WHEN a user clicks a person card on the Dashboard, THE Dashboard SHALL navigate to `/intelligence/person/:id/profile` using the person's UUID
2. THE Dashboard SHALL display all three mock persons (Maurício Nascimento, Carlos Eduardo Fonseca, João Carlos Pires Ribeiro da Silva) in the monitored persons list
3. THE Dashboard SHALL use the same navigation route (`/:id/profile`) for all person types regardless of their profile classification

### Requirement 8: Error Handling

**User Story:** As a user, I want the profile page to handle missing or unexpected data gracefully, so that I always see a usable interface.

#### Acceptance Criteria

1. WHEN the `:id` route parameter is missing or empty, THE Profile_Page SHALL resolve the personId signal to an empty string and render with available mock data
2. WHEN a profile type not in the Profile_Precedence list is encountered, THE `resolvePrimaryProfile` function SHALL fall back to the first profile in the array without causing an error
3. WHEN a person has no custody data, THE Profile_Page SHALL omit custody-specific fields from the identity sidebar and hide SIPEN tabs via the Tab_Visibility_Algorithm
4. WHEN optional data sections are undefined, THE Profile_Page SHALL render the remaining sections without layout disruption

### Requirement 9: Existing Pages Preservation

**User Story:** As a developer, I want the existing tela-12 and tela-19 pages and their data files preserved, so that I can reference them during development of the unified profile page.

#### Acceptance Criteria

1. THE system SHALL keep the `tela-12-visao-pessoa-snap/` directory and all its files unchanged
2. THE system SHALL keep the `tela-19-visao-preso/` directory and all its files unchanged
3. THE system SHALL keep `pessoa-snap-visao.data.ts` and `preso-visao.data.ts` unchanged
4. THE existing routes `pessoas/:id` and `pessoas/:id/perfil/preso` SHALL continue to load their respective components

### Requirement 10: Profile Array in Existing Mocks

**User Story:** As a developer, I want all person mock data to include a `perfis` array using the existing `Perfil` interface, so that profile identification is consistent across the dashboard, profile page, and reference pages.

#### Acceptance Criteria

1. THE `PessoaSnapVisao` interface SHALL include a `perfis: Perfil[]` field using the existing `Perfil` interface from `perfil.model.ts`
2. THE `PresoVisaoMock` interface SHALL include a `perfis: Perfil[]` field using the existing `Perfil` interface from `perfil.model.ts`
3. THE `PESSOA_SNAP_MOCK` constant SHALL populate `perfis` with at least one active profile entry reflecting the person's role (e.g., `alvo`)
4. THE `MOCK_PRESO_VISAO` constant SHALL populate `perfis` with at least one active profile entry reflecting the person's role (e.g., `preso`)
5. THE `profiles` field in `UnifiedPerson` SHALL use the same `Perfil` interface from `perfil.model.ts` to maintain type consistency across all mock data
