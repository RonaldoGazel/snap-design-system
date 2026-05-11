// ─────────────────────────────────────────────────────────────────────────────
// Pessoa → PersonMatch / FullProfile Mapper
//
// Converts the platform's Pessoa model (from poi-service API responses)
// to the registration flow's PersonMatch and FullProfile interfaces.
//
// Confidence scoring and match type classification are computed client-side
// since the poi-service does not provide these fields.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pessoa } from '../../../models/pessoa.model';
import type { TipoPerfil } from '../../../models/perfil.model';
import type {
  DataSource,
  FullProfile,
  MatchType,
  NormalizedFormData,
  PersonMatch,
  SipenProfileType,
} from '../../../models/registration.model';
import { getConfidenceLabel } from '../../../models/registration.utils';

/** Default confidence thresholds (same as MOCK_CONFIG). */
const THRESHOLDS = { high: 0.9, medium: 0.7, low: 0 };

// ── TipoPerfil → SipenProfileType mapping ────────────────────────────────

const PERFIL_TO_SIPEN: Record<TipoPerfil, SipenProfileType | null> = {
  preso: 'PRESO',
  'ex-preso': 'EX_PRESO',
  visitante: 'VISITANTE',
  advogado: 'ADVOGADO',
  familiar: 'FAMILIAR',
  servidor: 'SERVIDOR',
  'pessoa-relacionada': 'PESSOA_RELACIONADA',
  alvo: null, // "alvo" is not a SIPEN profile type
};

function mapProfileType(pessoa: Pessoa): SipenProfileType | null {
  if (!pessoa.perfis || pessoa.perfis.length === 0) return null;
  const activePerfil = pessoa.perfis.find((p) => p.ativo) ?? pessoa.perfis[0];
  return PERFIL_TO_SIPEN[activePerfil.tipo] ?? null;
}

// ── Source detection ─────────────────────────────────────────────────────

function detectSource(pessoa: Pessoa): DataSource {
  if (!pessoa.fontes || pessoa.fontes.length === 0) return 'BASE_LOCAL';

  const tipos = pessoa.fontes.map((f) => f.tipo.toUpperCase());
  if (tipos.includes('SIPEN')) return 'SIPEN';
  if (tipos.includes('SNAP')) return 'SNAP';
  return 'BASE_LOCAL';
}

// ── Age calculation ─────────────────────────────────────────────────────

