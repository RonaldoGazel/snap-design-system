// Polyfill ResizeObserver for PrimeNG in test environment
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { SearchComponent } from './search-panel';
import { SearchService } from '../services/search.service';
import { DocumentSearchItem, SearchResult } from '../models/document.models';
import { ApiResponse } from '../../../../shared/models/api-response.model';

const mockSearchItems: DocumentSearchItem[] = [
  {
    document: {
      id: 'doc-1',
      processId: 'proc-1',
      title: 'Relatório Operacional',
      type: 'RELATORIO',
      securityClassification: 'RESERVADO',
      status: 'ACTIVE',
      orderIndex: 0,
      version: 3,
      isActive: true,
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-15T14:00:00Z',
      creatorId: 'user-1',
      currentSectorId: 'sector-1',
      assignedUserId: 'user-10',
    },
    process: {
      id: 'proc-1',
      nup: 'NUP-2025-001',
      title: 'Processo Alpha',
      status: 'ATIVO',
      securityClassification: 'RESERVADO',
      priority: 'ALTA',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-15T14:00:00Z',
      creatorId: 'user-1',
      currentSectorId: 'sector-1',
    },
    matchHighlight: 'operacional',
  },
  {
    document: {
      id: 'doc-2',
      processId: 'proc-2',
      title: 'Ofício de Comunicação',
      type: 'OFICIO',
      securityClassification: 'PUBLICO',
      status: 'FORMALIZED',
      orderIndex: 1,
      version: 1,
      isActive: true,
      createdAt: '2025-02-01T08:00:00Z',
      updatedAt: '2025-02-10T12:00:00Z',
      creatorId: 'user-2',
      currentSectorId: 'sector-2',
    },
  },
];

const mockSearchResponse: ApiResponse<SearchResult> = {
  success: true,
  data: { items: mockSearchItems, total: 2, page: 1, limit: 10 },
};

const mockEmptyResponse: ApiResponse<SearchResult> = {
  success: true,
  data: { items: [], total: 0, page: 1, limit: 10 },
};

function createMockSearchService() {
  return {
    search: vi.fn().mockReturnValue(of(mockSearchResponse)),
  };
}

