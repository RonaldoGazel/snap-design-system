import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TramitationService, GetPendingTramitationsParams } from './tramitation.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { Tramitation } from '../models/document.models';
import { CreateTramitationPayload, RejectTramitationPayload } from '../models/document.payloads';

describe('TramitationService', () => {
  let service: TramitationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(TramitationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- createTramitation ---------------------------------------------------

  describe('createTramitation()', () => {
    it('should POST /tramitations with the payload and return the created tramitation', () => {
      const payload: CreateTramitationPayload = {
        processId: 'proc-1',
        toSectorId: 'sector-2',
        observation: 'Encaminhando para análise',
      };

      const createdTramitation: Tramitation = {
        id: 'tram-1',
        processId: 'proc-1',
        fromSectorId: 'sector-1',
        toSectorId: 'sector-2',
        userId: 'user-1',
        observation: 'Encaminhando para análise',
        status: 'PENDING',
        sentAt: '2025-06-01T10:00:00Z',
      };

      const mockResponse = { success: true, data: createdTramitation };

      service.createTramitation(payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('tram-1');
        expect(res.data?.status).toBe('PENDING');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/tramitations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- getPendingTramitations ----------------------------------------------

  describe('getPendingTramitations()', () => {
    const mockListResponse = {
      success: true,
      data: {
        items: [
          {
            id: 'tram-2',
            processId: 'proc-1',
            fromSectorId: 'sector-1',
            toSectorId: 'sector-3',
            userId: 'user-2',
            status: 'PENDING' as const,
            sentAt: '2025-06-02T08:00:00Z',
          },
        ] satisfies Tramitation[],
        total: 1,
        page: 1,
        limit: 10,
      },
    };

    it('should GET /tramitations/pending with no params', () => {
      service.getPendingTramitations().subscribe((res) => {
        expect(res).toEqual(mockListResponse);
        expect(res.data?.items.length).toBe(1);
      });

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/tramitations/pending`),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockListResponse);
    });

    it('should append query params for pagination and status filter', () => {
      const params: GetPendingTramitationsParams = {
        page: 2,
        limit: 20,
        status: 'PENDING',
      };

      service.getPendingTramitations(params).subscribe();

      const req = httpTesting.expectOne((r) =>
        r.url.startsWith(`${API_BASE_URL}/tramitations/pending`),
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('limit=20');
      expect(req.request.urlWithParams).toContain('status=PENDING');
      req.flush(mockListResponse);
    });
  });

  // -- getTramitationHistory -----------------------------------------------

  describe('getTramitationHistory()', () => {
    it('should GET /tramitations/history/:processId and return the history', () => {
      const mockHistory: Tramitation[] = [
        {
          id: 'tram-10',
          processId: 'proc-42',
          fromSectorId: 'sector-1',
          toSectorId: 'sector-2',
          userId: 'user-1',
          status: 'RECEIVED',
          sentAt: '2025-05-01T10:00:00Z',
          receivedAt: '2025-05-01T14:00:00Z',
          receivedBy: 'user-3',
        },
        {
          id: 'tram-11',
          processId: 'proc-42',
          fromSectorId: 'sector-2',
          toSectorId: 'sector-3',
          userId: 'user-3',
          status: 'PENDING',
          sentAt: '2025-05-02T09:00:00Z',
        },
      ];

      const mockResponse = { success: true, data: mockHistory };

      service.getTramitationHistory('proc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(2);
        expect(res.data?.[0].status).toBe('RECEIVED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/tramitations/history/proc-42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- receiveTramitation --------------------------------------------------

  describe('receiveTramitation()', () => {
    it('should POST /tramitations/:id/receive with empty body and return updated tramitation', () => {
      const receivedTramitation: Tramitation = {
        id: 'tram-5',
        processId: 'proc-1',
        fromSectorId: 'sector-1',
        toSectorId: 'sector-2',
        userId: 'user-1',
        status: 'RECEIVED',
        sentAt: '2025-06-01T10:00:00Z',
        receivedAt: '2025-06-01T15:00:00Z',
        receivedBy: 'user-4',
      };

      const mockResponse = { success: true, data: receivedTramitation };

      service.receiveTramitation('tram-5').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.status).toBe('RECEIVED');
        expect(res.data?.receivedAt).toBeTruthy();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/tramitations/tram-5/receive`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  // -- rejectTramitation ---------------------------------------------------

  describe('rejectTramitation()', () => {
    it('should POST /tramitations/:id/reject with rejection payload and return updated tramitation', () => {
      const payload: RejectTramitationPayload = {
        rejectionReason: 'Documentação incompleta',
      };

      const rejectedTramitation: Tramitation = {
        id: 'tram-7',
        processId: 'proc-3',
        fromSectorId: 'sector-1',
        toSectorId: 'sector-4',
        userId: 'user-1',
        status: 'REJECTED',
        sentAt: '2025-06-01T10:00:00Z',
        rejectedAt: '2025-06-02T09:00:00Z',
        rejectionReason: 'Documentação incompleta',
      };

      const mockResponse = { success: true, data: rejectedTramitation };

      service.rejectTramitation('tram-7', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.status).toBe('REJECTED');
        expect(res.data?.rejectionReason).toBe('Documentação incompleta');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/tramitations/tram-7/reject`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });
});
