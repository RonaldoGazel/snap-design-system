import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DisseminationService } from './dissemination.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { InternalDissemination, ExternalDissemination } from '../models/document.models';
import {
  CreateInternalDisseminationPayload,
  CreateExternalDisseminationPayload,
} from '../models/document.payloads';

describe('DisseminationService', () => {
  let service: DisseminationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(DisseminationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- disseminateInternal ------------------------------------------------

  describe('disseminateInternal()', () => {
    it('should POST /documents/:id/disseminate/internal with the payload', () => {
      const payload: CreateInternalDisseminationPayload = {
        toSectorId: 'sector-2',
        justification: 'Necessidade operacional',
      };

      const mockDissemination: InternalDissemination = {
        id: 'diss-1',
        documentId: 'doc-1',
        fromSectorId: 'sector-1',
        toSectorId: 'sector-2',
        disseminatedBy: 'user-1',
        justification: 'Necessidade operacional',
        status: 'PENDING',
        createdAt: '2025-06-01T12:00:00Z',
      };

      const mockResponse = { success: true, data: mockDissemination };

      service.disseminateInternal('doc-1', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('diss-1');
        expect(res.data?.status).toBe('PENDING');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/disseminate/internal`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- disseminateExternal ------------------------------------------------

  describe('disseminateExternal()', () => {
    it('should POST /documents/:id/disseminate/external with the payload', () => {
      const payload: CreateExternalDisseminationPayload = {
        destinationEntity: 'Polícia Federal',
        destinationContact: 'contato@pf.gov.br',
        justification: 'Cooperação interagências',
        exportFormat: 'PDF',
        signature: 'assinatura-digital',
      };

      const mockDissemination: ExternalDissemination = {
        id: 'ext-diss-1',
        documentId: 'doc-1',
        authorizedBy: 'user-admin',
        destinationEntity: 'Polícia Federal',
        destinationContact: 'contato@pf.gov.br',
        justification: 'Cooperação interagências',
        exportFormat: 'PDF',
        signature: 'assinatura-digital',
        status: 'PENDING_AUTHORIZATION',
        createdAt: '2025-06-01T14:00:00Z',
      };

      const mockResponse = { success: true, data: mockDissemination };

      service.disseminateExternal('doc-1', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.status).toBe('PENDING_AUTHORIZATION');
        expect(res.data?.destinationEntity).toBe('Polícia Federal');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/disseminate/external`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- getInternalDisseminations ------------------------------------------

  describe('getInternalDisseminations()', () => {
    it('should GET /documents/:id/disseminations/internal and return the list', () => {
      const mockList: InternalDissemination[] = [
        {
          id: 'diss-1',
          documentId: 'doc-1',
          fromSectorId: 'sector-1',
          toSectorId: 'sector-2',
          disseminatedBy: 'user-1',
          justification: 'Necessidade operacional',
          status: 'DELIVERED',
          createdAt: '2025-06-01T12:00:00Z',
          deliveredAt: '2025-06-01T13:00:00Z',
          toSectorName: 'Setor B',
          disseminatorName: 'Agente Silva',
        },
      ];

      const mockResponse = { success: true, data: mockList };

      service.getInternalDisseminations('doc-1').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].status).toBe('DELIVERED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/disseminations/internal`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- getExternalDisseminations ------------------------------------------

  describe('getExternalDisseminations()', () => {
    it('should GET /documents/:id/disseminations/external and return the list', () => {
      const mockList: ExternalDissemination[] = [
        {
          id: 'ext-diss-1',
          documentId: 'doc-1',
          authorizedBy: 'user-admin',
          destinationEntity: 'Polícia Federal',
          justification: 'Cooperação interagências',
          exportFormat: 'PDF',
          status: 'AUTHORIZED',
          createdAt: '2025-06-01T14:00:00Z',
          authorizedAt: '2025-06-02T10:00:00Z',
          authorizerName: 'Subsecretário Costa',
        },
      ];

      const mockResponse = { success: true, data: mockList };

      service.getExternalDisseminations('doc-1').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].status).toBe('AUTHORIZED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/disseminations/external`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
