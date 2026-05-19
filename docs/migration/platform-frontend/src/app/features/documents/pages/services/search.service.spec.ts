import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SearchService } from './search.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { SearchRequest, SearchResult } from '../models/document.models';

describe('SearchService', () => {
  let service: SearchService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(SearchService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- search -------------------------------------------------------------

  describe('search()', () => {
    it('should POST /search/documents with the request and return results', () => {
      const request: SearchRequest = {
        query: 'operação',
        type: 'OFICIO',
        status: 'ACTIVE',
        securityClassification: 'RESERVADO',
        page: 1,
        limit: 10,
      };

      const mockResult: SearchResult = {
        items: [
          {
            document: {
              id: 'doc-1',
              processId: 'proc-1',
              title: 'Ofício sobre operação',
              type: 'OFICIO',
              securityClassification: 'RESERVADO',
              status: 'ACTIVE',
              orderIndex: 1,
              version: 1,
              isActive: true,
              createdAt: '2025-06-01T12:00:00Z',
              updatedAt: '2025-06-01T12:00:00Z',
              creatorId: 'user-1',
              currentSectorId: 'sector-1',
            },
            matchHighlight: '...sobre <em>operação</em> conjunta...',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      const mockResponse = { success: true, data: mockResult };

      service.search(request).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.items.length).toBe(1);
        expect(res.data?.total).toBe(1);
        expect(res.data?.items[0].document.title).toBe('Ofício sobre operação');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/search/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should POST with minimal request (empty filters)', () => {
      const request: SearchRequest = {
        query: 'teste',
      };

      const mockResult: SearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      const mockResponse = { success: true, data: mockResult };

      service.search(request).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.items.length).toBe(0);
        expect(res.data?.total).toBe(0);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/search/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should POST with advanced filters', () => {
      const request: SearchRequest = {
        query: 'relatório',
        type: 'RELATORIO',
        status: 'FORMALIZED',
        securityClassification: 'SIGILOSO',
        priority: 'URGENTE',
        sectorId: 'sector-3',
        createdFrom: '2025-01-01',
        createdTo: '2025-06-30',
        responsibleId: 'user-10',
        page: 2,
        limit: 20,
      };

      const mockResult: SearchResult = {
        items: [],
        total: 0,
        page: 2,
        limit: 20,
      };

      const mockResponse = { success: true, data: mockResult };

      service.search(request).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/search/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
});
