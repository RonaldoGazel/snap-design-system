import { describe, it, expect } from 'vitest';

import {
  mapApiPersonToPessoa,
  mapApiPersonListToPessoas,
  derivePerfilFromRotulos,
  parseJsonField,
} from './api-person-mapper';
import type { Pessoa } from '../models/pessoa.model';

// ---------------------------------------------------------------------------
// Fixtures — real API responses from the spec
// ---------------------------------------------------------------------------

/** Full SIPEN detail response (detail_sipen.json) */
const SIPEN_DETAIL: Record<string, unknown> = {
  uuid: 'p1',
  nome: 'CARLA EDUARDA MENTES',
  cpf: '12345678900',
  rg: '12345678-9',
  data_nascimento: '1985-03-12',
  sexo: 'MASCULINO',
  mae: 'SÔNIA MARIA MENDES',
  pai: 'JOSÉ EDUARDO MENDES',
  nacionalidade: 'BRASIL',
  naturalidade: 'RIO DE JANEIRO-RJ',
  cor_pele: 'NEGRO',
  estado_civil: 'SOLTEIRO',
  grau_instrucao: 'SUPERIOR INCOMPLETO',
  profissao: 'MÚSICO',
  vulgos: ['CARLOTA', 'CARLA MENDES'],
  sinais_caracteristicos:
    '[{"mark_type": "TATUAGEM", "description": "Dragão tribal", "location": "BRACO_DIREITO"}, {"mark_type": "CICATRIZ", "description": "Cicatriz de corte 8cm", "location": "ABDOMEN_ESQUERDO"}]',
  rotulos: '["Person", "Inmate"]',
  fonte: 'SIPEN',
  condenacoes: [
    {
      uuid: 'conviction-p1',
      data_sentenca: '2019-11-20',
      crime: 'TRÁFICO DE DROGAS',
      status: 'ACTIVE',
      fonte: 'SIPEN',
    },
  ],
  visitantes: [
    { uuid: 'person-v-p1-001', fonte: 'SIPEN' },
    { uuid: 'person-v-p1-002', fonte: 'SIPEN' },
  ],
  fotos: [],
  eventos: [
    { uuid: 'event-p1-001', data: '2019-08-15T10:00:00', fonte: 'SIPEN' },
    { uuid: 'event-p1-002', data: '2021-03-10T14:30:00', fonte: 'SIPEN' },
  ],
  id: 'p1',
  perfis: [],
  fontes: [{ tipo: 'SIPEN', status: 'ativo' }],
  resumoAnalitico: '',
  statusReconciliacao: 'sem_divergencia',
  tagsRelevantes: [],
  _sources: [{ graph_id: '6b10e263-f1d0-439c-85b2-63a27b334bef', display_name: 'Grafo Publico' }],
  _merged_from: 1,
};

