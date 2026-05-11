import { Perfil, TipoPerfil } from './perfil.model';

/** Profile type with display precedence (lower index = higher priority) */
export const PROFILE_PRECEDENCE = [
  'alvo',
  'preso',
  'ex-preso',
  'advogado',
  'visitante',
  'familiar',
  'servidor',
] as const;

export interface UnifiedPerson {
  // ── Core Identity ──────────────────────────────────────────────
  id: string;
  name: string;
  aliases: string[];
  cpf: string;
  rg?: string;
  photoUrl?: string;
  birthDate: string;
  age: number;
  sex: string;
  father?: string;
  mother?: string;
  birthPlace?: string;
  nationality?: string;
  maritalStatus?: string;
  profession?: string;
  education?: string;
  religion?: string;
  ethnicity?: string;
  language?: string;
  cpfStatus?: string;

  // ── Classification ─────────────────────────────────────────────
  profiles: Perfil[];
  tags: TagInfo[];
  riskLevel: 'critico' | 'alto' | 'medio' | 'baixo';
  monitoring: MonitoringInfo;

  // ── Custody (SIPEN — optional) ─────────────────────────────────
  custody?: CustodyInfo;

  // ── Penal History (SIPEN — optional) ───────────────────────────
  penalHistory?: PenalHistoryInfo;

  // ── Legal Record (SIPEN — optional) ────────────────────────────
  legalRecord?: LegalRecordInfo;

  // ── Visitors & Communications (SIPEN — optional) ───────────────
  visitors?: VisitorsInfo;

  // ── Lawyers ────────────────────────────────────────────────────
  lawyers: LawyerInfo[];
  legalAppointments: LegalAppointmentInfo[];

  // ── Images (SIPEN — optional) ──────────────────────────────────
  images?: ImagesInfo;

  // ── Movements (SIPEN — optional) ───────────────────────────────
  movements?: MovementsInfo;

  // ── Contacts (SNAP) ────────────────────────────────────────────
  contacts: ContactsInfo;

  // ── Links / Relationships (SNAP) ───────────────────────────────
  relatedPersons: RelatedPersonInfo[];
  companies: CompanyInfo[];

  // ── Legal Processes (SNAP + SIPEN) ─────────────────────────────
  judicialProcesses: JudicialProcessInfo[];
  escavadorProcesses: EscavadorProcessInfo[];
  seeuProcesses: SeeuProcessInfo[];

  // ── Warrants (SNAP) ────────────────────────────────────────────
  warrants: WarrantInfo[];

  // ── Official Journals (SNAP) ───────────────────────────────────
  officialJournals: OfficialJournalInfo[];
  queridoDiarioJournals: QueridoDiarioInfo[];

  // ── Digital Profiles (SNAP) ────────────────────────────────────
  digitalProfiles: DigitalProfileInfo[];

  // ── Electoral Data (SNAP) ──────────────────────────────────────
  electoral: ElectoralInfo;

  // ── Transparency (SNAP) ────────────────────────────────────────
  publicServants: PublicServantInfo[];
  publicExpenses: PublicExpenseInfo[];

  // ── Occurrences (SIPEN — optional) ─────────────────────────────
  occurrences?: OccurrencesInfo;

  // ── Labor & Education (SIPEN — optional) ───────────────────────
  activities?: ActivitiesInfo;

  // ── Contextual Alert ───────────────────────────────────────────
  contextualAlert?: string;

  // ── Metadata ───────────────────────────────────────────────────
  lastEnrichmentDate?: string;
  availableSources: string[];

  // ── Provenance (from poi-service) ──────────────────────────────
  _sources?: Array<{ graph_id: string; display_name: string }>;
  _merged_from?: number;
}

// ── Sub-interfaces ───────────────────────────────────────────────

export interface TagInfo {
  label: string;
  category: string;
  color?: string;
}

export interface MonitoringInfo {
  monitored: boolean;
  target: boolean;
  startDate?: string;
  sector?: string;
  criticality?: 'critica' | 'alta' | 'media' | 'baixa';
}

