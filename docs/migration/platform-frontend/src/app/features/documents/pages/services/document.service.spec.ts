import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DocumentService, GetDocumentsParams, UploadAttachmentMetadata } from './document.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { Document, DocumentVersion, Attachment } from '../models/document.models';
import { CreateDocumentPayload, UpdateDocumentPayload } from '../models/document.payloads';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(DocumentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- getDocuments -------------------------------------------------------

  describe('getDocuments()', () => {
    const mockListResponse = {
      success: true,
      data: {
        items: [
          {
            id: 'doc-1',
            processId: 'proc-1',
            title: 'Documento Teste',
            type: 'DESPACHO' as const,
            securityClassification: 'RESERVADO' as const,
            status: 'RASCUNHO' as const,
            orderIndex: 0,
            version: 1,
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            creatorId: 'user-1',
            currentSectorId: 'sector-1',
          },
        ] satisfies Document[],
        total: 1,
        page: 1,
        limit: 10,
      },
    };

    it('should GET /documents with processId', () => {
      service.getDocuments('proc-1').subscribe((res) => {
        expect(res).toEqual(mockListResponse);
        expect(res.data?.items.length).toBe(1);
      });

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/documents`));
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('processId=proc-1');
      req.flush(mockListResponse);
    });

    it('should append query params for pagination and filters', () => {
      const params: GetDocumentsParams = {
        page: 2,
        limit: 20,
        search: 'teste',
        status: 'RASCUNHO',
        type: 'DESPACHO',
        securityClassification: 'RESERVADO',
      };

      service.getDocuments('proc-1', params).subscribe();

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/documents`));
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('processId=proc-1');
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('limit=20');
      expect(req.request.urlWithParams).toContain('search=teste');
      expect(req.request.urlWithParams).toContain('status=RASCUNHO');
      expect(req.request.urlWithParams).toContain('type=DESPACHO');
      expect(req.request.urlWithParams).toContain('securityClassification=RESERVADO');
      req.flush(mockListResponse);
    });

    it('should omit undefined params from query string', () => {
      service.getDocuments('proc-1', { page: 1 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/documents`));
      expect(req.request.urlWithParams).toContain('processId=proc-1');
      expect(req.request.urlWithParams).toContain('page=1');
      expect(req.request.urlWithParams).not.toContain('limit=');
      expect(req.request.urlWithParams).not.toContain('search=');
      req.flush(mockListResponse);
    });
  });

  // -- getDocument --------------------------------------------------------

  describe('getDocument()', () => {
    const mockDocument: Document = {
      id: 'doc-42',
      processId: 'proc-1',
      title: 'Documento Individual',
      content: '<p>Conteúdo do documento</p>',
      type: 'RELATORIO',
      securityClassification: 'SIGILOSO',
      status: 'ACTIVE',
      orderIndex: 1,
      version: 3,
      isActive: true,
      createdAt: '2025-02-01T10:00:00Z',
      updatedAt: '2025-02-15T14:30:00Z',
      creatorId: 'user-7',
      currentSectorId: 'sector-3',
      assignedUserId: 'user-10',
    };

    it('should GET /documents/:id and return the document', () => {
      const mockResponse = { success: true, data: mockDocument };

      service.getDocument('doc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('doc-42');
        expect(res.data?.title).toBe('Documento Individual');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- createDocument -----------------------------------------------------

  describe('createDocument()', () => {
    it('should POST /documents with the payload including processId', () => {
      const payload: CreateDocumentPayload & { processId: string } = {
        processId: 'proc-1',
        title: 'Novo Documento',
        distribution: 'EXTERNO',
        doc_type: 'OFICIO',
        template_key: 'BLANK',
      };

      const createdDocument: Document = {
        id: 'doc-new',
        processId: 'proc-1',
        title: payload.title,
        type: 'OFICIO',
        securityClassification: 'SIGILOSO',
        status: 'RASCUNHO',
        orderIndex: 0,
        version: 1,
        isActive: true,
        createdAt: '2025-06-01T12:00:00Z',
        updatedAt: '2025-06-01T12:00:00Z',
        creatorId: 'user-1',
        currentSectorId: 'sector-1',
      };

      const mockResponse = { success: true, data: createdDocument };

      service.createDocument(payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('doc-new');
        expect(res.data?.title).toBe('Novo Documento');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- updateDocument -----------------------------------------------------

  describe('updateDocument()', () => {
    it('should PUT /documents/:id with the payload and return the updated document', () => {
      const payload: UpdateDocumentPayload = {
        title: 'Título Atualizado',
        content: '<p>Conteúdo atualizado</p>',
        expectedVersion: 2,
      };

      const updatedDocument: Document = {
        id: 'doc-42',
        processId: 'proc-1',
        title: 'Título Atualizado',
        content: '<p>Conteúdo atualizado</p>',
        type: 'RELATORIO',
        securityClassification: 'RESERVADO',
        status: 'RASCUNHO',
        orderIndex: 1,
        version: 3,
        isActive: true,
        createdAt: '2025-02-01T10:00:00Z',
        updatedAt: '2025-06-10T09:00:00Z',
        creatorId: 'user-7',
        currentSectorId: 'sector-3',
      };

      const mockResponse = { success: true, data: updatedDocument };

      service.updateDocument('doc-42', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.title).toBe('Título Atualizado');
        expect(res.data?.version).toBe(3);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- deleteDocument -----------------------------------------------------

  describe('deleteDocument()', () => {
    it('should DELETE /documents/:id and return success', () => {
      const mockResponse = { success: true };

      service.deleteDocument('doc-42').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // -- getVersions --------------------------------------------------------

  describe('getVersions()', () => {
    const mockVersions: DocumentVersion[] = [
      {
        id: 'ver-1',
        documentId: 'doc-42',
        version: 1,
        title: 'Versão Inicial',
        content: '<p>Conteúdo v1</p>',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
      },
      {
        id: 'ver-2',
        documentId: 'doc-42',
        version: 2,
        title: 'Versão Revisada',
        content: '<p>Conteúdo v2</p>',
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'user-1',
      },
    ];

    it('should GET /documents/:id/versions and return the versions list', () => {
      const mockResponse = { success: true, data: mockVersions };

      service.getVersions('doc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(2);
        expect(res.data?.[0].version).toBe(1);
        expect(res.data?.[1].version).toBe(2);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/versions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- getVersion ---------------------------------------------------------

  describe('getVersion()', () => {
    it('should GET /documents/:id/versions/:versionId and return a single version', () => {
      const mockVersion: DocumentVersion = {
        id: 'ver-2',
        documentId: 'doc-42',
        version: 2,
        title: 'Versão Revisada',
        content: '<p>Conteúdo v2</p>',
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'user-1',
      };

      const mockResponse = { success: true, data: mockVersion };

      service.getVersion('doc-42', 'ver-2').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('ver-2');
        expect(res.data?.version).toBe(2);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/versions/ver-2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- getAttachments -----------------------------------------------------

  describe('getAttachments()', () => {
    const mockAttachments: Attachment[] = [
      {
        id: 'att-1',
        documentId: 'doc-42',
        fileName: 'relatorio.pdf',
        filePath: '/uploads/relatorio.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        origin: 'MANUAL',
        ocrProcessed: false,
        createdAt: '2025-03-01T08:00:00Z',
        createdBy: 'user-1',
      },
    ];

    it('should GET /attachments?documentId=... and return the attachments list', () => {
      const mockResponse = { success: true, data: mockAttachments };

      service.getAttachments('doc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].fileName).toBe('relatorio.pdf');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/attachments?documentId=doc-42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- uploadAttachment ---------------------------------------------------

  describe('uploadAttachment()', () => {
    it('should POST /attachments/upload with FormData containing file and documentId', () => {
      const mockFile = new File(['file-content'], 'documento.pdf', { type: 'application/pdf' });
      const metadata: UploadAttachmentMetadata = {
        documentId: 'doc-42',
        origin: 'MANUAL',
      };

      const mockAttachment: Attachment = {
        id: 'att-new',
        documentId: 'doc-42',
        fileName: 'documento.pdf',
        filePath: '/uploads/documento.pdf',
        fileType: 'application/pdf',
        fileSize: 12,
        origin: 'MANUAL',
        ocrProcessed: false,
        createdAt: '2025-06-01T12:00:00Z',
        createdBy: 'user-1',
      };

      const mockResponse = { success: true, data: mockAttachment };

      service.uploadAttachment(mockFile, metadata).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('att-new');
        expect(res.data?.fileName).toBe('documento.pdf');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/attachments/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);

      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBeInstanceOf(File);
      expect(formData.get('documentId')).toBe('doc-42');
      expect(formData.get('origin')).toBe('MANUAL');
      req.flush(mockResponse);
    });

    it('should include ocrProcessed in FormData when provided', () => {
      const mockFile = new File(['content'], 'scan.png', { type: 'image/png' });
      const metadata: UploadAttachmentMetadata = {
        documentId: 'doc-42',
        ocrProcessed: true,
      };

      const mockResponse = { success: true, data: {} as Attachment };

      service.uploadAttachment(mockFile, metadata).subscribe();

      const req = httpTesting.expectOne(`${API_BASE_URL}/attachments/upload`);
      const formData = req.request.body as FormData;
      expect(formData.get('documentId')).toBe('doc-42');
      expect(formData.get('ocrProcessed')).toBe('true');
      expect(formData.get('origin')).toBeNull();
      req.flush(mockResponse);
    });
  });

  // -- deleteAttachment ---------------------------------------------------

  describe('deleteAttachment()', () => {
    it('should DELETE /attachments/:id and return success', () => {
      const mockResponse = { success: true };

      service.deleteAttachment('att-1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/attachments/att-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
