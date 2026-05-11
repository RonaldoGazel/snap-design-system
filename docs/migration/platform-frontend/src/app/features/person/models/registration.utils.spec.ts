import {
  validateCPF,
  applyCPFMask,
  normalizeFormData,
  evaluateSnapEligibility,
  getConfidenceLabel,
  formatMatchType,
  getPersonInitials,
} from './registration.utils';
import type { MatchType, MockConfig, NormalizedFormData } from './registration.model';

// ─────────────────────────────────────────────────────────────────────────────
// 15.1 — validateCPF()
// ─────────────────────────────────────────────────────────────────────────────

describe('validateCPF', () => {
  it('should return true for a valid CPF (01351197665)', () => {
    expect(validateCPF('01351197665')).toBe(true);
  });

  it('should return true for a valid CPF (22233344405)', () => {
    expect(validateCPF('22233344405')).toBe(true);
  });

  it('should return false for invalid check digits', () => {
    // Change last digit of a valid CPF to make it invalid
    expect(validateCPF('01351197660')).toBe(false);
  });

  it('should return false for repeated digits (00000000000)', () => {
    expect(validateCPF('00000000000')).toBe(false);
  });

  it('should return false for repeated digits (11111111111)', () => {
    expect(validateCPF('11111111111')).toBe(false);
  });

  it('should return false for repeated digits (99999999999)', () => {
    expect(validateCPF('99999999999')).toBe(false);
  });

  it('should return false for too short input', () => {
    expect(validateCPF('0135119766')).toBe(false);
  });

  it('should return false for too long input', () => {
    expect(validateCPF('013511976650')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validateCPF('')).toBe(false);
  });

  it('should accept masked CPF (013.511.976-65)', () => {
    expect(validateCPF('013.511.976-65')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.2 — applyCPFMask()
// ─────────────────────────────────────────────────────────────────────────────

describe('applyCPFMask', () => {
  it('should return 3 digits as-is', () => {
    expect(applyCPFMask('013')).toBe('013');
  });

  it('should apply first dot after 3 digits (6 digits)', () => {
    expect(applyCPFMask('013511')).toBe('013.511');
  });

  it('should apply two dots after 6 digits (9 digits)', () => {
    expect(applyCPFMask('013511976')).toBe('013.511.976');
  });

  it('should apply full mask for 11 digits', () => {
    expect(applyCPFMask('01351197665')).toBe('013.511.976-65');
  });

  it('should strip non-digit characters before masking', () => {
    expect(applyCPFMask('013.511.976-65')).toBe('013.511.976-65');
  });

  it('should truncate at 11 digits', () => {
    expect(applyCPFMask('013511976651234')).toBe('013.511.976-65');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.3 — normalizeFormData()
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeFormData', () => {
  it('should strip accents from name (João → joao)', () => {
    const result = normalizeFormData({
      nome: 'João',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '',
    });
    expect(result.nomeNormalized).toBe('joao');
  });

  it('should lowercase name (MARIA → maria)', () => {
    const result = normalizeFormData({
      nome: 'MARIA',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '',
    });
    expect(result.nomeNormalized).toBe('maria');
  });

  it('should extract digits from masked CPF', () => {
    const result = normalizeFormData({
      nome: '',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '013.511.976-65',
    });
    expect(result.cpfNormalized).toBe('01351197665');
  });

  it('should evaluate SNAP eligibility as true for valid CPF', () => {
    const result = normalizeFormData({
      nome: '',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '013.511.976-65',
    });
    expect(result.isSnapEligible).toBe(true);
  });

  it('should evaluate SNAP eligibility as true for nome + UF', () => {
    const result = normalizeFormData({
      nome: 'João Carlos',
      uf: 'RJ',
      vulgo: '',
      rg: '',
      cpf: '',
    });
    expect(result.isSnapEligible).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.4 — evaluateSnapEligibility()
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateSnapEligibility', () => {
  it('should return true for valid CPF', () => {
    const data: NormalizedFormData = {
      nome: '',
      nomeNormalized: '',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '013.511.976-65',
      cpfNormalized: '01351197665',
      hasValidCPF: true,
      hasValidNome: false,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: false,
    };
    expect(evaluateSnapEligibility(data)).toBe(true);
  });

  it('should return true for nome + UF', () => {
    const data: NormalizedFormData = {
      nome: 'João Carlos',
      nomeNormalized: 'joao carlos',
      uf: 'RJ',
      vulgo: '',
      rg: '',
      cpf: '',
      cpfNormalized: '',
      hasValidCPF: false,
      hasValidNome: true,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: false,
    };
    expect(evaluateSnapEligibility(data)).toBe(true);
  });

  it('should return false for RG-only', () => {
    const data: NormalizedFormData = {
      nome: '',
      nomeNormalized: '',
      uf: '',
      vulgo: '',
      rg: '99999999',
      cpf: '',
      cpfNormalized: '',
      hasValidCPF: false,
      hasValidNome: false,
      hasValidVulgo: false,
      hasValidRG: true,
      isSnapEligible: false,
    };
    expect(evaluateSnapEligibility(data)).toBe(false);
  });

  it('should return false for vulgo-only', () => {
    const data: NormalizedFormData = {
      nome: '',
      nomeNormalized: '',
      uf: '',
      vulgo: 'baixinho',
      rg: '',
      cpf: '',
      cpfNormalized: '',
      hasValidCPF: false,
      hasValidNome: false,
      hasValidVulgo: true,
      hasValidRG: false,
      isSnapEligible: false,
    };
    expect(evaluateSnapEligibility(data)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.5 — resolveScenario()
// ─────────────────────────────────────────────────────────────────────────────

import { resolveScenario } from '../data/registration-mock.data';

describe('resolveScenario', () => {
  it('should return CEN-001 for CPF 01351197665', () => {
    const data: NormalizedFormData = {
      nome: '',
      nomeNormalized: '',
      uf: '',
      vulgo: '',
      rg: '',
      cpf: '013.511.976-65',
      cpfNormalized: '01351197665',
      hasValidCPF: true,
      hasValidNome: false,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: true,
    };
    const scenario = resolveScenario(data);
    expect(scenario).not.toBeNull();
    expect(scenario!.id).toBe('CEN-001');
  });

  it('should return CEN-002 for nome "joao carlos" + UF "MG"', () => {
    const data: NormalizedFormData = {
      nome: 'João Carlos',
      nomeNormalized: 'joao carlos',
      uf: 'MG',
      vulgo: '',
      rg: '',
      cpf: '',
      cpfNormalized: '',
      hasValidCPF: false,
      hasValidNome: true,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: true,
    };
    const scenario = resolveScenario(data);
    expect(scenario).not.toBeNull();
    expect(scenario!.id).toBe('CEN-002');
  });

  it('should return null when no scenario matches', () => {
    const data: NormalizedFormData = {
      nome: 'Unknown Person',
      nomeNormalized: 'unknown person',
      uf: 'AC',
      vulgo: '',
      rg: '',
      cpf: '',
      cpfNormalized: '',
      hasValidCPF: false,
      hasValidNome: true,
      hasValidVulgo: false,
      hasValidRG: false,
      isSnapEligible: true,
    };
    const scenario = resolveScenario(data);
    expect(scenario).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.6 — getConfidenceLabel()
// ─────────────────────────────────────────────────────────────────────────────

describe('getConfidenceLabel', () => {
  const thresholds: MockConfig['confidenceThresholds'] = {
    high: 0.9,
    medium: 0.7,
    low: 0,
  };

  it('should return "Alta" for score >= 0.90', () => {
    expect(getConfidenceLabel(0.95, thresholds)).toBe('Alta');
    expect(getConfidenceLabel(0.9, thresholds)).toBe('Alta');
  });

  it('should return "Média" for score >= 0.70 and < 0.90', () => {
    expect(getConfidenceLabel(0.85, thresholds)).toBe('Média');
    expect(getConfidenceLabel(0.7, thresholds)).toBe('Média');
  });

  it('should return "Baixa" for score < 0.70', () => {
    expect(getConfidenceLabel(0.5, thresholds)).toBe('Baixa');
    expect(getConfidenceLabel(0.0, thresholds)).toBe('Baixa');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.7 — formatMatchType()
// ─────────────────────────────────────────────────────────────────────────────

describe('formatMatchType', () => {
  const expected: Record<MatchType, string> = {
    CPF_EXATO: 'CPF Exato',
    RG_CORRESPONDENTE: 'RG Correspondente',
    NOME_UF: 'Nome + UF',
    NOME_SEMELHANTE_UF: 'Nome Semelhante + UF',
    VULGO_CORRESPONDENTE: 'Vulgo Correspondente',
    NOME_SEMELHANTE: 'Nome Semelhante',
    DADOS_PARCIAIS: 'Dados Parciais',
  };

  for (const [key, label] of Object.entries(expected)) {
    it(`should return "${label}" for ${key}`, () => {
      expect(formatMatchType(key as MatchType)).toBe(label);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 15.8 — getPersonInitials()
// ─────────────────────────────────────────────────────────────────────────────

describe('getPersonInitials', () => {
  it('should return first + last initial for two-word name', () => {
    expect(getPersonInitials('João Silva')).toBe('JS');
  });

  it('should return first two chars for single-word name', () => {
    expect(getPersonInitials('João')).toBe('JO');
  });

  it('should return first + last initial for multi-word name', () => {
    expect(getPersonInitials('João Carlos de Souza')).toBe('JS');
  });

  it('should return empty string for empty input', () => {
    expect(getPersonInitials('')).toBe('');
  });
});
