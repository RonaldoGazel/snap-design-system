import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ApolizationService } from './apolization.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { DocumentMention } from '../models/document.models';
import { ApolloizePayload, ReviewMentionPayload } from '../models/document.payloads';

describe('ApolizationService', () => {
  let service: ApolizationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(ApolizationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- apolloize ----------------------------------------------------------

  describe('apolloize()', () => {
    it('should POST /documents/:id/apolloize with the payload and return mentions', () => {
      const payload: ApolloizePayload = {
        mentionTypes: ['PESSOA', 'ORGANIZACAO'],
      };

      const mockMentions: DocumentMention[] = [
        {
          id: 'mention-1',
          documentId: 'doc-1',
          mentionText: 'João Silva',
          mentionType: 'PESSOA',
          startOffset: 10,
          endOffset: 20,
          suggestedEntityId: 'entity-1',
          status: 'SUGGESTED',
          createdAt: '2025-06-01T12:00:00Z',
        },
        {
          id: 'mention-2',
          documentId: 'doc-1',
          mentionText: 'Polícia Federal',
          mentionType: 'ORGANIZACAO',
          startOffset: 50,
          endOffset: 66,
          status: 'SUGGESTED',
          createdAt: '2025-06-01T12:00:00Z',
        },
      ];

      const mockResponse = { success: true, data: mockMentions };

      service.apolloize('doc-1', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(2);
        expect(res.data?.[0].mentionType).toBe('PESSOA');
        expect(res.data?.[1].mentionType).toBe('ORGANIZACAO');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/apolloize`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- getMentions --------------------------------------------------------

  describe('getMentions()', () => {
    it('should GET /documents/:id/mentions and return the list', () => {
      const mockMentions: DocumentMention[] = [
        {
          id: 'mention-1',
          documentId: 'doc-1',
          mentionText: 'João Silva',
          mentionType: 'PESSOA',
          startOffset: 10,
          endOffset: 20,
          status: 'CONFIRMED',
          confirmedEntityId: 'entity-1',
          createdAt: '2025-06-01T12:00:00Z',
          reviewedBy: 'user-5',
          reviewedAt: '2025-06-02T09:00:00Z',
        },
      ];

      const mockResponse = { success: true, data: mockMentions };

      service.getMentions('doc-1').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].status).toBe('CONFIRMED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/mentions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- reviewMention ------------------------------------------------------

  describe('reviewMention()', () => {
    it('should PUT /documents/:id/mentions/:mentionId with the payload', () => {
      const payload: ReviewMentionPayload = {
        status: 'CONFIRMED',
        confirmedEntityId: 'entity-1',
      };

      const mockMention: DocumentMention = {
        id: 'mention-1',
        documentId: 'doc-1',
        mentionText: 'João Silva',
        mentionType: 'PESSOA',
        startOffset: 10,
        endOffset: 20,
        status: 'CONFIRMED',
        confirmedEntityId: 'entity-1',
        createdAt: '2025-06-01T12:00:00Z',
        reviewedBy: 'user-5',
        reviewedAt: '2025-06-02T09:00:00Z',
      };

      const mockResponse = { success: true, data: mockMention };

      service.reviewMention('doc-1', 'mention-1', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.status).toBe('CONFIRMED');
        expect(res.data?.confirmedEntityId).toBe('entity-1');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/mentions/mention-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should PUT with REJECTED status', () => {
      const payload: ReviewMentionPayload = {
        status: 'REJECTED',
      };

      const mockMention: DocumentMention = {
        id: 'mention-2',
        documentId: 'doc-1',
        mentionText: 'Texto Incorreto',
        mentionType: 'OUTRO',
        startOffset: 100,
        endOffset: 115,
        status: 'REJECTED',
        createdAt: '2025-06-01T12:00:00Z',
        reviewedBy: 'user-5',
        reviewedAt: '2025-06-02T10:00:00Z',
      };

      const mockResponse = { success: true, data: mockMention };

      service.reviewMention('doc-1', 'mention-2', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.status).toBe('REJECTED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-1/mentions/mention-2`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });
});
