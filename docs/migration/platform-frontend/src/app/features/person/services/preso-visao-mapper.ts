/**
 * Maps the PresoVisao API response (from poi-service GET /person/:id)
 * to the UnifiedPerson interface used by the profile component.
 *
 * Handles both the legacy camelCase mock shape and the real poi-service
 * snake_case API shape (detail_sipen.json, detail_snap.json).
 */
import {
  UnifiedPerson,
  PenalEvent,
  FamilyVisitor,
  CustodyInfo,
  LegalRecordInfo,
  PenalHistoryInfo,
  VisitorsInfo,
} from '../models/unified-person.model';
import { parseJsonField } from './api-person-mapper';

/* eslint-disable @typescript-eslint/no-explicit-any */
function g(obj: Record<string, unknown>, key: string): any {
  return obj[key];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute age from a date string. Supports "dd/MM/yyyy" and "yyyy-MM-dd" formats.
 * Returns 0 if the date cannot be parsed.
 */
function computeAge(dateStr: string): number {
  if (!dateStr) return 0;

  let birthDate: Date | null = null;

  // Try dd/MM/yyyy
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    birthDate = new Date(+brMatch[3], +brMatch[2] - 1, +brMatch[1]);
  }

  // Try yyyy-MM-dd
  if (!birthDate) {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      birthDate = new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Map the `condenacoes` array from the real API to a CustodyInfo object.
 * Uses the first conviction to populate crime/article/regime fields.
 */
function mapCondenacaoToCustody(
  data: Record<string, unknown>,
  condenacoes: any[],
): CustodyInfo | undefined {
  // If legacy camelCase custody fields exist, use them
  if (g(data, 'statusPrisional')) {
    return {
      prisonStatus: (g(data, 'statusPrisional') ?? '') as string,
      securityClassification: (g(data, 'classificacaoSeguranca') ?? '') as string,
      dangerLevel: (g(data, 'periculosidade') ?? 'medio') as 'critico' | 'alto' | 'medio' | 'baixo',
      crime: (g(data, 'crime') ?? '') as string,
      article: (g(data, 'artigo') ?? '') as string,
      regime: (g(data, 'regime') ?? '') as string,
      unit: (g(data, 'unidade') ?? '') as string,
      pavilion: g(data, 'pavilhao') as string | undefined,
      gallery: g(data, 'galeria') as string | undefined,
      cell: g(data, 'cela') as string | undefined,
      lastUpdateDate: (g(data, 'dataUltimaAtualizacao') ?? '') as string,
      faction: g(data, 'faccao') as string | undefined,
      factionRole: g(data, 'papelFaccao') as string | undefined,
      sipenRegistration: (g(data, 'matriculaSipen') ?? '') as string,
      sipenCode: (g(data, 'codigoSipen') ?? '') as string,
      pic: (g(data, 'pic') ?? '') as string,
      rji: (g(data, 'rji') ?? '') as string,
      dossierSipen: (g(data, 'prontuarioSipen') ?? '') as string,
      processDpj: (g(data, 'processoDpj') ?? '') as string,
      environment: (g(data, 'ambiente') ?? '') as string,
      systemEntry: (g(data, 'entradaSistema') ?? '') as string,
      origin: (g(data, 'origem') ?? '') as string,
    };
  }

  // Real API shape: derive custody from condenacoes
  if (!Array.isArray(condenacoes) || condenacoes.length === 0) {
    return undefined;
  }

  const first = condenacoes[0];
  return {
    prisonStatus: (first['status'] ?? '') as string,
    securityClassification: '',
    dangerLevel: 'medio',
    crime: (first['crime'] ?? '') as string,
    article: (first['artigos_legais'] ?? '') as string,
    regime: '',
    unit: '',
    lastUpdateDate: (first['data_sentenca'] ?? '') as string,
    sipenRegistration: '',
    sipenCode: '',
    pic: '',
    rji: '',
    dossierSipen: '',
    processDpj: '',
    environment: '',
    systemEntry: '',
    origin: (first['fonte'] ?? '') as string,
  };
}

/**
 * Map the `condenacoes` array to a LegalRecordInfo object.
 */
function mapCondenacaoToLegalRecord(condenacoes: any[]): LegalRecordInfo | undefined {
  if (!Array.isArray(condenacoes) || condenacoes.length === 0) {
    return undefined;
  }

  const processes = condenacoes.map((c: any) => ({
    number: (c['uuid'] ?? '') as string,
    court: '',
    status: (c['status'] ?? '') as string,
    crimeDate: (c['data_sentenca'] ?? '') as string,
    sentences: [
      {
        date: (c['data_sentenca'] ?? '') as string,
        crime: (c['crime'] ?? '') as string,
        conviction: (c['artigos_legais'] ?? '') as string,
        penalty: c['pena_dias'] ? `${c['pena_dias']} dias` : '',
      },
    ],
    charges: c['artigos_legais']
      ? [{ article: c['artigos_legais'] as string, description: (c['crime'] ?? '') as string }]
      : [],
  }));

  const first = condenacoes[0];
  return {
    sentenceCalculation: {
      arrestDate: '',
      seapEntry: '',
      sentenceEnd: '',
      totalSentence: first['pena_dias'] ? `${first['pena_dias']} dias` : '',
      timeServed: '',
      timeRemaining: '',
      daysWorked: first['dias_remicao'] ? `${first['dias_remicao']}` : '',
    },
    benefitDates: {
      oneSixth: (first['data_beneficio_1_6'] ?? '') as string,
      oneQuarter: '',
      oneThird: (first['data_beneficio_1_3'] ?? '') as string,
      oneHalf: (first['data_beneficio_1_2'] ?? '') as string,
      twoThirds: '',
    },
    processes,
    legalOccurrences: [],
    vep: {
      lastCalculationDate: '',
      sentence: first['pena_dias'] ? `${first['pena_dias']} dias` : '',
      process: '',
      charges: (first['artigos_legais'] ?? '') as string,
    },
  };
}

/**
 * Map the `eventos` array from the real API to PenalHistoryInfo.
 */
function mapEventosToPenalHistory(
  data: Record<string, unknown>,
  eventos: any[],
): PenalHistoryInfo | undefined {
  // Legacy camelCase shape
  const histPenal = g(data, 'historicoPenal') as any[] | undefined;
  if (Array.isArray(histPenal) && histPenal.length > 0) {
    return {
      events: histPenal,
      behaviorIndex: (g(data, 'indiceBehavior') ?? []) as any[],
      privileges: (g(data, 'regalias') ?? []) as any[],
      benefits: (g(data, 'beneficios') ?? []) as any[],
      sentenceReduction: (g(data, 'remicaoPena') ?? []) as any[],
    };
  }

  // Real API shape: map eventos array
  if (!Array.isArray(eventos) || eventos.length === 0) {
    return undefined;
  }

  const penalEvents: PenalEvent[] = eventos.map((e: any) => ({
    type: (e['tipo'] ?? e['type'] ?? '') as string,
    title: (e['titulo'] ?? e['title'] ?? '') as string,
    description: (e['descricao'] ?? e['description'] ?? '') as string,
    date: (e['data'] ?? '') as string,
    status: e['status'] as string | undefined,
  }));

  return {
    events: penalEvents,
    behaviorIndex: [],
    privileges: [],
    benefits: [],
    sentenceReduction: [],
  };
}

/**
 * Map the `visitantes` array (UUID references) to VisitorsInfo.
 */
function mapVisitantesToVisitors(
  data: Record<string, unknown>,
  visitantes: any[],
): VisitorsInfo | undefined {
  // Legacy camelCase shape — check for nested visitor objects
  const legacyVisitantes = g(data, 'visitantesFamiliares') as any[] | undefined;
  if (Array.isArray(legacyVisitantes) && legacyVisitantes.length > 0) {
    return {
      familyVisitors: legacyVisitantes,
      religiousVisitors: (g(data, 'visitantesReligiosos') ?? []) as any[],
      consularAgents: (g(data, 'agentesConsulares') ?? []) as any[],
      intimateVisits: (g(data, 'visitasIntimas') ?? []) as any[],
    };
  }

  // Real API shape: visitantes are UUID references
  if (!Array.isArray(visitantes) || visitantes.length === 0) {
    return undefined;
  }

  const familyVisitors: FamilyVisitor[] = visitantes.map((v: any) => ({
    rg: '',
    name: (v['nome'] ?? v['uuid'] ?? '') as string,
    qualification: '',
    cardStatus: '',
    prohibited: false,
  }));

  return {
    familyVisitors,
    religiousVisitors: [],
    consularAgents: [],
    intimateVisits: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function mapPresoVisaoToUnifiedPerson(data: Record<string, unknown>): UnifiedPerson {
  const mon = (g(data, 'monitoramento') ?? {}) as Record<string, unknown>;
  const contatos = (g(data, 'contatos') ?? {}) as Record<string, unknown>;
  const eleitoral = (g(data, 'informacoesEleitorais') ?? {}) as Record<string, unknown>;

  // Real API arrays
  const condenacoes = (g(data, 'condenacoes') ?? []) as any[];
  const visitantes = (g(data, 'visitantes') ?? []) as any[];
  const eventos = (g(data, 'eventos') ?? []) as any[];

  // Birth date: support both camelCase (nascimento) and snake_case (data_nascimento)
  const birth = (g(data, 'nascimento') ??
    g(data, 'data_nascimento') ??
    g(data, 'dataNascimento') ??
    '') as string;

  // Age: use explicit value or compute from birth date
  const age = (g(data, 'idade') as number) || computeAge(birth);

  // Ethnicity: support both camelCase (etnia) and snake_case (cor_pele)
  const ethnicity = (g(data, 'etnia') ?? g(data, 'cor_pele') ?? g(data, 'corPele')) as
    | string
    | undefined;

  // Education: support both camelCase (escolaridade) and snake_case (grau_instrucao)
  const education = (g(data, 'escolaridade') ??
    g(data, 'grau_instrucao') ??
    g(data, 'grauInstrucao')) as string | undefined;

  // Marital status: support both camelCase (estadoCivil) and snake_case (estado_civil)
  const maritalStatus = (g(data, 'estadoCivil') ?? g(data, 'estado_civil')) as string | undefined;

  // Profession: support both camelCase and snake_case
  const profession = (g(data, 'profissao') ?? g(data, 'profissão')) as string | undefined;

  // Photo URL: support both camelCase and snake_case
  const photoUrl = (g(data, 'fotoUrl') ?? g(data, 'foto_url')) as string | undefined;

  // Parse sinais_caracteristicos if present (JSON string from real API)
  const sinaisRaw = g(data, 'sinais_caracteristicos') ?? g(data, 'sinaisCaracteristicos');
  const sinaisCaracteristicos = parseJsonField<any[]>(sinaisRaw, []);

  // Build profiles: use existing perfis or derive from rotulos
  const apiPerfis = g(data, 'perfis') as any[] | undefined;
  const rotulosRaw = g(data, 'rotulos');
  const rotulos = parseJsonField<string[]>(rotulosRaw, []);

  let profiles: any[];
  if (Array.isArray(apiPerfis) && apiPerfis.length > 0) {
    profiles = apiPerfis.map((p: any) => ({
      tipo: p['tipo'] ?? 'pessoa-relacionada',
      ativo: p['ativo'] ?? true,
      dataInicio: p['dataInicio'] ?? p['data_inicio'] ?? '',
      dataFim: p['dataFim'] ?? p['data_fim'],
      detalhes: p['detalhes'] ?? {},
    }));
  } else if (rotulos.length > 0) {
    // Derive from rotulos — "Inmate" → preso, etc.
    const rotuloToTipo: Record<string, string> = {
      Inmate: 'preso',
      Visitor: 'visitante',
      Lawyer: 'advogado',
    };
    profiles = rotulos
      .filter((r: string) => rotuloToTipo[r])
      .map((r: string) => ({
        tipo: rotuloToTipo[r],
        ativo: true,
        dataInicio: '',
        detalhes: {},
      }));
    // Fallback if no rotulos matched
    if (profiles.length === 0) {
      profiles = [
        {
          tipo: g(data, 'statusPrisional') ? 'preso' : 'pessoa-relacionada',
          ativo: true,
          dataInicio: (g(data, 'entradaSistema') ?? '') as string,
          detalhes: {},
        },
      ];
    }
  } else {
    profiles = [
      {
        tipo: g(data, 'statusPrisional') ? 'preso' : 'pessoa-relacionada',
        ativo: true,
        dataInicio: (g(data, 'entradaSistema') ?? '') as string,
        detalhes: {
          regime: (g(data, 'regime') ?? '') as string,
          unidade: (g(data, 'unidade') ?? '') as string,
          artigoCondenacao: (g(data, 'artigo') ?? '') as string,
        },
      },
    ];
  }

  // Build images info from sinais_caracteristicos
  const images =
    sinaisCaracteristicos.length > 0
      ? {
          photos: ((g(data, 'fotos') ?? []) as any[]).map((f: any) => ({
            url: (f['url'] ?? '') as string,
            type: (f['tipo'] ?? f['type'] ?? '') as string,
            date: (f['data'] ?? f['date'] ?? '') as string,
          })),
          distinguishingMarks: sinaisCaracteristicos.map((s: any) => ({
            slot: (s['mark_type'] ?? s['slot'] ?? '') as string,
            description: (s['description'] ?? s['descricao'] ?? '') as string,
            location: (s['location'] ?? s['localizacao'] ?? '') as string,
            url: (s['url'] ?? '') as string,
          })),
          civilDocumentation: [],
        }
      : undefined;

  // Determine available sources from _sources or fontes
  const sources = g(data, '_sources') as
    | Array<{ graph_id: string; display_name: string }>
    | undefined;
  const availableSources: string[] = [];
  if (Array.isArray(sources)) {
    sources.forEach((s) => {
      if (s.display_name) availableSources.push(s.display_name);
    });
  }
  const fontes = g(data, 'fontes') as any[] | undefined;
  if (Array.isArray(fontes)) {
    fontes.forEach((f: any) => {
      const tipo = f['tipo'] as string | undefined;
      if (tipo && !availableSources.includes(tipo)) {
        availableSources.push(tipo);
      }
    });
  }
  const fonteStr = g(data, 'fonte') as string | undefined;
  if (fonteStr && !availableSources.includes(fonteStr)) {
    availableSources.push(fonteStr);
  }

  return {
    id: (g(data, 'id') ?? g(data, 'uuid') ?? '') as string,
    name: (g(data, 'nome') ?? '') as string,
    aliases: (g(data, 'vulgos') ?? []) as string[],
    cpf: (g(data, 'cpf') ?? '') as string,
    rg: g(data, 'rg') as string | undefined,
    photoUrl,
    birthDate: birth,
    age,
    sex: (g(data, 'sexo') ?? '') as string,
    father: g(data, 'pai') as string | undefined,
    mother: g(data, 'mae') as string | undefined,
    birthPlace: g(data, 'naturalidade') as string | undefined,
    nationality: g(data, 'nacionalidade') as string | undefined,
    maritalStatus,
    profession,
    education,
    religion: g(data, 'religiao') as string | undefined,
    ethnicity,

    profiles,

    tags: ((g(data, 'tags') ?? g(data, 'tagsRelevantes') ?? []) as any[]).map((t: any) => ({
      label: (t['rotulo'] ?? t['label'] ?? '') as string,
      category: (t['categoria'] ?? t['category'] ?? '') as string,
      color: t['cor'] ?? t['color'],
    })),

    riskLevel: (g(data, 'periculosidade') ?? 'medio') as 'critico' | 'alto' | 'medio' | 'baixo',

    monitoring: {
      monitored: (g(mon, 'monitorado') ?? false) as boolean,
      target: (g(mon, 'alvo') ?? false) as boolean,
    },

    // Custody: from legacy camelCase or real API condenacoes
    custody: mapCondenacaoToCustody(data, condenacoes),

    // Penal history: from legacy camelCase or real API eventos
    penalHistory: mapEventosToPenalHistory(data, eventos),

    // Legal record: from real API condenacoes
    legalRecord: g(data, 'statusPrisional')
      ? undefined // Legacy shape doesn't populate this from condenacoes
      : mapCondenacaoToLegalRecord(condenacoes),

    // Visitors: from legacy camelCase or real API visitantes
    visitors: mapVisitantesToVisitors(data, visitantes),

    lawyers: ((g(data, 'advogados') ?? []) as any[]).map((a: any) => ({
      name: (a['nome'] ?? '') as string,
      oab: (a['oab'] ?? '') as string,
      sectionState: (a['ufSeccional'] ?? '') as string,
      status: (a['situacao'] ?? '') as string,
      clientCount: (a['qtdClientes'] ?? 0) as number,
      recurring: (a['recorrente'] ?? false) as boolean,
    })),
    legalAppointments: [],

    // Images: from sinais_caracteristicos parsing
    images,

    // Movements: default to undefined (not in real API detail shape)
    movements: undefined,

    contacts: {
      phones: (g(contatos, 'telefones') ?? []) as any[],
      emails: (g(contatos, 'emails') ?? []) as any[],
      addresses: (g(contatos, 'enderecos') ?? []) as any[],
    },

    relatedPersons: (g(data, 'pessoasRelacionadas') ?? []) as any[],
    companies: (g(data, 'empresas') ?? []) as any[],
    judicialProcesses: (g(data, 'processosJudiciais') ?? []) as any[],
    escavadorProcesses: [],
    seeuProcesses: [],
    warrants: (g(data, 'mandadosPrisao') ?? g(data, 'mandados') ?? []) as any[],
    officialJournals: (g(data, 'diariosOficiais') ?? []) as any[],
    queridoDiarioJournals: [],
    digitalProfiles: (g(data, 'perfisDigitais') ?? []) as any[],
    electoral: {
      donations: (g(eleitoral, 'doacoes') ?? []) as any[],
      affiliations: (g(eleitoral, 'filiacao') ?? []) as any[],
      candidacies: [],
      electoralLinks: [],
    },
    publicServants: [],
    publicExpenses: [],

    // Occurrences: default to undefined
    occurrences: undefined,

    // Activities: default to undefined
    activities: undefined,

    // Provenance metadata — preserved from real API
    _sources: sources,
    _merged_from: g(data, '_merged_from') as number | undefined,

    availableSources,
  } as UnifiedPerson;
}
