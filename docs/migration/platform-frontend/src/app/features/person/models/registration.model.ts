// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Data Models
// ─────────────────────────────────────────────────────────────────────────────

/** Data source identifier for the multi-source verification pipeline. */
export type DataSource = 'BASE_LOCAL' | 'SIPEN' | 'SNAP';

/** State machine phases for the registration flow. */
export type FlowPhase =
  | 'IDLE'
  | 'QUERYING_LOCAL'
  | 'LOCAL_RESULTS'
  | 'QUERYING_SIPEN'
  | 'SIPEN_RESULTS'
  | 'SIPEN_ERROR'
  | 'EVALUATING_SNAP'
  | 'QUERYING_SNAP'
  | 'SNAP_RESULTS'
  | 'SNAP_ERROR'
  | 'MANUAL_OPTION'
  | 'SECRECY_SELECTION'
  | 'BACKGROUND_QUERY'
  | 'COMPLETED';

/** Query status for each data source in the status overlay. */
export type QueryStatus =
  | 'AGUARDANDO_DADOS_SUFICIENTES'
  | 'NAO_APLICAVEL'
  | 'CONSULTANDO'
  | 'CONCLUIDA_SEM_RESULTADOS'
  | 'CONCLUIDA_COM_RESULTADOS'
  | 'ERRO'
  | 'IGNORADA_POR_PESSOA_LOCAL'
  | 'CADASTRO_COMPLETO_EM_ANDAMENTO'
  | 'CADASTRO_SIMULADO_CONCLUIDO';

/** Match type classification for person search results. */
export type MatchType =
  | 'CPF_EXATO'
  | 'RG_CORRESPONDENTE'
  | 'NOME_UF'
  | 'NOME_SEMELHANTE_UF'
  | 'VULGO_CORRESPONDENTE'
  | 'NOME_SEMELHANTE'
  | 'DADOS_PARCIAIS';

/** SIPEN profile type for prison system persons. */
export type SipenProfileType =
  | 'PRESO'
  | 'EX_PRESO'
  | 'VISITANTE'
  | 'ADVOGADO'
  | 'FAMILIAR'
  | 'SERVIDOR'
  | 'PESSOA_RELACIONADA';

/** Secrecy/visibility option for person records. */
export type SecrecyOption = 'PUBLICO' | 'RESERVADO';

/** Normalized form data after input processing. */
export interface NormalizedFormData {
  nome: string;
  nomeNormalized: string;
  uf: string;
  vulgo: string;
  rg: string;
  cpf: string;
  cpfNormalized: string;
  hasValidCPF: boolean;
  hasValidNome: boolean;
  hasValidVulgo: boolean;
  hasValidRG: boolean;
  isSnapEligible: boolean;
}

/** A person match result from any data source. */
export interface PersonMatch {
  id: string;
  source: DataSource;
  profileType: SipenProfileType | null;
  fullName: string;
  normalizedName: string;
  uf: string;
  cpf: string;
  cpfNormalized: string;
  rg: string;
  aliases: string[];
  birthDate: string;
  age: number;
  motherName: string;
  fatherName: string;
  birthplace: string;
  photoUrl: string | null;
  phones: { number: string; type: string }[];
  emails: { email: string; type: string }[];
  addresses: {
    street: string;
    number: string;
    district: string;
    city: string;
    uf: string;
    zipCode: string;
  }[];
  prisonStatus: string | null;
  currentPrisonUnit: string | null;
  matchType: MatchType;
  confidenceScore: number;
  confidenceLabel: string;
  possibleLocalDuplicate: boolean;
  alreadyRegistered: boolean;
  localDuplicateId: string | null;
  profileUrl: string | null;
  lastUpdatedAt: string;
}

/** Full detailed profile extending PersonMatch with prison data and related people. */
export interface FullProfile extends PersonMatch {
  prisonData?: {
    status: string;
    currentUnit: string;
    wing: string | null;
    cell: string | null;
    admissionDate: string;
    lastMovementDate: string;
    riskLevel: string;
    factionIndication: string | null;
    factionRole: string | null;
    custodyHistory: {
      unit: string;
      startDate: string;
      endDate: string | null;
    }[];
  };
  relatedPeople: {
    name: string;
    relationship: string;
    document: string;
    source: string;
  }[];
}

/** Status of a single data source in the overlay. */
export interface SourceStatus {
  source: DataSource;
  status: QueryStatus;
  message: string;
}

/** A group of person match results from a single source. */
export interface ResultGroup {
  source: DataSource;
  title: string;
  icon: string;
  persons: PersonMatch[];
  type: 'results' | 'error' | 'not-applicable' | 'manual';
}

/** Scenario definition for the mock scenario matrix. */
export interface Scenario {
  id: string;
  title: string;
  trigger: Record<string, string>;
  localResultSet: string;
  sipenResultSet: string | null;
  snapResultSet: string | null;
  snapApplicable?: boolean;
  missingSnapFieldsMessage?: string;
  expectedFlow: string;
}

/** Configuration for a secrecy option card. */
export interface SecrecyOptionConfig {
  id: SecrecyOption;
  label: string;
  description: string;
}

/** Mock adapter configuration. */
export interface MockConfig {
  latencyMs: {
    localSearch: number;
    sipenBasicSearch: number;
    snapBasicSearch: number;
    sipenFullProfile: number;
    snapFullProfile: number;
  };
  manualRegistrationRedirectUrl: string;
  reservedSector: { id: string; name: string };
  defaultVisibilityOptions: SecrecyOptionConfig[];
  confidenceThresholds: { high: number; medium: number; low: number };
}

/** Summary returned after a successful registration. */
export interface RegistrationSummary {
  personName: string;
  cpf: string;
  source: DataSource;
  secrecy: SecrecyOption;
  sector?: string;
}

/** All 27 Brazilian UF codes. */
export const UF_LIST = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