export interface CustodyInfo {
  prisonStatus: string;
  securityClassification: string;
  dangerLevel: 'critico' | 'alto' | 'medio' | 'baixo';
  crime: string;
  article: string;
  regime: string;
  unit: string;
  pavilion?: string;
  gallery?: string;
  cell?: string;
  lastUpdateDate: string;
  faction?: string;
  factionRole?: string;
  sipenRegistration: string;
  sipenCode: string;
  pic: string;
  rji: string;
  dossierSipen: string;
  processDpj: string;
  environment: string;
  systemEntry: string;
  origin: string;
}

export interface PenalHistoryInfo {
  events: PenalEvent[];
  behaviorIndex: BehaviorIndex[];
  privileges: PrivilegeInfo[];
  benefits: BenefitInfo[];
  sentenceReduction: SentenceReductionInfo[];
}

export interface PenalEvent {
  type: string;
  title: string;
  description: string;
  date: string;
  status?: string;
}

export interface BehaviorIndex {
  referenceDate: string;
  index: string;
  observation?: string;
}

export interface PrivilegeInfo {
  date: string;
  type: string;
  status: string;
}

export interface BenefitInfo {
  date: string;
  type: string;
  status: string;
}

export interface SentenceReductionInfo {
  date: string;
  criterion: string;
  amount: string;
  status: string;
}

export interface LegalRecordInfo {
  sentenceCalculation: SentenceCalculation;
  benefitDates: BenefitDates;
  processes: SipenProcess[];
  legalOccurrences: LegalOccurrence[];
  vep: VepInfo;
}

export interface SentenceCalculation {
  arrestDate: string;
  seapEntry: string;
  sentenceEnd: string;
  totalSentence: string;
  timeServed: string;
  timeRemaining: string;
  daysWorked: string;
}

export interface BenefitDates {
  oneSixth: string;
  oneQuarter: string;
  oneThird: string;
  oneHalf: string;
  twoThirds: string;
}

export interface SipenProcess {
  number: string;
  court: string;
  status: string;
  crimeDate: string;
  sentences: { date: string; crime: string; conviction: string; penalty: string }[];
  charges: { article: string; description: string }[];
}

export interface LegalOccurrence {
  process: string;
  date: string;
  description: string;
  type: string;
  result: string;
}

export interface VepInfo {
  lastCalculationDate: string;
  sentence: string;
  process: string;
  charges: string;
}

export interface VisitorsInfo {
  familyVisitors: FamilyVisitor[];
  religiousVisitors: ReligiousVisitor[];
  consularAgents: ConsularAgent[];
  intimateVisits: IntimateVisit[];
}

export interface FamilyVisitor {
  rg: string;
  name: string;
  photoUrl?: string;
  qualification: string;
  cardStatus: string;
  criminalAnalysis?: string;
  prohibited: boolean;
}

export interface ReligiousVisitor {
  name: string;
  institution: string;
  status: string;
}

export interface ConsularAgent {
  name: string;
  country: string;
  status: string;
}

export interface IntimateVisit {
  date: string;
  status: string;
}

export interface LawyerInfo {
  name: string;
  oab: string;
  sectionState: string;
  status: string;
  clientCount: number;
  recurring: boolean;
}

export interface LegalAppointmentInfo {
  date: string;
  lawyer: string;
  type: string;
}

export interface ImagesInfo {
  photos: { url: string; type: string; date: string }[];
  distinguishingMarks: {
    slot: string;
    description: string;
    location: string;
    url: string;
  }[];
  civilDocumentation: { type: string; description: string; url?: string }[];
}

export interface MovementsInfo {
  transfers: TransferInfo[];
  locationHistory: LocationHistoryInfo[];
}

export interface TransferInfo {
  occurrence: string;
  event: string;
  eventDate: string;
  unit: string;
  destination?: string;
  conclusion: string;
}

export interface LocationHistoryInfo {
  startDate: string;
  endDate?: string;
  unit: string;
  pavilion?: string;
  gallery?: string;
  cell?: string;
}

export interface ContactsInfo {
  phones: { number: string; countryCode?: string; type: string }[];
  emails: { address: string; type: string; provider?: string }[];
  addresses: {
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  }[];
}