describe('SearchComponent', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let component: SearchComponent;
  let mockService: ReturnType<typeof createMockSearchService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = createMockSearchService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: SearchService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Search execution ---
  // **Validates: Requirement 11.1**

  it('should call SearchService.search with correct request on search', () => {
    component.query.set('operacional');
    component.search();

    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'operacional',
        page: 1,
        limit: 10,
      }),
    );
  });

  it('should not include empty query in search request', () => {
    component.query.set('   ');
    component.search();

    const callArg = mockService.search.mock.calls[0][0];
    expect(callArg.query).toBeUndefined();
  });

  // --- Results rendering ---
  // **Validates: Requirement 11.3**

  it('should render results in table with correct columns', () => {
    component.query.set('test');
    component.search();
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.result-row'));
    expect(rows.length).toBe(2);

    const firstRow = rows[0].nativeElement.textContent;
    expect(firstRow).toContain('Relatório Operacional');
    expect(firstRow).toContain('RELATORIO');
    expect(firstRow).toContain('NUP-2025-001');
    expect(firstRow).toContain('user-10');
    expect(firstRow).toContain('3');
  });

  it('should render second result row correctly', () => {
    component.query.set('test');
    component.search();
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.result-row'));
    const secondRow = rows[1].nativeElement.textContent;
    expect(secondRow).toContain('Ofício de Comunicação');
    expect(secondRow).toContain('OFICIO');
  });

  // --- Pagination ---
  // **Validates: Requirement 11.4**

  it('should trigger new search with updated page on pagination', () => {
    component.query.set('test');
    component.search();
    mockService.search.mockClear();

    component.onPageChange({ first: 10, rows: 10, page: 1, pageCount: 5 });

    expect(component.currentPage()).toBe(2);
    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });

  it('should update pageSize on pagination change', () => {
    component.query.set('test');
    component.search();
    mockService.search.mockClear();

    component.onPageChange({ first: 0, rows: 20, page: 0, pageCount: 3 });

    expect(component.pageSize()).toBe(20);
  });

  // --- Empty state ---
  // **Validates: Requirement 11.6**

  it('should show empty message when no results', () => {
    mockService.search.mockReturnValue(of(mockEmptyResponse));
    component.query.set('nonexistent');
    component.search();
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.empty-message'));
    expect(empty).toBeTruthy();
    expect(empty.nativeElement.textContent).toContain(
      'Nenhum documento encontrado para os critérios informados',
    );
  });

  it('should not show empty message before search', () => {
    const empty = fixture.debugElement.query(By.css('.empty-message'));
    expect(empty).toBeFalsy();
  });

  // --- Navigation ---
  // **Validates: Requirement 11.5**

  it('should navigate to editor on row click', () => {
    component.onRowClick(mockSearchItems[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'editor',
      'doc-1',
    ]);
  });

  // --- Advanced filters toggle ---
  // **Validates: Requirement 11.2**

  it('should toggle advanced filters visibility', () => {
    expect(component.showAdvancedFilters()).toBe(false);
    component.toggleAdvancedFilters();
    expect(component.showAdvancedFilters()).toBe(true);
    component.toggleAdvancedFilters();
    expect(component.showAdvancedFilters()).toBe(false);
  });

  it('should render advanced filters when toggled on', () => {
    component.showAdvancedFilters.set(true);
    fixture.detectChanges();

    const filters = fixture.debugElement.query(By.css('.advanced-filters'));
    expect(filters).toBeTruthy();
  });

  it('should not render advanced filters by default', () => {
    const filters = fixture.debugElement.query(By.css('.advanced-filters'));
    expect(filters).toBeFalsy();
  });

  // --- Filter values in search request ---

  it('should include classification filter in search request', () => {
    component.query.set('test');
    component.classificationFilter.set('SIGILOSO');
    component.search();

    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({ securityClassification: 'SIGILOSO' }),
    );
  });

  it('should include priority filter in search request', () => {
    component.query.set('test');
    component.priorityFilter.set('URGENTE');
    component.search();

    expect(mockService.search).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'URGENTE' }),
    );
  });

  // --- Property 11: Results match exactly what API returns ---
  // **Validates: Requirement 11.7**

  it('should render exactly the items returned by the API without filtering', () => {
    const apiItems: DocumentSearchItem[] = [
      {
        document: {
          id: 'doc-x',
          processId: 'proc-x',
          title: 'Doc X',
          type: 'DESPACHO',
          securityClassification: 'PUBLICO',
          status: 'RASCUNHO',
          orderIndex: 0,
          version: 1,
          isActive: true,
          createdAt: '2025-03-01T10:00:00Z',
          updatedAt: '2025-03-01T10:00:00Z',
          creatorId: 'user-x',
          currentSectorId: 'sector-x',
        },
      },
    ];

    mockService.search.mockReturnValue(
      of({ success: true, data: { items: apiItems, total: 1, page: 1, limit: 10 } }),
    );

    component.query.set('test');
    component.search();
    fixture.detectChanges();

    // Component results must match API response exactly
    expect(component.results()).toEqual(apiItems);
    expect(component.results().length).toBe(1);
    expect(component.results()[0].document.id).toBe('doc-x');

    const rows = fixture.debugElement.queryAll(By.css('.result-row'));
    expect(rows.length).toBe(1);
  });

  // --- Reset page on new search ---

  it('should reset to page 1 on new search', () => {
    component.currentPage.set(3);
    component.query.set('new search');
    component.search();

    expect(component.currentPage()).toBe(1);
  });

  // --- Loading state ---

  it('should set loading to false after search completes', () => {
    component.query.set('test');
    component.search();

    expect(component.loading()).toBe(false);
  });
});
