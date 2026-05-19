import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TemplateService, GetTemplatesParams } from './template.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { DocumentTemplate } from '../models/document.models';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(TemplateService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- getTemplates -------------------------------------------------------

  describe('getTemplates()', () => {
    const mockTemplate: DocumentTemplate = {
      id: 'tpl-1',
      name: 'Despacho Padrão',
      description: 'Template para despachos',
      documentType: 'DESPACHO',
      contentTemplate: '<p>Despacho...</p>',
      isActive: true,
      createdBy: 'user-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockListResponse = {
      success: true,
      data: {
        items: [mockTemplate],
        total: 1,
        page: 1,
        limit: 10,
      },
    };

    it('should GET /document-templates with no params', () => {
      service.getTemplates().subscribe((res) => {
        expect(res).toEqual(mockListResponse);
        expect(res.data?.items.length).toBe(1);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/document-templates`),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockListResponse);
    });

    it('should append documentType and isActive query params', () => {
      const params: GetTemplatesParams = {
        documentType: 'OFICIO',
        isActive: true,
      };

      service.getTemplates(params).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/document-templates`),
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('documentType=OFICIO');
      expect(req.request.urlWithParams).toContain('isActive=true');
      req.flush(mockListResponse);
    });

    it('should append pagination params', () => {
      const params: GetTemplatesParams = { page: 2, limit: 5 };

      service.getTemplates(params).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/document-templates`),
      );
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('limit=5');
      req.flush(mockListResponse);
    });

    it('should omit undefined params from query string', () => {
      service.getTemplates({ documentType: 'RELATORIO' }).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/document-templates`),
      );
      expect(req.request.urlWithParams).toContain('documentType=RELATORIO');
      expect(req.request.urlWithParams).not.toContain('isActive=');
      expect(req.request.urlWithParams).not.toContain('page=');
      expect(req.request.urlWithParams).not.toContain('limit=');
      req.flush(mockListResponse);
    });

    it('should handle isActive=false correctly', () => {
      service.getTemplates({ isActive: false }).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/document-templates`),
      );
      expect(req.request.urlWithParams).toContain('isActive=false');
      req.flush(mockListResponse);
    });
  });

  // -- getTemplate --------------------------------------------------------

  describe('getTemplate()', () => {
    const mockTemplate: DocumentTemplate = {
      id: 'tpl-42',
      name: 'Relatório de Inteligência',
      description: 'Template para relatórios',
      documentType: 'RELATORIO',
      contentTemplate: '<h2>Relatório</h2>',
      metadataSchema: { fields: ['titulo', 'classificacao'] },
      isActive: true,
      createdBy: 'user-3',
      createdAt: '2025-03-01T10:00:00Z',
      updatedAt: '2025-03-15T14:30:00Z',
    };

    it('should GET /document-templates/:id and return the template', () => {
      const mockResponse = { success: true, data: mockTemplate };

      service.getTemplate('tpl-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('tpl-42');
        expect(res.data?.name).toBe('Relatório de Inteligência');
        expect(res.data?.documentType).toBe('RELATORIO');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/document-templates/tpl-42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