function calculateAge(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// ── Confidence scoring (client-side) ────────────────────────────────────

/**
 * Compute a confidence score (0–1) by comparing the search input against
 * the person record. This is a client-side heuristic since the poi-service
 * does not return confidence scores.
 */
function computeConfidence(pessoa: Pessoa, input: NormalizedFormData): number {
  let score = 0;
  let factors = 0;

  // CPF exact match — strongest signal
  if (input.cpfNormalized && pessoa.cpf) {
    factors++;
    const pessoaCpf = pessoa.cpf.replace(/\D/g, '');
    if (pessoaCpf === input.cpfNormalized) {
      score += 1.0;
    }
  }

  // Name similarity — normalized comparison
  if (input.nomeNormalized && pessoa.nome) {
    factors++;
    const pessoaNome = pessoa.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (pessoaNome === input.nomeNormalized) {
      score += 1.0;
    } else if (
      pessoaNome.includes(input.nomeNormalized) ||
      input.nomeNormalized.includes(pessoaNome)
    ) {
      score += 0.75;
    } else {
      // Check word overlap
      const inputWords = new Set(input.nomeNormalized.split(/\s+/));
      const pessoaWords = pessoaNome.split(/\s+/);
      const overlap = pessoaWords.filter((w) => inputWords.has(w)).length;
      if (overlap > 0) {
        score += (overlap / Math.max(inputWords.size, pessoaWords.length)) * 0.6;
      }
    }
  }

  // RG match
  if (input.rg && pessoa.rg) {
    factors++;
    const inputRg = input.rg.replace(/\D/g, '');
    const pessoaRg = pessoa.rg.replace(/\D/g, '');
    if (inputRg && pessoaRg && inputRg === pessoaRg) {
      score += 1.0;
    }
  }

  // Vulgo match
  if (input.vulgo && pessoa.vulgos && pessoa.vulgos.length > 0) {
    factors++;
    const inputVulgo = input.vulgo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const match = pessoa.vulgos.some((v) => {
      const normalized = v
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normalized === inputVulgo || normalized.includes(inputVulgo);
    });
    if (match) {
      score += 0.8;
    }
  }

  if (factors === 0) return 0.5; // no comparison possible, neutral score
  return Math.min(1, score / factors);
}

// ── Match type classification ───────────────────────────────────────────

function classifyMatchType(pessoa: Pessoa, input: NormalizedFormData): MatchType {
  // CPF exact match
  if (input.cpfNormalized && pessoa.cpf) {
    const pessoaCpf = pessoa.cpf.replace(/\D/g, '');
    if (pessoaCpf === input.cpfNormalized) return 'CPF_EXATO';
  }

  // RG match
  if (input.rg && pessoa.rg) {
    const inputRg = input.rg.replace(/\D/g, '');
    const pessoaRg = pessoa.rg.replace(/\D/g, '');
    if (inputRg && pessoaRg && inputRg === pessoaRg) return 'RG_CORRESPONDENTE';
  }

  // Name + UF
  if (input.nomeNormalized && input.uf && pessoa.nome) {
    const pessoaNome = pessoa.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    // Check if person's naturalidade or any source data contains the UF
    const pessoaUf = pessoa.naturalidade?.split('/')?.pop()?.trim() ?? '';

    if (pessoaNome === input.nomeNormalized && pessoaUf.toUpperCase() === input.uf) {
      return 'NOME_UF';
    }
    if (pessoaNome.includes(input.nomeNormalized) || input.nomeNormalized.includes(pessoaNome)) {
      return 'NOME_SEMELHANTE_UF';
    }
  }

  // Vulgo match
  if (input.vulgo && pessoa.vulgos && pessoa.vulgos.length > 0) {
    const inputVulgo = input.vulgo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const match = pessoa.vulgos.some((v) =>
      v
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(inputVulgo),
    );
    if (match) return 'VULGO_CORRESPONDENTE';
  }

  // Name similarity without UF
  if (input.nomeNormalized && pessoa.nome) {
    const pessoaNome = pessoa.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (pessoaNome.includes(input.nomeNormalized) || input.nomeNormalized.includes(pessoaNome)) {
      return 'NOME_SEMELHANTE';
    }
  }

  return 'DADOS_PARCIAIS';
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Map a Pessoa (from poi-service API) to a PersonMatch for the registration flow.
 *
 * Computes confidence score and match type client-side based on the
 * search input data.
 *
 * @param pessoa - Person record from the API
 * @param input - The normalized form data used for the search
 * @param sourceOverride - Force a specific DataSource (e.g. when filtering by source)
 */
export function mapPessoaToPersonMatch(
  pessoa: Pessoa,
  input: NormalizedFormData,
  sourceOverride?: DataSource,
): PersonMatch {
  const source = sourceOverride ?? detectSource(pessoa);
  const confidenceScore = computeConfidence(pessoa, input);
  const matchType = classifyMatchType(pessoa, input);
  const uf = pessoa.naturalidade?.split('/')?.pop()?.trim() ?? '';

  return {
    id: pessoa.id,
    source,
    profileType: mapProfileType(pessoa),
    fullName: pessoa.nome,
    normalizedName: pessoa.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
    uf,
    cpf: pessoa.cpf ?? '',
    cpfNormalized: pessoa.cpf?.replace(/\D/g, '') ?? '',
    rg: pessoa.rg ?? '',
    aliases: pessoa.vulgos ?? [],
    birthDate: pessoa.dataNascimento ?? '',
    age: calculateAge(pessoa.dataNascimento),
    motherName: pessoa.mae ?? '',
    fatherName: pessoa.pai ?? '',
    birthplace: pessoa.naturalidade ?? '',
    photoUrl: pessoa.fotoUrl ?? null,
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: pessoa.situacaoPrisionalAtual?.status ?? null,
    currentPrisonUnit: pessoa.situacaoPrisionalAtual?.unidade ?? null,
    matchType,
    confidenceScore,
    confidenceLabel: getConfidenceLabel(confidenceScore, THRESHOLDS),
    possibleLocalDuplicate: false,
    alreadyRegistered: source === 'BASE_LOCAL',
    localDuplicateId: null,
    profileUrl: source === 'BASE_LOCAL' ? `/intelligence/person/${pessoa.id}/profile` : null,
    lastUpdatedAt: pessoa.situacaoPrisionalAtual?.dataUltimaAtualizacao ?? new Date().toISOString(),
  };
}

/**
 * Map a Pessoa (from poi-service detail endpoint) to a FullProfile.
 *
 * Extends PersonMatch with prison data and related people when available.
 */
export function mapPessoaToFullProfile(
  pessoa: Pessoa,
  input: NormalizedFormData,
  sourceOverride?: DataSource,
): FullProfile {
  const base = mapPessoaToPersonMatch(pessoa, input, sourceOverride);

  const profile: FullProfile = {
    ...base,
    relatedPeople: [],
  };

  // Map prison data from situacaoPrisionalAtual if available
  if (pessoa.situacaoPrisionalAtual) {
    profile.prisonData = {
      status: pessoa.situacaoPrisionalAtual.status,
      currentUnit: pessoa.situacaoPrisionalAtual.unidade,
      wing: null,
      cell: null,
      admissionDate: '',
      lastMovementDate: pessoa.situacaoPrisionalAtual.dataUltimaAtualizacao,
      riskLevel: pessoa.indicadoresAnaliticos?.periculosidade ?? '',
      factionIndication: null,
      factionRole: null,
      custodyHistory: [],
    };
  }

  return profile;
}
