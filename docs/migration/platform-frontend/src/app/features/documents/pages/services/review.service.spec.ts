import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ReviewService } from './review.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { DocumentReview } from '../models/document.models';
import { SubmitReviewPayload, CompleteReviewPayload } from '../models/document.payloads';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(ReviewService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- submitReview -------------------------------------------------------

  describe('submitReview()', () => {
    it('should POST /documents/:id/reviews with the payload and return the created review', () => {
      const payload: SubmitReviewPayload = { reviewerId: 'user-10' };

      const createdReview: DocumentReview = {
        id: 'review-1',
        documentId: 'doc-42',
        reviewerId: 'user-10',
        status: 'PENDING',
        createdAt: '2025-06-01T12:00:00Z',
      };

      const mockResponse = { success: true, data: createdReview };

      service.submitReview('doc-42', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('review-1');
        expect(res.data?.status).toBe('PENDING');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  // -- getReviews ---------------------------------------------------------

  describe('getReviews()', () => {
    it('should GET /documents/:id/reviews and return the list of reviews', () => {
      const reviews: DocumentReview[] = [
        {
          id: 'review-1',
          documentId: 'doc-42',
          reviewerId: 'user-10',
          reviewType: 'APPROVAL',
          observation: 'Aprovado sem ressalvas',
          status: 'COMPLETED',
          createdAt: '2025-06-01T12:00:00Z',
          completedAt: '2025-06-02T09:00:00Z',
          reviewerName: 'Analista Silva',
        },
        {
          id: 'review-2',
          documentId: 'doc-42',
          reviewerId: 'user-11',
          status: 'PENDING',
          createdAt: '2025-06-03T08:00:00Z',
        },
      ];

      const mockResponse = { success: true, data: reviews };

      service.getReviews('doc-42').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.length).toBe(2);
        expect(res.data?.[0].reviewType).toBe('APPROVAL');
        expect(res.data?.[1].status).toBe('PENDING');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/reviews`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- completeReview (APPROVAL) ------------------------------------------

  describe('completeReview()', () => {
    it('should PUT /documents/:id/reviews/:reviewId with APPROVAL payload', () => {
      const payload: CompleteReviewPayload = { reviewType: 'APPROVAL' };

      const completedReview: DocumentReview = {
        id: 'review-1',
        documentId: 'doc-42',
        reviewerId: 'user-10',
        reviewType: 'APPROVAL',
        status: 'COMPLETED',
        createdAt: '2025-06-01T12:00:00Z',
        completedAt: '2025-06-02T09:00:00Z',
      };

      const mockResponse = { success: true, data: completedReview };

      service.completeReview('doc-42', 'review-1', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.reviewType).toBe('APPROVAL');
        expect(res.data?.status).toBe('COMPLETED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/reviews/review-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should PUT /documents/:id/reviews/:reviewId with RETURN_WITH_OBSERVATION payload', () => {
      const payload: CompleteReviewPayload = {
        reviewType: 'RETURN_WITH_OBSERVATION',
        observation: 'Corrigir seção 3.2 — dados desatualizados',
      };

      const completedReview: DocumentReview = {
        id: 'review-2',
        documentId: 'doc-42',
        reviewerId: 'user-11',
        reviewType: 'RETURN_WITH_OBSERVATION',
        observation: 'Corrigir seção 3.2 — dados desatualizados',
        status: 'COMPLETED',
        createdAt: '2025-06-03T08:00:00Z',
        completedAt: '2025-06-04T10:00:00Z',
      };

      const mockResponse = { success: true, data: completedReview };

      service.completeReview('doc-42', 'review-2', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.reviewType).toBe('RETURN_WITH_OBSERVATION');
        expect(res.data?.observation).toBe('Corrigir seção 3.2 — dados desatualizados');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/reviews/review-2`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should PUT /documents/:id/reviews/:reviewId with REJECTION payload', () => {
      const payload: CompleteReviewPayload = {
        reviewType: 'REJECTION',
        observation: 'Documento não atende aos requisitos mínimos',
      };

      const completedReview: DocumentReview = {
        id: 'review-3',
        documentId: 'doc-42',
        reviewerId: 'user-12',
        reviewType: 'REJECTION',
        observation: 'Documento não atende aos requisitos mínimos',
        status: 'COMPLETED',
        createdAt: '2025-06-05T14:00:00Z',
        completedAt: '2025-06-06T11:00:00Z',
      };

      const mockResponse = { success: true, data: completedReview };

      service.completeReview('doc-42', 'review-3', payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.reviewType).toBe('REJECTION');
        expect(res.data?.status).toBe('COMPLETED');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-42/reviews/review-3`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });
});
