/**
 * Maps poi-service API person responses (snake_case, flat) to the
 * frontend Pessoa model (camelCase, typed).
 *
 * Input contract: the shape returned by GET /person/list and GET /person/{id}
 * as seen in return_list.json, detail_sipen.json, detail_snap.json.
 */
import { Pessoa } from '../models/pessoa.model';
import { Perfil, TipoPerfil } from '../models/perfil.model';
import { Fonte, StatusDivergencia, TipoFonte } from '../models/fonte.model';
import { Tag } from '../models/tag.model';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Safe property accessor — mirrors the g() helper in preso-visao-mapper.ts */
function g(obj: Record<string, unknown>, key: string): any {
  return obj[key];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a fonte tipo string from the API (e.g. "SIPEN", "SNAP")
 * to the lowercase TipoFonte union expected by the model.
 */
function normaliseFonteTipo(raw: string): TipoFonte {
  const lower = raw.toLowerCase();
  if (lower === 'sipen' || lower === 'snap' || lower === 'manual') {
    return lower;
  }
  // Fallback for unknown fonte types — treat as manual
  return 'manual';
}

/**
 * Normalise the statusReconciliacao value from the API.
 * The API uses underscores (e.g. "sem_divergencia") while the model uses
 * hyphens (e.g. "sem-divergencia").
 */
function normaliseStatusDivergencia(raw: unknown): StatusDivergencia {
  if (typeof raw !== 'string' || !raw) {
    return 'sem-divergencia';
  }
  const normalised = raw.replace(/_/g, '-') as StatusDivergencia;
  const valid = [
    'sem-divergencia',
    'divergencia-identificada',
    'divergencia-resolvida',
    'divergencia-mantida-como-sinal',
  ];
  return valid.indexOf(normalised) !== -1 ? normalised : 'sem-divergencia';
}

/**
 * Parse a JSON string field safely. Returns the parsed value or the
 * fallback when parsing fails or the input is not a string.
 *
 * Exported for reuse by other mappers (e.g. sinais_caracteristicos parsing
 * in mapPresoVisaoToUnifiedPerson).
 */
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') {
    // If it's already the expected type (array/object), return as-is
    if (Array.isArray(fallback) && Array.isArray(value)) {
      return value as T;
    }
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Map the API `fontes` array (uppercase tipo, minimal fields) to the
 * model's Fonte interface (lowercase tipo, full fields with defaults).
 */
function mapFontes(raw: unknown[]): Fonte[] {
  return raw.map((f: any) => ({
    tipo: normaliseFonteTipo((f['tipo'] ?? '') as string),
    prioridade: (f['prioridade'] ?? 0) as number,
    dataConsulta: (f['dataConsulta'] ?? f['data_consulta'] ?? '') as string,
    status: normaliseFonteStatus(f['status']),
  }));
}

/**
 * Normalise fonte status from API ("ativo") to model ("ativa" | "divergente" | "reconciliada").
 */
function normaliseFonteStatus(raw: unknown): 'ativa' | 'divergente' | 'reconciliada' {
  if (typeof raw !== 'string') return 'ativa';
  const lower = raw.toLowerCase();
  if (lower === 'ativa' || lower === 'ativo') return 'ativa';
  if (lower === 'divergente') return 'divergente';
  if (lower === 'reconciliada' || lower === 'reconciliado') return 'reconciliada';
  return 'ativa';
}

/**
 * Map the API `tagsRelevantes` array to the model's Tag interface.
 */
function mapTags(raw: unknown[]): Tag[] {
  return raw.map((t: any) => ({
    id: (t['id'] ?? '') as string,
    rotulo: (t['rotulo'] ?? t['label'] ?? '') as string,
    categoria: (t['categoria'] ?? t['category'] ?? '') as string,
    cor: t['cor'] ?? t['color'],
    dataAplicacao: (t['dataAplicacao'] ?? t['data_aplicacao'] ?? '') as string,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maps a single person object from the poi-service API response to the
 * frontend Pessoa model.
 *
 * Handles:
 * - snake_case → camelCase field mapping
 * - JSON string parsing for sinais_caracteristicos and rotulos
 * - Single `fonte` string → `fontes` array construction
 * - Provenance metadata (_sources, _merged_from) preservation
 * - Graceful defaults for missing optional fields
 *
 * @param raw - A single person record from the API (e.g. an item from the list endpoint)
 * @returns A fully mapped Pessoa object
 */
export function mapApiPersonToPessoa(raw: Record<string, unknown>): Pessoa {
  // Parse JSON string fields
  const rotulosRaw = parseJsonField<string[]>(g(raw, 'rotulos'), []);

  // Build fontes: prefer the existing fontes array, fall back to constructing from `fonte` string
  const apiFontes = g(raw, 'fontes') as any[] | undefined;
  let fontes: Fonte[];

  if (Array.isArray(apiFontes) && apiFontes.length > 0) {
    fontes = mapFontes(apiFontes);
  } else {
    const fonteStr = g(raw, 'fonte') as string | undefined;
    if (fonteStr) {
      fontes = [
        {
          tipo: normaliseFonteTipo(fonteStr),
          prioridade: 0,
          dataConsulta: '',
          status: 'ativa',
        },
      ];
    } else {
      fontes = [];
    }
  }

  // Build perfis: use existing array, or derive from rotulos if empty
  const apiPerfis = g(raw, 'perfis') as any[] | undefined;
  let perfis: Perfil[];

  if (Array.isArray(apiPerfis) && apiPerfis.length > 0) {
    perfis = apiPerfis.map((p: any) => ({
      tipo: (p['tipo'] ?? 'pessoa-relacionada') as TipoPerfil,
      ativo: (p['ativo'] ?? true) as boolean,
      dataInicio: (p['dataInicio'] ?? p['data_inicio'] ?? '') as string,
      dataFim: p['dataFim'] ?? p['data_fim'],
      detalhes: (p['detalhes'] ?? {}) as Record<string, string | number | boolean>,
    }));
  } else {
    perfis = derivePerfilFromRotulos(rotulosRaw);
  }

  // Map tags
  const apiTags = g(raw, 'tagsRelevantes') as any[] | undefined;
  const tagsRelevantes = Array.isArray(apiTags) ? mapTags(apiTags) : [];

  return {
    id: (g(raw, 'id') ?? g(raw, 'uuid') ?? '') as string,
    nome: (g(raw, 'nome') ?? '') as string,
    vulgos: (g(raw, 'vulgos') ?? []) as string[],
    cpf: g(raw, 'cpf') as string | undefined,
    rg: g(raw, 'rg') as string | undefined,
    matricula: g(raw, 'matricula') as string | undefined,
    dataNascimento: (g(raw, 'dataNascimento') ?? g(raw, 'data_nascimento')) as string | undefined,
    sexo: g(raw, 'sexo') as string | undefined,
    fotoUrl: (g(raw, 'fotoUrl') ?? g(raw, 'foto_url')) as string | undefined,
    pai: g(raw, 'pai') as string | undefined,
    mae: g(raw, 'mae') as string | undefined,
    naturalidade: g(raw, 'naturalidade') as string | undefined,
    nacionalidade: g(raw, 'nacionalidade') as string | undefined,
    perfis,
    fontes,
    resumoAnalitico: (g(raw, 'resumoAnalitico') ?? g(raw, 'resumo_analitico') ?? '') as string,
    statusReconciliacao: normaliseStatusDivergencia(
      g(raw, 'statusReconciliacao') ?? g(raw, 'status_reconciliacao'),
    ),
    tagsRelevantes,
    rotulos: rotulosRaw.length > 0 ? rotulosRaw : undefined,
    _sources: g(raw, '_sources') as Array<{ graph_id: string; display_name: string }> | undefined,
    _merged_from: g(raw, '_merged_from') as number | undefined,
  };
}

/**
 * Maps the full person list response from the API to a Pessoa array.
 *
 * Accepts the top-level response object (with `items` array) and maps
 * each item through mapApiPersonToPessoa().
 *
 * @param raw - The full list response object from GET /person/list
 * @returns An array of mapped Pessoa objects
 */
export function mapApiPersonListToPessoas(raw: Record<string, unknown>): Pessoa[] {
  const items = g(raw, 'items');
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item: Record<string, unknown>) => mapApiPersonToPessoa(item));
}

/**
 * Derives Perfil entries from the rotulos (labels) array when the perfis
 * array is empty.
 *
 * Mapping:
 * - "Inmate" → preso
 * - "Visitor" → visitante
 * - "Lawyer" → advogado
 * - "Person" → skipped (too generic)
 *
 * Each derived Perfil has ativo: true and empty detalhes.
 *
 * @param rotulos - Array of label strings (e.g. ["Person", "Inmate"])
 * @returns A Perfil[] array derived from the labels
 */
export function derivePerfilFromRotulos(rotulos: string[]): Perfil[] {
  if (!Array.isArray(rotulos) || rotulos.length === 0) {
    return [];
  }

  const rotuloToTipo: Record<string, TipoPerfil> = {
    Inmate: 'preso',
    Visitor: 'visitante',
    Lawyer: 'advogado',
  };

  const perfis: Perfil[] = [];

  for (const rotulo of rotulos) {
    const tipo = rotuloToTipo[rotulo];
    if (tipo) {
      perfis.push({
        tipo,
        ativo: true,
        dataInicio: '',
        detalhes: {},
      });
    }
    // "Person" and any other unknown labels are skipped
  }

  return perfis;
}