/** Minimal SNAP detail response (detail_snap.json) */
const SNAP_DETAIL: Record<string, unknown> = {
  uuid: '75c43b03-36f8-4144-8f4f-f7c931e44469',
  nome: 'ERIC FERREIRA PEREIRA',
  cpf: '09321218610',
  rg: '2104191294',
  data_nascimento: '15/03/1990',
  sexo: 'MASCULINO',
  mae: 'MARIA DA CONCEICAO FERREIRA',
  nacionalidade: 'BRASILEIRO',
  fonte: 'SNAP',
  condenacoes: [],
  visitantes: [],
  fotos: [],
  eventos: [],
  id: '75c43b03-36f8-4144-8f4f-f7c931e44469',
  vulgos: [],
  perfis: [],
  fontes: [{ tipo: 'SNAP', status: 'ativo' }],
  resumoAnalitico: '',
  statusReconciliacao: 'sem_divergencia',
  tagsRelevantes: [],
  _sources: [{ graph_id: '6b10e263-f1d0-439c-85b2-63a27b334bef', display_name: 'Grafo Publico' }],
  _merged_from: 1,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiPersonMapper', () => {
  // -----------------------------------------------------------------------
  // mapApiPersonToPessoa — full SIPEN response
  // Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6
  // -----------------------------------------------------------------------
  describe('mapApiPersonToPessoa with full SIPEN response', () => {
    let pessoa: Pessoa;

    beforeEach(() => {
      pessoa = mapApiPersonToPessoa(SIPEN_DETAIL);
    });

    it('should map id from the raw id field', () => {
      expect(pessoa.id).toBe('p1');
    });

    it('should map nome', () => {
      expect(pessoa.nome).toBe('CARLA EDUARDA MENTES');
    });

    it('should map snake_case fields to camelCase', () => {
      expect(pessoa.dataNascimento).toBe('1985-03-12');
      expect(pessoa.pai).toBe('JOSÉ EDUARDO MENDES');
      expect(pessoa.mae).toBe('SÔNIA MARIA MENDES');
      expect(pessoa.naturalidade).toBe('RIO DE JANEIRO-RJ');
      expect(pessoa.nacionalidade).toBe('BRASIL');
    });

    it('should map cpf and rg', () => {
      expect(pessoa.cpf).toBe('12345678900');
      expect(pessoa.rg).toBe('12345678-9');
    });

    it('should map sexo', () => {
      expect(pessoa.sexo).toBe('MASCULINO');
    });

    it('should map vulgos array', () => {
      expect(pessoa.vulgos).toEqual(['CARLOTA', 'CARLA MENDES']);
    });

    it('should map fontes from the API fontes array with normalised tipo', () => {
      expect(pessoa.fontes).toHaveLength(1);
      expect(pessoa.fontes[0].tipo).toBe('sipen');
      expect(pessoa.fontes[0].status).toBe('ativa');
    });

    it('should normalise statusReconciliacao from underscores to hyphens', () => {
      expect(pessoa.statusReconciliacao).toBe('sem-divergencia');
    });
  });

  // -----------------------------------------------------------------------
  // mapApiPersonToPessoa — minimal SNAP response
  // Validates: Requirements 1.1, 1.5
  // -----------------------------------------------------------------------
  describe('mapApiPersonToPessoa with minimal SNAP response', () => {
    let pessoa: Pessoa;

    beforeEach(() => {
      pessoa = mapApiPersonToPessoa(SNAP_DETAIL);
    });

    it('should map id from the raw id field', () => {
      expect(pessoa.id).toBe('75c43b03-36f8-4144-8f4f-f7c931e44469');
    });

    it('should map nome', () => {
      expect(pessoa.nome).toBe('ERIC FERREIRA PEREIRA');
    });

    it('should map data_nascimento to dataNascimento', () => {
      expect(pessoa.dataNascimento).toBe('15/03/1990');
    });

    it('should map fontes with SNAP tipo', () => {
      expect(pessoa.fontes).toHaveLength(1);
      expect(pessoa.fontes[0].tipo).toBe('snap');
    });

    it('should default missing optional fields gracefully', () => {
      expect(pessoa.pai).toBeUndefined();
      expect(pessoa.naturalidade).toBeUndefined();
      expect(pessoa.fotoUrl).toBeUndefined();
      expect(pessoa.matricula).toBeUndefined();
    });

    it('should default vulgos to empty array', () => {
      expect(pessoa.vulgos).toEqual([]);
    });

    it('should default rotulos to undefined when not present', () => {
      // SNAP_DETAIL has no rotulos field
      expect(pessoa.rotulos).toBeUndefined();
    });

    it('should default perfis to empty array when no rotulos to derive from', () => {
      expect(pessoa.perfis).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // mapApiPersonToPessoa — sparse person (only uuid, nome, fonte)
  // Validates: Requirements 1.5, 6.1, 6.3
  // -----------------------------------------------------------------------
  describe('mapApiPersonToPessoa with sparse person', () => {
    const SPARSE: Record<string, unknown> = {
      uuid: 'sparse-001',
      nome: 'SPARSE PERSON',
      fonte: 'SIPEN',
    };

    let pessoa: Pessoa;

    beforeEach(() => {
      pessoa = mapApiPersonToPessoa(SPARSE);
    });

    it('should map id from uuid when id field is absent', () => {
      expect(pessoa.id).toBe('sparse-001');
    });

    it('should map nome', () => {
      expect(pessoa.nome).toBe('SPARSE PERSON');
    });

    it('should construct fontes from single fonte string', () => {
      expect(pessoa.fontes).toHaveLength(1);
      expect(pessoa.fontes[0].tipo).toBe('sipen');
      expect(pessoa.fontes[0].status).toBe('ativa');
    });

    it('should default all optional string fields to undefined', () => {
      expect(pessoa.cpf).toBeUndefined();
      expect(pessoa.rg).toBeUndefined();
      expect(pessoa.dataNascimento).toBeUndefined();
      expect(pessoa.sexo).toBeUndefined();
      expect(pessoa.fotoUrl).toBeUndefined();
      expect(pessoa.pai).toBeUndefined();
      expect(pessoa.mae).toBeUndefined();
      expect(pessoa.naturalidade).toBeUndefined();
      expect(pessoa.nacionalidade).toBeUndefined();
    });

    it('should default vulgos to empty array', () => {
      expect(pessoa.vulgos).toEqual([]);
    });

    it('should default perfis to empty array', () => {
      expect(pessoa.perfis).toEqual([]);
    });

    it('should default tagsRelevantes to empty array', () => {
      expect(pessoa.tagsRelevantes).toEqual([]);
    });

    it('should default resumoAnalitico to empty string', () => {
      expect(pessoa.resumoAnalitico).toBe('');
    });

    it('should default statusReconciliacao to sem-divergencia', () => {
      expect(pessoa.statusReconciliacao).toBe('sem-divergencia');
    });

    it('should default _sources and _merged_from to undefined', () => {
      expect(pessoa._sources).toBeUndefined();
      expect(pessoa._merged_from).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // sinais_caracteristicos JSON string parsing
  // Validates: Requirement 1.2
  // -----------------------------------------------------------------------
  describe('sinais_caracteristicos JSON string parsing', () => {
    it('should parse a valid JSON string into a structured array', () => {
      const parsed = parseJsonField<Array<Record<string, string>>>(
        SIPEN_DETAIL['sinais_caracteristicos'],
        [],
      );
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        mark_type: 'TATUAGEM',
        description: 'Dragão tribal',
        location: 'BRACO_DIREITO',
      });
      expect(parsed[1]).toEqual({
        mark_type: 'CICATRIZ',
        description: 'Cicatriz de corte 8cm',
        location: 'ABDOMEN_ESQUERDO',
      });
    });

    it('should return fallback for invalid JSON string', () => {
      const parsed = parseJsonField<Array<Record<string, string>>>('not-json', []);
      expect(parsed).toEqual([]);
    });

    it('should return fallback for undefined input', () => {
      const parsed = parseJsonField<Array<Record<string, string>>>(undefined, []);
      expect(parsed).toEqual([]);
    });

    it('should return the value as-is when it is already an array', () => {
      const existing = [{ mark_type: 'TATUAGEM', description: 'test', location: 'ARM' }];
      const parsed = parseJsonField<Array<Record<string, string>>>(existing, []);
      expect(parsed).toEqual(existing);
    });
  });

  // -----------------------------------------------------------------------
  // rotulos JSON string parsing and profile derivation
  // Validates: Requirements 1.3, 6.4
  // -----------------------------------------------------------------------
  describe('rotulos JSON string parsing and profile derivation', () => {
    it('should parse rotulos JSON string into string array on the Pessoa', () => {
      const pessoa = mapApiPersonToPessoa(SIPEN_DETAIL);
      expect(pessoa.rotulos).toEqual(['Person', 'Inmate']);
    });

    it('should derive perfis from rotulos when perfis array is empty', () => {
      const pessoa = mapApiPersonToPessoa(SIPEN_DETAIL);
      // SIPEN_DETAIL has empty perfis, rotulos = ["Person", "Inmate"]
      // "Person" is skipped, "Inmate" → preso
      expect(pessoa.perfis).toHaveLength(1);
      expect(pessoa.perfis[0].tipo).toBe('preso');
      expect(pessoa.perfis[0].ativo).toBe(true);
      expect(pessoa.perfis[0].detalhes).toEqual({});
    });

    it('should derive visitante from Visitor rotulo', () => {
      const raw: Record<string, unknown> = {
        uuid: 'v1',
        nome: 'VISITOR PERSON',
        fonte: 'SIPEN',
        rotulos: '["Person", "Visitor"]',
        perfis: [],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.perfis).toHaveLength(1);
      expect(pessoa.perfis[0].tipo).toBe('visitante');
    });

    it('should derive advogado from Lawyer rotulo', () => {
      const raw: Record<string, unknown> = {
        uuid: 'l1',
        nome: 'LAWYER PERSON',
        fonte: 'SIPEN',
        rotulos: '["Person", "Lawyer"]',
        perfis: [],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.perfis).toHaveLength(1);
      expect(pessoa.perfis[0].tipo).toBe('advogado');
    });

    it('should skip "Person" label (too generic)', () => {
      const raw: Record<string, unknown> = {
        uuid: 'g1',
        nome: 'GENERIC PERSON',
        fonte: 'SNAP',
        rotulos: '["Person"]',
        perfis: [],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.perfis).toEqual([]);
    });

    it('should not derive perfis when perfis array is already populated', () => {
      const raw: Record<string, unknown> = {
        uuid: 'x1',
        nome: 'EXISTING PERFIS',
        fonte: 'SIPEN',
        rotulos: '["Person", "Inmate"]',
        perfis: [{ tipo: 'ex-preso', ativo: false, dataInicio: '2020-01-01', detalhes: {} }],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.perfis).toHaveLength(1);
      expect(pessoa.perfis[0].tipo).toBe('ex-preso');
    });
  });

  // -----------------------------------------------------------------------
  // _sources and _merged_from preservation
  // Validates: Requirement 1.4
  // -----------------------------------------------------------------------
  describe('_sources and _merged_from preservation', () => {
    it('should preserve _sources from SIPEN response', () => {
      const pessoa = mapApiPersonToPessoa(SIPEN_DETAIL);
      expect(pessoa._sources).toEqual([
        { graph_id: '6b10e263-f1d0-439c-85b2-63a27b334bef', display_name: 'Grafo Publico' },
      ]);
    });

    it('should preserve _merged_from from SIPEN response', () => {
      const pessoa = mapApiPersonToPessoa(SIPEN_DETAIL);
      expect(pessoa._merged_from).toBe(1);
    });

    it('should preserve _sources from SNAP response', () => {
      const pessoa = mapApiPersonToPessoa(SNAP_DETAIL);
      expect(pessoa._sources).toEqual([
        { graph_id: '6b10e263-f1d0-439c-85b2-63a27b334bef', display_name: 'Grafo Publico' },
      ]);
    });

    it('should preserve _merged_from from SNAP response', () => {
      const pessoa = mapApiPersonToPessoa(SNAP_DETAIL);
      expect(pessoa._merged_from).toBe(1);
    });

    it('should handle multiple _sources entries', () => {
      const raw: Record<string, unknown> = {
        uuid: 'multi-src',
        nome: 'MULTI SOURCE',
        fonte: 'SIPEN',
        _sources: [
          { graph_id: 'graph-1', display_name: 'Grafo A' },
          { graph_id: 'graph-2', display_name: 'Grafo B' },
        ],
        _merged_from: 3,
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa._sources).toHaveLength(2);
      expect(pessoa._merged_from).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // Missing optional fields default gracefully
  // Validates: Requirements 1.5, 6.1, 6.2, 6.3
  // -----------------------------------------------------------------------
  describe('missing optional fields default gracefully', () => {
    it('should not throw when all optional fields are missing', () => {
      const minimal: Record<string, unknown> = {
        uuid: 'min-1',
        nome: 'MINIMAL',
        fonte: 'SNAP',
      };
      expect(() => mapApiPersonToPessoa(minimal)).not.toThrow();
    });

    it('should handle empty fontes array by falling back to fonte string', () => {
      const raw: Record<string, unknown> = {
        uuid: 'fb-1',
        nome: 'FALLBACK FONTES',
        fonte: 'SNAP',
        fontes: [],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.fontes).toHaveLength(1);
      expect(pessoa.fontes[0].tipo).toBe('snap');
    });

    it('should handle missing both fontes and fonte', () => {
      const raw: Record<string, unknown> = {
        uuid: 'no-fonte',
        nome: 'NO FONTE',
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.fontes).toEqual([]);
    });

    it('should handle invalid rotulos JSON gracefully', () => {
      const raw: Record<string, unknown> = {
        uuid: 'bad-rotulos',
        nome: 'BAD ROTULOS',
        fonte: 'SIPEN',
        rotulos: '{invalid json',
        perfis: [],
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.rotulos).toBeUndefined();
      expect(pessoa.perfis).toEqual([]);
    });

    it('should handle invalid statusReconciliacao value', () => {
      const raw: Record<string, unknown> = {
        uuid: 'bad-status',
        nome: 'BAD STATUS',
        fonte: 'SNAP',
        statusReconciliacao: 'unknown_status',
      };
      const pessoa = mapApiPersonToPessoa(raw);
      expect(pessoa.statusReconciliacao).toBe('sem-divergencia');
    });
  });

  // -----------------------------------------------------------------------
  // mapApiPersonListToPessoas
  // Validates: Requirements 1.1, 1.5
  // -----------------------------------------------------------------------
  describe('mapApiPersonListToPessoas', () => {
    it('should map all items from a list response', () => {
      const listResponse: Record<string, unknown> = {
        items: [SIPEN_DETAIL, SNAP_DETAIL],
        total: 2,
        limit: 200,
        offset: 0,
      };
      const result = mapApiPersonListToPessoas(listResponse);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('75c43b03-36f8-4144-8f4f-f7c931e44469');
    });

    it('should return empty array when items is missing', () => {
      const result = mapApiPersonListToPessoas({ total: 0 });
      expect(result).toEqual([]);
    });

    it('should return empty array when items is not an array', () => {
      const result = mapApiPersonListToPessoas({ items: 'not-an-array' });
      expect(result).toEqual([]);
    });

    it('should return empty array for empty items', () => {
      const result = mapApiPersonListToPessoas({ items: [], total: 0, limit: 200, offset: 0 });
      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // derivePerfilFromRotulos
  // Validates: Requirement 6.4
  // -----------------------------------------------------------------------
  describe('derivePerfilFromRotulos', () => {
    it('should derive preso from Inmate', () => {
      const perfis = derivePerfilFromRotulos(['Inmate']);
      expect(perfis).toHaveLength(1);
      expect(perfis[0].tipo).toBe('preso');
      expect(perfis[0].ativo).toBe(true);
      expect(perfis[0].dataInicio).toBe('');
      expect(perfis[0].detalhes).toEqual({});
    });

    it('should derive visitante from Visitor', () => {
      const perfis = derivePerfilFromRotulos(['Visitor']);
      expect(perfis).toHaveLength(1);
      expect(perfis[0].tipo).toBe('visitante');
    });

    it('should derive advogado from Lawyer', () => {
      const perfis = derivePerfilFromRotulos(['Lawyer']);
      expect(perfis).toHaveLength(1);
      expect(perfis[0].tipo).toBe('advogado');
    });

    it('should skip Person label', () => {
      const perfis = derivePerfilFromRotulos(['Person']);
      expect(perfis).toEqual([]);
    });

    it('should handle multiple rotulos and skip unknown ones', () => {
      const perfis = derivePerfilFromRotulos(['Person', 'Inmate', 'Visitor', 'Unknown']);
      expect(perfis).toHaveLength(2);
      expect(perfis[0].tipo).toBe('preso');
      expect(perfis[1].tipo).toBe('visitante');
    });

    it('should return empty array for empty input', () => {
      expect(derivePerfilFromRotulos([])).toEqual([]);
    });

    it('should return empty array for null-ish input', () => {
      expect(derivePerfilFromRotulos(null as unknown as string[])).toEqual([]);
      expect(derivePerfilFromRotulos(undefined as unknown as string[])).toEqual([]);
    });
  });
});
