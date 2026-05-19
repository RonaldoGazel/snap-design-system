import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PersonServiceClient, PersonListResponse, TraverseResponse } from './person-service-client';
import { RuntimeConfigService } from '../../../services/runtime-config.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_URL = 'http://test-api/api/v1/poi';
const RELATIVE_API_URL = '/api/v1/poi';

/**
 * Provide a minimal RuntimeConfigService stub so PersonServiceClient
 * resolves `this.apiUrl` to a predictable value.
 */
function provideRuntimeConfigStub(personServiceUrl = API_URL) {
  return {
    provide: RuntimeConfigService,
    useValue: { config: { personServiceUrl } },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAKE_LIST_RESPONSE = {
  items: [
    {
      id: 'p1',
      uuid: 'p1',
      nome: 'PERSON ONE',
      fonte: 'SIPEN',
      perfis: [],
      fontes: [{ tipo: 'SIPEN', status: 'ativo' }],
      resumoAnalitico: '',
      statusReconciliacao: 'sem_divergencia',
      tagsRelevantes: [],
      vulgos: [],
    },
  ],
  total: 1,
  total_merged: 1,
  total_raw: 1,
  limit: 200,
  offset: 0,
};

const FAKE_TRAVERSE_RESPONSE: TraverseResponse = {
  nodes: [
    {
      id: 'n1',
      label: 'Person',
      properties: { nome: 'PERSON ONE' },
      _node_id: 'node-1',
      _graph_id: 'graph-1',
      _graph_name: 'Grafo Publico',
      _sources: [{ graph_id: 'graph-1', display_name: 'Grafo Publico' }],
      _merged_from: 1,
    },
  ],
  edges: [
    {
      start_id: 'n1',
      end_id: 'n2',
      label: 'HAS_PHONE',
      _graph_id: 'graph-1',
      _graph_name: 'Grafo Publico',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersonServiceClient', () => {
  let service: PersonServiceClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRuntimeConfigStub()],
    });
    service = TestBed.inject(PersonServiceClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // -----------------------------------------------------------------------
  // listPersons — returns PersonListResponse
  // Validates: Requirement 2.1
  // -----------------------------------------------------------------------
  describe('listPersons()', () => {
    it('should return a PersonListResponse with items, total, total_merged, total_raw, limit, offset', () => {
      let result: PersonListResponse | undefined;

      service.listPersons().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(`${API_URL}/person/list`);
      expect(req.request.method).toBe('GET');
      req.flush(FAKE_LIST_RESPONSE);

      expect(result).toBeDefined();
      expect(result!.total).toBe(1);
      expect(result!.total_merged).toBe(1);
      expect(result!.total_raw).toBe(1);
      expect(result!.limit).toBe(200);
      expect(result!.offset).toBe(0);
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].id).toBe('p1');
    });

    it('should pass source query param when provided', () => {
      service.listPersons({ source: 'SNAP' }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/list`);
      expect(req.request.params.get('source')).toBe('SNAP');
      req.flush(FAKE_LIST_RESPONSE);
    });

    it('should pass q query param when provided', () => {
      service.listPersons({ q: 'João' }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/list`);
      expect(req.request.params.get('q')).toBe('João');
      req.flush(FAKE_LIST_RESPONSE);
    });

    it('should pass limit and offset query params when provided', () => {
      service.listPersons({ limit: 50, offset: 10 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/list`);
      expect(req.request.params.get('limit')).toBe('50');
      expect(req.request.params.get('offset')).toBe('10');
      req.flush(FAKE_LIST_RESPONSE);
    });

    it('should map items through mapApiPersonListToPessoas', () => {
      let result: PersonListResponse | undefined;

      service.listPersons().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(`${API_URL}/person/list`);
      req.flush(FAKE_LIST_RESPONSE);

      // The mapper normalises statusReconciliacao from underscores to hyphens
      expect(result!.items[0].statusReconciliacao).toBe('sem-divergencia');
      // The mapper normalises fonte tipo to lowercase
      expect(result!.items[0].fontes[0].tipo).toBe('sipen');
    });
  });

  // -----------------------------------------------------------------------
  // traversePerson — URL construction and query params
  // Validates: Requirements 2.2, 2.3, 2.4
  // -----------------------------------------------------------------------
  describe('traversePerson()', () => {
    it('should send GET to /person/{id}/traverse', () => {
      service.traversePerson('uuid-123').subscribe();

      const req = httpTesting.expectOne(`${API_URL}/person/uuid-123/traverse`);
      expect(req.request.method).toBe('GET');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should return TraverseResponse with nodes and edges', () => {
      let result: TraverseResponse | undefined;

      service.traversePerson('uuid-123').subscribe((res) => (result = res));

      const req = httpTesting.expectOne(`${API_URL}/person/uuid-123/traverse`);
      req.flush(FAKE_TRAVERSE_RESPONSE);

      expect(result).toBeDefined();
      expect(result!.nodes).toHaveLength(1);
      expect(result!.nodes[0].id).toBe('n1');
      expect(result!.edges).toHaveLength(1);
      expect(result!.edges[0].label).toBe('HAS_PHONE');
    });

    it('should pass depth and limit as query params', () => {
      service.traversePerson('uuid-123', { depth: 3, limit: 500 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('depth')).toBe('3');
      expect(req.request.params.get('limit')).toBe('500');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should not send depth/limit params when not provided', () => {
      service.traversePerson('uuid-123').subscribe();

      const req = httpTesting.expectOne(`${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    // ----- Depth clamping (Requirement 2.3) -----

    it('should clamp depth to minimum of 1', () => {
      service.traversePerson('uuid-123', { depth: 0 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('depth')).toBe('1');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should clamp depth to maximum of 5', () => {
      service.traversePerson('uuid-123', { depth: 10 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('depth')).toBe('5');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should clamp negative depth to 1', () => {
      service.traversePerson('uuid-123', { depth: -3 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('depth')).toBe('1');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    // ----- Limit clamping (Requirement 2.4) -----

    it('should clamp limit to minimum of 1', () => {
      service.traversePerson('uuid-123', { limit: 0 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('limit')).toBe('1');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should clamp limit to maximum of 2000', () => {
      service.traversePerson('uuid-123', { limit: 5000 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('limit')).toBe('2000');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should clamp negative limit to 1', () => {
      service.traversePerson('uuid-123', { limit: -10 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('limit')).toBe('1');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });

    it('should pass valid depth and limit without clamping', () => {
      service.traversePerson('uuid-123', { depth: 3, limit: 1000 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === `${API_URL}/person/uuid-123/traverse`);
      expect(req.request.params.get('depth')).toBe('3');
      expect(req.request.params.get('limit')).toBe('1000');
      req.flush(FAKE_TRAVERSE_RESPONSE);
    });
  });

  // -----------------------------------------------------------------------
  // HTTP error propagation
  // Validates: Requirement 2.5
  // -----------------------------------------------------------------------
  describe('HTTP error propagation', () => {
    it('should propagate HTTP error from listPersons', () => {
      let error: any;

      service.listPersons().subscribe({
        error: (err) => (error = err),
      });

      const req = httpTesting.expectOne(`${API_URL}/person/list`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(error).toBeDefined();
      expect(error.status).toBe(404);
    });

    it('should propagate HTTP error from traversePerson', () => {
      let error: any;

      service.traversePerson('uuid-123').subscribe({
        error: (err) => (error = err),
      });

      const req = httpTesting.expectOne(`${API_URL}/person/uuid-123/traverse`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(error).toBeDefined();
      expect(error.status).toBe(500);
    });

    it('should propagate 403 Forbidden from traversePerson', () => {
      let error: any;

      service.traversePerson('uuid-123').subscribe({
        error: (err) => (error = err),
      });

      const req = httpTesting.expectOne(`${API_URL}/person/uuid-123/traverse`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(error).toBeDefined();
      expect(error.status).toBe(403);
    });
  });
});

// ---------------------------------------------------------------------------
// Relative URL integration tests
// Validates: Requirements 7.1, 7.2, 7.3
// ---------------------------------------------------------------------------

describe('PersonServiceClient — relative base URL', () => {
  let service: PersonServiceClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRuntimeConfigStub(RELATIVE_API_URL),
      ],
    });
    service = TestBed.inject(PersonServiceClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // -----------------------------------------------------------------------
  // Validates: Requirement 7.1 — PersonServiceClient works with relative paths
  // Validates: Requirement 7.2 — HttpClient resolves relative URLs natively
  // -----------------------------------------------------------------------

  it('should send listPersons request to relative URL /api/v1/poi/person/list', () => {
    service.listPersons().subscribe();

    const req = httpTesting.expectOne(`${RELATIVE_API_URL}/person/list`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, total_merged: 0, total_raw: 0, limit: 200, offset: 0 });
  });

  it('should send traversePerson request to relative URL /api/v1/poi/person/{id}/traverse', () => {
    service.traversePerson('uuid-abc').subscribe();

    const req = httpTesting.expectOne(`${RELATIVE_API_URL}/person/uuid-abc/traverse`);
    expect(req.request.method).toBe('GET');
    req.flush({ nodes: [], edges: [] });
  });

  it('should send getPersonById request to relative URL /api/v1/poi/person/{id}', () => {
    service.getPersonById('uuid-abc').subscribe();

    const req = httpTesting.expectOne(`${RELATIVE_API_URL}/person/uuid-abc`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should send generatePerson request to relative URL /api/v1/poi/generate-person/snap', () => {
    service.generatePerson('12345678901').subscribe();

    const req = httpTesting.expectOne(`${RELATIVE_API_URL}/generate-person/snap`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should send generatePersonSipen request to relative URL /api/v1/poi/generate-person/sipen', () => {
    service.generatePersonSipen('12345678901').subscribe();

    const req = httpTesting.expectOne(`${RELATIVE_API_URL}/generate-person/sipen`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should correctly concatenate relative base URL with path segments', () => {
    // Verifies: /api/v1/poi + /person/list = /api/v1/poi/person/list
    service.listPersons({ q: 'test', limit: 10 }).subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${RELATIVE_API_URL}/person/list`);
    expect(req.request.url).toBe('/api/v1/poi/person/list');
    expect(req.request.params.get('q')).toBe('test');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0, total_merged: 0, total_raw: 0, limit: 10, offset: 0 });
  });

  it('should pass query params correctly with relative base URL', () => {
    service.traversePerson('uuid-abc', { depth: 2, limit: 100 }).subscribe();

    const req = httpTesting.expectOne(
      (r) => r.url === `${RELATIVE_API_URL}/person/uuid-abc/traverse`,
    );
    expect(req.request.params.get('depth')).toBe('2');
    expect(req.request.params.get('limit')).toBe('100');
    req.flush({ nodes: [], edges: [] });
  });
});
