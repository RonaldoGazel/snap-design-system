import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PersonDataService } from './person-data.service';
import { MOCK_ALERTAS } from '../data/alertas.data';
import { MOCK_VINCULOS } from '../data/vinculos.data';
import { Pessoa } from '../models';

const FAKE_PESSOAS: Pessoa[] = [
  {
    id: 'p1',
    nome: 'Test Person',
    vulgos: [],
    perfis: [{ tipo: 'preso', ativo: true, dataInicio: '', detalhes: {} }],
    fontes: [{ tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-01', status: 'ativa' }],
    resumoAnalitico: '',
    statusReconciliacao: 'sem-divergencia',
    tagsRelevantes: [],
  },
];

describe('PersonDataService', () => {
  let service: PersonDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PersonDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    // Flush the automatic list request
    httpTesting
      .expectOne((req) => req.url.includes('/person/list'))
      .flush({ items: [], total: 0, limit: 200, offset: 0 });
    expect(service).toBeTruthy();
  });

  describe('pessoas from API', () => {
    it('should expose pessoas fetched from the API', () => {
      // Initially empty (before HTTP resolves)
      expect(service.pessoas()).toEqual([]);

      // Flush the HTTP request
      const req = httpTesting.expectOne((r) => r.url.includes('/person/list'));
      expect(req.request.method).toBe('GET');
      req.flush({ items: FAKE_PESSOAS, total: 1, limit: 200, offset: 0 });

      expect(service.pessoas()).toEqual(FAKE_PESSOAS);
    });

    it('should return empty array on API error', () => {
      const req = httpTesting.expectOne((r) => r.url.includes('/person/list'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(service.pessoas()).toEqual([]);
    });
  });

  describe('static signals', () => {
    beforeEach(() => {
      // Flush the automatic list request for all static tests
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: [], total: 0, limit: 200, offset: 0 });
    });

    it('should expose alertas as a signal with all mock data', () => {
      expect(service.alertas()).toEqual(MOCK_ALERTAS);
    });

    it('should expose vinculos as a signal with all mock data', () => {
      expect(service.vinculos()).toEqual(MOCK_VINCULOS);
    });
  });

  describe('getPessoaById', () => {
    it('should return matching Pessoa for a valid ID', () => {
      const req = httpTesting.expectOne((r) => r.url.includes('/person/list'));
      req.flush({ items: FAKE_PESSOAS, total: 1, limit: 200, offset: 0 });

      const result = service.getPessoaById('p1');
      expect(result()).toBeDefined();
      expect(result()!.id).toBe('p1');
      expect(result()!.nome).toBe('Test Person');
    });

    it('should return undefined for a non-existent ID', () => {
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: FAKE_PESSOAS, total: 1, limit: 200, offset: 0 });

      const result = service.getPessoaById('non-existent-id');
      expect(result()).toBeUndefined();
    });
  });

  describe('getAlertasByPessoaId', () => {
    beforeEach(() => {
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: [], total: 0, limit: 200, offset: 0 });
    });

    it('should return only alertas matching the pessoaId', () => {
      const result = service.getAlertasByPessoaId('p1');
      const alertas = result();
      expect(alertas.length).toBeGreaterThan(0);
      expect(alertas.every((a) => a.pessoaId === 'p1')).toBe(true);
    });

    it('should return an empty array for a pessoaId with no alertas', () => {
      const result = service.getAlertasByPessoaId('non-existent-id');
      expect(result()).toEqual([]);
    });
  });

  describe('getVinculosByPessoaId', () => {
    beforeEach(() => {
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: [], total: 0, limit: 200, offset: 0 });
    });

    it('should return vinculos where pessoaOrigemId matches', () => {
      const result = service.getVinculosByPessoaId('p3');
      const vinculos = result();
      expect(vinculos.some((v) => v.pessoaOrigemId === 'p3')).toBe(true);
    });

    it('should return an empty array for a pessoaId with no vinculos', () => {
      const result = service.getVinculosByPessoaId('non-existent-id');
      expect(result()).toEqual([]);
    });
  });

  describe('getTagsByPessoaId', () => {
    it('should return tagsRelevantes from the matching Pessoa', () => {
      const personWithTags: Pessoa[] = [
        {
          ...FAKE_PESSOAS[0],
          tagsRelevantes: [
            {
              id: 'tag-1',
              rotulo: 'Test',
              categoria: 'sinal-analitico',
              dataAplicacao: '2025-01-01',
            },
          ],
        },
      ];
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: personWithTags, total: 1, limit: 200, offset: 0 });

      const result = service.getTagsByPessoaId('p1');
      expect(result()).toEqual(personWithTags[0].tagsRelevantes);
    });

    it('should return an empty array for a non-existent pessoaId', () => {
      httpTesting
        .expectOne((r) => r.url.includes('/person/list'))
        .flush({ items: FAKE_PESSOAS, total: 1, limit: 200, offset: 0 });

      const result = service.getTagsByPessoaId('non-existent-id');
      expect(result()).toEqual([]);
    });
  });
});
