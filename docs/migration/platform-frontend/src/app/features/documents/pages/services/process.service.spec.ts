import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ProcessService, GetProcessesParams } from './process.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { Process } from '../models/document.models';
import { CreateProcessPayload, UpdateProcessPayload } from '../models/document.payloads';

describe('ProcessService', () => {
  let service: ProcessService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(ProcessService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- getProcesses -------------------------------------------------------

  describe('getProcesses()', () => {
    const mockListResponse = {
      success: true,
      data: {
        items: [
          {
            id: 'proc-1',
            nup: '00001.000001/2025-01',
            title: 'Processo Teste',
            status: 'ATIVO' as const,
            securityClassification: 'RESERVADO' as const,
            priority: 'NORMAL' as const,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            creatorId: 'user-1',
            currentSectorId: 'sector-1',
          },
        ] satisfies Process[],
        total: 1,
        page: 1,
        limit: 10,
      },
    };

    it('should GET /processes with no params', () => {
      service.getProcesses().subscribe((res) => {
        expect(res).toEqual(mockListResponse);
        expect(res.data?.items.length).toBe(1);
      });

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/processes`));
      expect(req.request.method).toBe('GET');
      req.flush(mockListResponse);
    });

    it('should append query params for pagination and filters', () => {
      const params: GetProcessesParams = {
        page: 2,
        limit: 20,
        search: 'teste',
        status: 'ATIVO',
        securityClassification: 'RESERVADO',
        priority: 'URGENTE',
        sectorId: 'sector-5',
      };

      service.getProcesses(params).subscribe();

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/processes`));
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('limit=20');
      expect(req.request.urlWithParams).toContain('search=teste');
      expect(req.request.urlWithParams).toContain('status=ATIVO');
      expect(req.request.urlWithParams).toContain('securityClassification=RESERVADO');
      expect(req.request.urlWithParams).toContain('priority=URGENTE');
      expect(req.request.urlWithParams).toContain('sectorId=sector-5');
      req.flush(mockListResponse);
    });

    it('should omit undefined params from query string', () => {
      service.getProcesses({ page: 1 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/processes`));
      expect(req.request.urlWithParams).toContain('page=1');
      expect(req.request.urlWithParams).not.toContain('limit=');
      expect(req.request.urlWithParams).not.toContain('search=');
      req.flush(mockListResponse);
    });
  });

  // -- getProcess ---------------------------------------------------------

  describe('getProcess()', () => {
    const mockProcess: Process = {
      id: 'proc-42',
      nup: '00001.000042/2025-01',
      title: 'Processo Individual',
      description: 'Descrição do processo',
      status: 'TRAMITANDO',
      securityClassification: 'SIGILOSO',
      priority: 'ALTA',
      createdAt: '2025-02-01T10:00:00Z',
      updatedAt: '2025-02-15T14:30:00Z',
      creatorId: 'user-7',
      currentSectorId: 'sector-3',
      assignedUserId: 'user-10',
    };

    it('should GET /processes/:id and return the process', () => {
      const mockResponse = { success: true, data: mockProcess };

      service.getProcess('proc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('proc-42');
        expect(res.data?.nup).toBe('00001.000042/2025-01');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/processes/proc-42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- createProcess ------------------------------------------------------

  describe('createProcess()', () => {
    it('should POST /processes with the payload and return the created process', () => {
      const payload: CreateProcessPayload = {
        title: 'Novo Processo',
        description: 'Descrição do novo processo',
        securityClassification: 'RESERVADO',
        priority: 'URGENTE',
        assignedUserId: 'user-5',
      };

      const createdProcess: Process = {
        id: 'proc-new',
        nup: '00001.000099/2025-01',
        title: payload.title,
        description: payload.description,
        status: 'ATIVO',
        securityClassification: 'RESERVADO',
        priority: 'URGENTE',
        createdAt: '2025-06-01T12:00:00Z',
        updatedAt: '2025-06-01T12:00:00Z',
        creatorId: 'user-1',
        currentSectorId: 'sector-1',
        assignedUserId: 'user-5',
      };

      const mockResponse = { success: true, data: createdProcess };

      service.createProcess(payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('proc-new');
        expect(res.data?.title).toBe('Novo Processo');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/processes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- updateProcess ------------------------------------------------------

  describe('updateProcess()', () => {
    it('should PUT /processes/:id with the payload and return the updated process', () => {
      const payload: UpdateProcessPayload = {
        title: 'Título Atualizado',
        priority: 'ALTA',
        assignedUserId: null,
      };

      const updatedProcess: Process = {
        id: 'proc-42',
        nup: '00001.000042/2025-01',
        title: 'Título Atualizado',
        status: 'ATIVO',
        securityClassification: 'RESERVADO',
        priority: 'ALTA',
        createdAt: '2025-02-01T10:00:00Z',
        updatedAt: '2025-06-10T09:00:00Z',
        creatorId: 'user-7',
        currentSectorId: 'sector-3',
      };

      const mockResponse = { success: true, data: updatedProcess };

      service.updateProcess('proc-42', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.title).toBe('Título Atualizado');
        expect(res.data?.priority).toBe('ALTA');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/processes/proc-42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- deleteProcess ------------------------------------------------------

  describe('deleteProcess()', () => {
    it('should DELETE /processes/:id and return success', () => {
      const mockResponse = { success: true };

      service.deleteProcess('proc-42').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/processes/proc-42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