export interface RelatedPersonInfo {
  name: string;
  relationship: string;
  classification: string;
}

export interface CompanyInfo {
  name: string;
  cnpj: string;
  status: string;
  cnae?: string;
  role?: string;
  currentRole?: string;
  startDate?: string;
  endDate?: string;
  partners: { name: string; cpf: string; qualification: string }[];
}

export interface JudicialProcessInfo {
  number: string;
  court: string;
  instance: string;
  date: string;
  lawyers: { name: string; oab: string }[];
}

export interface EscavadorProcessInfo {
  number: string;
  referralDate: string;
  filingDate: string;
  court: string;
  instance: string;
  parties: string[];
  lawyers: string[];
}

export interface SeeuProcessInfo {
  number: string;
  district: string;
  jurisdiction: string;
  filingDate: string;
  court: string;
  sentenceDate: string;
  judge: string;
  subjects: string;
}

export interface WarrantInfo {
  number: string;
  validityDate: string;
  biometrics?: string;
  issuingCourt?: string;
  arrestType: string;
  charges: string;
  penalty: string;
  regime: string;
}

export interface OfficialJournalInfo {
  date: string;
  location: string;
  description: string;
  link: string;
}

export interface QueridoDiarioInfo {
  date: string;
  location: string;
  link: string;
  state: string;
  extraEdition: boolean;
  phrases: string[];
}

export interface DigitalProfileInfo {
  platform: string;
  url: string;
  alias: string;
  profileId?: string;
}

export interface ElectoralInfo {
  donations: { candidate: string; amount: string; date: string; party: string }[];
  affiliations: {
    party: string;
    state: string;
    status: string;
    registrationDate: string;
    type?: string;
    cancellationDate?: string;
    cancellationReason?: string;
  }[];
  candidacies: {
    electionYear: string;
    electionType: string;
    description: string;
    electoralUnit: string;
    round: string;
    position: string;
    candidateNumber: string;
    party: string;
  }[];
  electoralLinks: {
    amount: string;
    description: string;
    date: string;
    type: string;
    label: string;
  }[];
}

export interface PublicServantInfo {
  source: string;
  institution: string;
  registration?: string;
  department: string;
  serviceTime?: string;
  career?: string;
  municipality?: string;
  functionalGroup?: string;
  employmentType?: string;
}

export interface PublicExpenseInfo {
  source: string;
  date: string;
  creditor?: string;
  commitmentNumber?: string;
  fundingSource?: string;
  classification?: string;
  amount?: number;
  departmentName?: string;
}

export interface OccurrencesInfo {
  serviceOrders: ServiceOrder[];
  occurrenceRecords: OccurrenceRecord[];
}

export interface ServiceOrder {
  number: string;
  date: string;
  type: string;
  purpose: string;
  status: string;
}

export interface OccurrenceRecord {
  date: string;
  description: string;
  responsible: string;
  sector: string;
}

export interface ActivitiesInfo {
  labor: LaborActivity[];
  educational: EducationalActivity[];
}

export interface LaborActivity {
  startDate: string;
  endDate?: string;
  description: string;
  program: string;
  status: string;
}

export interface EducationalActivity {
  startDate: string;
  endDate?: string;
  course: string;
  status: string;
}

// ── Functions ────────────────────────────────────────────────────

/**
 * Returns the TipoPerfil of the highest-precedence active profile.
 * Falls back to highest-precedence regardless of active status if none active.
 * Returns undefined for an empty array.
 */
export function resolvePrimaryProfile(profiles: Perfil[]): TipoPerfil | undefined {
  if (profiles.length === 0) return undefined;

  const active = profiles.filter((p) => p.ativo);
  const candidates = active.length > 0 ? active : profiles;

  let best: TipoPerfil | undefined;
  let bestIndex = Infinity;

  for (const p of candidates) {
    const idx = PROFILE_PRECEDENCE.indexOf(p.tipo as (typeof PROFILE_PRECEDENCE)[number]);
    if (idx !== -1 && idx < bestIndex) {
      bestIndex = idx;
      best = p.tipo;
    }
  }

  return best ?? candidates[0]?.tipo;
}
