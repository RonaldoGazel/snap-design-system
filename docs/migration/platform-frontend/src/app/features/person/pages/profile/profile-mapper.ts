// profile-mapper.ts
// Pure function: maps raw poi-service API response to PersonRecord.
// Requirements: 5.1-5.17
//
// IMPORTANT: All types (PersonRecord, PersonTag, Situation, etc.) are defined
// inline in profile.component.ts. This mapper re-declares only the minimal
// structural shapes needed to build the return value; the component's own
// interface definitions are the authoritative source.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe field accessor — never throws */
function g(o: Record<string, unknown>, key: string): unknown {
  return o[key];
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function obj(v: unknown): Record<string, unknown> {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Sub-builders
// ---------------------------------------------------------------------------

function buildSituation(
  custodyRaw: Record<string, unknown>,
  raw: Record<string, unknown>,
): {
  status: string;
  unidade: string;
  localAtual: string;
  regime: string;
  risco: string;
  entradaSistema: string;
  ultimaAtualizacao: string;
} {
  const pavilhao = str(g(raw, 'pavilhao'));
  const galeria = str(g(raw, 'galeria'));
  const cela = str(g(raw, 'cela'));
  const localParts = [pavilhao, galeria, cela].filter(Boolean);
  const localAtual = localParts.length > 0 ? localParts.join(' · ') : '';

  return {
    status: str(g(custodyRaw, 'status')) || str(g(custodyRaw, 'prisonStatus')) || '',
    unidade: str(g(custodyRaw, 'unidade')) || str(g(custodyRaw, 'unit')) || '',
    localAtual,
    regime: str(g(custodyRaw, 'regime')) || '',
    risco: str(g(custodyRaw, 'risco')) || str(g(raw, 'risco')) || '',
    entradaSistema: str(g(raw, 'data_entrada_sistema')) || str(g(custodyRaw, 'systemEntry')) || '',
    ultimaAtualizacao: str(g(raw, 'data_ultima_atualizacao')) || '',
  };
}

function buildIdentificationFields(
  raw: Record<string, unknown>,
): Array<{ label: string; value: string; source: string }> {
  return [
    { label: 'Nome completo', value: str(g(raw, 'nome')), source: 'API' },
    { label: 'CPF', value: str(g(raw, 'cpf')), source: 'API' },
    { label: 'RG', value: str(g(raw, 'rg')), source: 'API' },
    { label: 'Sexo', value: str(g(raw, 'sexo')), source: 'API' },
    { label: 'Data de nascimento', value: str(g(raw, 'nascimento')), source: 'API' },
    { label: 'Nacionalidade', value: str(g(raw, 'nacionalidade')), source: 'API' },
    { label: 'Naturalidade', value: str(g(raw, 'naturalidade')), source: 'API' },
    { label: 'Estado civil', value: str(g(raw, 'estado_civil')), source: 'API' },
    { label: 'Etnia', value: str(g(raw, 'etnia')), source: 'API' },
    { label: 'Religião', value: str(g(raw, 'religiao')), source: 'API' },
  ];
}

function buildBiographyFields(
  raw: Record<string, unknown>,
): Array<{ label: string; value: string; source: string }> {
  return [
    { label: 'Mãe', value: str(g(raw, 'mae')), source: 'API' },
    { label: 'Pai', value: str(g(raw, 'pai')), source: 'API' },
    { label: 'Escolaridade', value: str(g(raw, 'escolaridade')), source: 'API' },
    { label: 'Profissão declarada', value: str(g(raw, 'profissao')), source: 'API' },
  ];
}

function buildSipenCodeFields(
  raw: Record<string, unknown>,
): Array<{ label: string; value: string; source: string }> {
  return [
    { label: 'Prontuário SIPEN', value: str(g(raw, 'prontuario_sipen')), source: 'SIPEN' },
    { label: 'Processo DPJ', value: str(g(raw, 'processo_dpj')), source: 'SIPEN' },
    { label: 'Ambiente', value: str(g(raw, 'ambiente')), source: 'SIPEN' },
    { label: 'Entrada no sistema', value: str(g(raw, 'data_entrada')), source: 'SIPEN' },
    { label: 'Origem', value: str(g(raw, 'origem')), source: 'SIPEN' },
    { label: 'PIC', value: str(g(raw, 'pic')), source: 'SIPEN' },
  ];
}

function buildContacts(contatos: Record<string, unknown>): {
  phones: unknown[];
  emails: unknown[];
} {
  return {
    phones: arr(g(contatos, 'telefones')),
    emails: arr(g(contatos, 'emails')),
  };
}

function buildAddresses(contatos: Record<string, unknown>): unknown[] {
  return arr(g(contatos, 'enderecos'));
}

function buildCustody(
  eventos: unknown[],
  transferencias: unknown[],
  historico: unknown[],
  ocorrencias: unknown[],
): {
  timeline: unknown[];
  transfers: unknown[];
  locationHistory: unknown[];
  incidents: unknown[];
  activities: { labor: unknown[]; education: unknown[] };
  remissions: unknown[];
  mapLocation: { unit: string; address: string };
} {
  const timeline = eventos.map((e) => {
    const ev = obj(e);
    return {
      date: str(g(ev, 'data')) || str(g(ev, 'date')) || '',
      label: str(g(ev, 'tipo')) || str(g(ev, 'label')) || '',
      unit: str(g(ev, 'unidade')) || str(g(ev, 'unit')) || '',
      kind: str(g(ev, 'kind')) || 'incident',
      status: str(g(ev, 'status')) || '',
    };
  });

  return {
    timeline,
    transfers: transferencias,
    locationHistory: historico,
    incidents: ocorrencias,
    activities: { labor: [], education: [] },
    remissions: [],
    mapLocation: { unit: '', address: '' },
  };
}

function buildLegal(
  condenacoes: unknown[],
  mandados: unknown[],
): {
  penaSummary: {
    dataPrisao: string;
    ingressoSeap: string;
    terminoPena: string;
    totalSentenca: { years: number; months: number };
    tempoCumprido: { years: number; months: number };
    tempoACumprir: { years: number; months: number };
    diasTrabalhados: number;
    percentCumprido: number;
  };
  benefits: unknown[];
  processes: unknown[];
  warrants: unknown[];
  crimes: unknown[];
} {
  // Merge all process sources
  const processes = [...condenacoes];

  return {
    penaSummary: {
      dataPrisao: '',
      ingressoSeap: '',
      terminoPena: '',
      totalSentenca: { years: 0, months: 0 },
      tempoCumprido: { years: 0, months: 0 },
      tempoACumprir: { years: 0, months: 0 },
      diasTrabalhados: 0,
      percentCumprido: 0,
    },
    benefits: [],
    processes,
    warrants: mandados,
    crimes: [],
  };
}

function buildRelations(
  vinculos: unknown[],
  visitantes: unknown[],
  advogados: unknown[],
): { items: unknown[]; graphTotal: number } {
  const items = [...vinculos, ...visitantes, ...advogados];
  return {
    items,
    graphTotal: items.length,
  };
}

function buildPublicLife(
  eleitoral: Record<string, unknown>,
  transparencia: Record<string, unknown>,
  perfisDigitais: unknown[],
): {
  profiles: unknown[];
  gazettes: unknown[];
  electoral: {
    party: { name: string; uf: string; registration: string; status: string; kind: string };
    candidacies: unknown[];
    ties: unknown[];
  };
  transparency: { servants: unknown[]; expenses: unknown[] };
} {
  const partido = obj(g(eleitoral, 'partido'));
  return {
    profiles: perfisDigitais,
    gazettes: arr(g(eleitoral, 'diarios')) ?? [],
    electoral: {
      party: {
        name: str(g(partido, 'nome')),
        uf: str(g(partido, 'uf')),
        registration: str(g(partido, 'data_filiacao')),
        status: str(g(partido, 'situacao')),
        kind: str(g(partido, 'tipo')),
      },
      candidacies: arr(g(eleitoral, 'candidaturas')),
      ties: arr(g(eleitoral, 'vinculos')),
    },
    transparency: {
      servants: arr(g(transparencia, 'servidores')),
      expenses: arr(g(transparencia, 'despesas')),
    },
  };
}

function buildSourceInfo(
  fontes: unknown[],
  raw: Record<string, unknown>,
): {
  sources: string[];
  lastSyncSipen: string;
  lastSyncSnap: string;
  conflicts: number;
  confidence: string;
} {
  // Deduplicate source types
  const sourceSet = new Set<string>();
  for (const f of fontes) {
    const fo = obj(f);
    const tipo = str(g(fo, 'tipo'));
    if (tipo) sourceSet.add(tipo);
  }

  return {
    sources: Array.from(sourceSet),
    lastSyncSipen: str(g(raw, 'last_sync_sipen')),
    lastSyncSnap: str(g(raw, 'last_sync_snap')),
    conflicts: 0,
    confidence: str(g(raw, 'confidence')),
  };
}

function buildCriticalAlert(raw: Record<string, unknown>): {
  kind: string;
  severity: string;
  time: string;
  title: string;
  body: string;
  actions: string[];
} {
  const alert = obj(g(raw, 'contextual_alert') ?? g(raw, 'critical_alert'));
  return {
    kind: str(g(alert, 'kind')),
    severity: str(g(alert, 'severity')),
    time: str(g(alert, 'time')),
    title: str(g(alert, 'title')),
    body: str(g(alert, 'body')),
    actions: arr(g(alert, 'actions')).map(str),
  };
}

function buildLastUpdateAlert(raw: Record<string, unknown>): { text: string; href: string } {
  const alert = obj(g(raw, 'last_update_alert'));
  return {
    text: str(g(alert, 'text')),
    href: str(g(alert, 'href')),
  };
}

// ---------------------------------------------------------------------------
// Tag mapping
// ---------------------------------------------------------------------------

type PersonTagTone = 'pillar' | 'danger' | 'neutral' | 'faction';

function mapTag(raw: unknown): { t: string; tone: PersonTagTone } {
  const r = obj(raw);
  const tone = str(g(r, 'tone'));
  const validTones: PersonTagTone[] = ['pillar', 'danger', 'neutral', 'faction'];
  return {
    t: str(g(r, 't')) || str(g(r, 'label')) || str(raw),
    tone: (validTones.includes(tone as PersonTagTone) ? tone : 'neutral') as PersonTagTone,
  };
}

// ---------------------------------------------------------------------------
// Photo / mark mapping
// ---------------------------------------------------------------------------

function mapPhoto(raw: unknown): { label: string; url: string; date: string } {
  const r = obj(raw);
  return {
    label: str(g(r, 'label')),
    url: str(g(r, 'url')) || str(g(r, 'foto_url')),
    date: str(g(r, 'date')) || str(g(r, 'data')),
  };
}

function mapMark(raw: unknown): { type: string; area: string; desc: string } {
  const r = obj(raw);
  return {
    type: str(g(r, 'type')) || str(g(r, 'tipo')),
    area: str(g(r, 'area')),
    desc: str(g(r, 'desc')) || str(g(r, 'descricao')),
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Maps a raw poi-service API response to the PersonRecord shape consumed by
 * ProfileNewComponent.
 *
 * Preconditions:  raw is a non-null object (may have any subset of fields).
 * Postconditions: Returns a valid PersonRecord with no undefined required fields.
 *                 Does not throw for any missing field.
 *                 Does not mutate raw.
 */
export function mapApiResponseToPersonRecord(raw: Record<string, unknown>): {
  id: string;
  photo: string;
  name: string;
  aliases: string[];
  cpf: string;
  rg: string;
  matriculaSipen: string;
  tags: Array<{ t: string; tone: 'pillar' | 'danger' | 'neutral' | 'faction' }>;
  situation: {
    status: string;
    unidade: string;
    localAtual: string;
    regime: string;
    risco: string;
    entradaSistema: string;
    ultimaAtualizacao: string;
  };
  monitoring: string[];
  criticalAlert: {
    kind: string;
    severity: string;
    time: string;
    title: string;
    body: string;
    actions: string[];
  };
  lastUpdateAlert: { text: string; href: string };
  aiSummary: { paragraphs: string[]; sources: string[] };
  identification: Array<{ label: string; value: string; source: string }>;
  biography: Array<{ label: string; value: string; source: string }>;
  sipenCodes: Array<{ label: string; value: string; source: string }>;
  photos: Array<{ label: string; url: string; date: string }>;
  photosTotal: number;
  marks: Array<{ type: string; area: string; desc: string }>;
  contacts: { phones: unknown[]; emails: unknown[] };
  addresses: unknown[];
  sourceInfo: {
    sources: string[];
    lastSyncSipen: string;
    lastSyncSnap: string;
    conflicts: number;
    confidence: string;
  };
  documents: never[];
  custody: {
    timeline: unknown[];
    transfers: unknown[];
    locationHistory: unknown[];
    incidents: unknown[];
    activities: { labor: unknown[]; education: unknown[] };
    remissions: unknown[];
    mapLocation: { unit: string; address: string };
  };
  legal: {
    penaSummary: {
      dataPrisao: string;
      ingressoSeap: string;
      terminoPena: string;
      totalSentenca: { years: number; months: number };
      tempoCumprido: { years: number; months: number };
      tempoACumprir: { years: number; months: number };
      diasTrabalhados: number;
      percentCumprido: number;
    };
    benefits: unknown[];
    processes: unknown[];
    warrants: unknown[];
    crimes: unknown[];
  };
  publicLife: {
    profiles: unknown[];
    gazettes: unknown[];
    electoral: {
      party: { name: string; uf: string; registration: string; status: string; kind: string };
      candidacies: unknown[];
      ties: unknown[];
    };
    transparency: { servants: unknown[]; expenses: unknown[] };
  };
  relations: { items: unknown[]; graphTotal: number };
} {
  // ── Identity ──────────────────────────────────────────────────────────────
  const id = str(g(raw, 'id') ?? g(raw, 'uuid'));
  const photo = str(g(raw, 'foto_url') ?? g(raw, 'fotoUrl'));
  const name = str(g(raw, 'nome'));
  const aliases = arr(g(raw, 'vulgos')).map(str);
  const cpf = str(g(raw, 'cpf'));
  const rg = str(g(raw, 'rg'));
  const matriculaSipen = str(g(raw, 'matricula') ?? g(raw, 'prontuario_sipen'));

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tags = arr(g(raw, 'tagsRelevantes')).map(mapTag);

  // ── Situation ─────────────────────────────────────────────────────────────
  const custodyRaw = obj(g(raw, 'situacao_prisional') ?? g(raw, 'custody'));
  const situation = buildSituation(custodyRaw, raw);

  // ── Identification / Biography / SIPEN codes ──────────────────────────────
  const identification = buildIdentificationFields(raw);
  const biography = buildBiographyFields(raw);
  const sipenCodes = buildSipenCodeFields(raw);

  // ── Contacts & Addresses ──────────────────────────────────────────────────
  const contatosRaw = obj(g(raw, 'contatos'));
  const contacts = buildContacts(contatosRaw);
  const addresses = buildAddresses(contatosRaw);

  // ── Custody ───────────────────────────────────────────────────────────────
  const eventos = arr(g(raw, 'eventos'));
  const movimentacoes = obj(g(raw, 'movimentacoes'));
  const transferencias = arr(g(movimentacoes, 'transferencias'));
  const historico = arr(g(movimentacoes, 'historico_localizacao'));
  const ocorrencias = arr(g(raw, 'ocorrencias'));
  const custody = buildCustody(eventos, transferencias, historico, ocorrencias);

  // ── Legal ─────────────────────────────────────────────────────────────────
  const condenacoes = arr(g(raw, 'condenacoes'));
  const processosEscavador = arr(g(raw, 'processos_escavador'));
  const processosSeeu = arr(g(raw, 'processos_seeu'));
  const mandados = arr(g(raw, 'mandados'));
  const legal = buildLegal([...condenacoes, ...processosEscavador, ...processosSeeu], mandados);

  // ── Relations ─────────────────────────────────────────────────────────────
  const vinculos = arr(g(raw, 'vinculos'));
  const visitantes = arr(g(raw, 'visitantes'));
  const advogados = arr(g(raw, 'advogados'));
  const relations = buildRelations(vinculos, visitantes, advogados);

  // ── Public life ───────────────────────────────────────────────────────────
  const eleitoral = obj(g(raw, 'informacoes_eleitorais'));
  const transparencia = obj(g(raw, 'transparencia'));
  const perfisDigitais = arr(g(raw, 'perfis_digitais'));
  const publicLife = buildPublicLife(eleitoral, transparencia, perfisDigitais);

  // ── Source info ───────────────────────────────────────────────────────────
  const fontes = arr(g(raw, 'fontes'));
  const sourceInfo = buildSourceInfo(fontes, raw);

  // ── Alerts ────────────────────────────────────────────────────────────────
  const criticalAlert = buildCriticalAlert(raw);
  const lastUpdateAlert = buildLastUpdateAlert(raw);

  // ── Photos & marks ────────────────────────────────────────────────────────
  const photos = arr(g(raw, 'fotos')).map(mapPhoto);
  const marks = arr(g(raw, 'sinais_caracteristicos')).map(mapMark);

  // ── AI summary & documents — not available from API ───────────────────────
  const aiSummary: { paragraphs: string[]; sources: string[] } = {
    paragraphs: [],
    sources: [],
  };
  const documents: never[] = [];

  return {
    id,
    photo,
    name,
    aliases,
    cpf,
    rg,
    matriculaSipen,
    tags,
    situation,
    monitoring: [],
    criticalAlert,
    lastUpdateAlert,
    aiSummary,
    identification,
    biography,
    sipenCodes,
    photos,
    photosTotal: photos.length,
    marks,
    contacts,
    addresses,
    sourceInfo,
    documents,
    custody,
    legal,
    publicLife,
    relations,
  };
}
