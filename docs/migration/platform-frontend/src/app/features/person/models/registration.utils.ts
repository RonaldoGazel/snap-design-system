import type {
  MatchType,
  MockConfig,
  NormalizedFormData,
  SipenProfileType,
} from './registration.model';

// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a Brazilian CPF string.
 *
 * Extracts digits, checks length (must be 11), rejects repeated-digit
 * sequences (e.g. 000.000.000-00), and validates both check digits using
 * the standard modular arithmetic algorithm.
 *
 * @param cpf - Raw CPF string (may contain mask characters like dots and dash)
 * @returns `true` if the CPF is valid, `false` otherwise
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) {
    return false;
  }

  // Reject sequences where all digits are the same (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) {
    return false;
  }

  return true;
}

/**
 * Apply progressive CPF mask to a digit string.
 *
 * Formats as `###.###.###-##`, applying the mask progressively as digits
 * are entered (e.g. "013" → "013", "013511" → "013.511", "01351197665" → "013.511.976-65").
 *
 * @param value - Raw input string (non-digit characters are stripped)
 * @returns Masked CPF string
 */
export function applyCPFMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Normalize form data for scenario matching and SNAP eligibility evaluation.
 *
 * - Name is lowercased and accent-stripped for matching
 * - CPF is reduced to digits only
 * - SNAP eligibility is evaluated based on available data
 *
 * @param form - Raw form values
 * @returns Normalized form data with derived flags
 */
export function normalizeFormData(form: {
  nome: string;
  uf: string;
  vulgo: string;
  rg: string;
  cpf: string;
}): NormalizedFormData {
  const cpfNormalized = form.cpf.replace(/\D/g, '');
  const nomeNormalized = form.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const hasValidCPF = cpfNormalized.length === 11;
  const hasValidNome = form.nome.trim().length >= 3;
  const hasValidVulgo = form.vulgo.trim().length >= 2;
  const hasValidRG = form.rg.trim().length > 0;

  const data: NormalizedFormData = {
    nome: form.nome,
    nomeNormalized,
    uf: form.uf,
    vulgo: form.vulgo,
    rg: form.rg,
    cpf: form.cpf,
    cpfNormalized,
    hasValidCPF,
    hasValidNome,
    hasValidVulgo,
    hasValidRG,
    isSnapEligible: false,
  };

  data.isSnapEligible = evaluateSnapEligibility(data);

  return data;
}

/**
 * Evaluate whether the form data meets SNAP query eligibility criteria.
 *
 * SNAP is eligible when the user has provided a valid CPF **or** a valid
 * name combined with a UF selection.
 *
 * @param data - Normalized form data
 * @returns `true` if SNAP query should be executed
 */
export function evaluateSnapEligibility(data: NormalizedFormData): boolean {
  return data.hasValidCPF || (data.hasValidNome && data.uf !== '');
}

/**
 * Format a confidence score (0–1) as a percentage string.
 *
 * @param score - Confidence score between 0 and 1
 * @returns Formatted percentage (e.g. "95%")
 */
export function formatConfidenceScore(score: number): string {
  return Math.round(score * 100) + '%';
}

/**
 * Get a human-readable confidence label based on score thresholds.
 *
 * @param score - Confidence score between 0 and 1
 * @param thresholds - Threshold configuration from MockConfig
 * @returns 'Alta', 'Média', or 'Baixa'
 */
export function getConfidenceLabel(
  score: number,
  thresholds: MockConfig['confidenceThresholds'],
): string {
  if (score >= thresholds.high) return 'Alta';
  if (score >= thresholds.medium) return 'Média';
  return 'Baixa';
}

/**
 * Format a match type enum value to a human-readable Portuguese label.
 *
 * @param mt - Match type
 * @returns Portuguese label
 */
export function formatMatchType(mt: MatchType): string {
  const labels: Record<MatchType, string> = {
    CPF_EXATO: 'CPF Exato',
    RG_CORRESPONDENTE: 'RG Correspondente',
    NOME_UF: 'Nome + UF',
    NOME_SEMELHANTE_UF: 'Nome Semelhante + UF',
    VULGO_CORRESPONDENTE: 'Vulgo Correspondente',
    NOME_SEMELHANTE: 'Nome Semelhante',
    DADOS_PARCIAIS: 'Dados Parciais',
  };
  return labels[mt];
}

/**
 * Format a SIPEN profile type enum value to a human-readable Portuguese label.
 *
 * @param pt - SIPEN profile type
 * @returns Portuguese label
 */
export function formatProfileType(pt: SipenProfileType): string {
  const labels: Record<SipenProfileType, string> = {
    PRESO: 'Preso',
    EX_PRESO: 'Ex-preso',
    VISITANTE: 'Visitante',
    ADVOGADO: 'Advogado',
    FAMILIAR: 'Familiar',
    SERVIDOR: 'Servidor',
    PESSOA_RELACIONADA: 'Pessoa Relacionada',
  };
  return labels[pt];
}

/**
 * Extract initials from a person's name.
 *
 * Returns the first letter of the first word and the first letter of the
 * last word, both uppercase. For single-word names, returns the first two
 * characters uppercase.
 *
 * @param name - Full person name
 * @returns Uppercase initials (e.g. "JS" for "João Silva")
 */
export function getPersonInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
