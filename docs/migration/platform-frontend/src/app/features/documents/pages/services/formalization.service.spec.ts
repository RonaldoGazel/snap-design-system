import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FormalizationService } from './formalization.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { FinalArtifact, IntegrityVerification } from '../models/document.models';

describe('FormalizationService', () => {
  let service: FormalizationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(FormalizationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- formalizeDocument ---------------------------------------------------

  describe('formalizeDocument()', () => {
    const mockArtifact: FinalArtifact = {
      id: 'artifact-1',
      documentId: 'doc-10',
      version: 3,
      contentHash: 'sha256-content-abc123',
      metadataHash: 'sha256-meta-def456',
      formalizedBy: 'user-5',
      formalizedAt: '2025-06-15T10:00:00Z',
      signature: 'sig-xyz',
    };

    it('should POST /documents/:id/formalize and return the final artifact', () => {
      const mockResponse = { success: true, data: mockArtifact };

      service.formalizeDocument('doc-10').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.id).toBe('artifact-1');
        expect(res.data?.documentId).toBe('doc-10');
        expect(res.data?.version).toBe(3);
        expect(res.data?.contentHash).toBe('sha256-content-abc123');
        expect(res.data?.metadataHash).toBe('sha256-meta-def456');
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-10/formalize`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should return artifact without optional signature', () => {
      const artifactNoSig: FinalArtifact = { ...mockArtifact, signature: undefined };
      const mockResponse = { success: true, data: artifactNoSig };

      service.formalizeDocument('doc-10').subscribe((res) => {
        expect(res.data?.signature).toBeUndefined();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-10/formalize`);
      req.flush(mockResponse);
    });
  });

  // -- verifyIntegrity ----------------------------------------------------

  describe('verifyIntegrity()', () => {
    const mockIntact: IntegrityVerification = {
      isIntact: true,
      contentHashMatch: true,
      metadataHashMatch: true,
      storedContentHash: 'sha256-content-abc123',
      calculatedContentHash: 'sha256-content-abc123',
      storedMetadataHash: 'sha256-meta-def456',
      calculatedMetadataHash: 'sha256-meta-def456',
    };

    it('should GET /documents/:id/verify-integrity and return verification result', () => {
      const mockResponse = { success: true, data: mockIntact };

      service.verifyIntegrity('doc-10').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.isIntact).toBe(true);
        expect(res.data?.contentHashMatch).toBe(true);
        expect(res.data?.metadataHashMatch).toBe(true);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-10/verify-integrity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return compromised integrity when hashes do not match', () => {
      const mockCompromised: IntegrityVerification = {
        isIntact: false,
        contentHashMatch: false,
        metadataHashMatch: true,
        storedContentHash: 'sha256-content-abc123',
        calculatedContentHash: 'sha256-content-DIFFERENT',
        storedMetadataHash: 'sha256-meta-def456',
        calculatedMetadataHash: 'sha256-meta-def456',
      };
      const mockResponse = { success: true, data: mockCompromised };

      service.verifyIntegrity('doc-10').subscribe((res) => {
        expect(res.data?.isIntact).toBe(false);
        expect(res.data?.contentHashMatch).toBe(false);
        expect(res.data?.storedContentHash).not.toBe(res.data?.calculatedContentHash);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/documents/doc-10/verify-integrity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
