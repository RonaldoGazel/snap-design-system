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
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { FormalizationComponent } from './formalization-panel';
import { FormalizationService } from '../services/formalization.service';
import { DocumentService } from '../services/document.service';
import {
  Document,
  FinalArtifact,
  IntegrityVerification,
} from '../models/document.models';

const mockApiResponse = <T>(data: T) => of({ success: true, data, error: null });

const mockDocument: Document = {
  id: 'doc-1',
  processId: 'proc-1',
  title: 'Relatório de Inteligência',
  content: '<p>Conteúdo do documento</p>',
  type: 'RELATORIO',
  securityClassification: 'RESERVADO',
  status: 'IN_REVIEW',
  orderIndex: 0,
  version: 3,
  isActive: true,
  createdAt: '2025-01-10T10:00:00Z',
  updatedAt: '2025-01-20T10:00:00Z',
  creatorId: 'user-1',
  currentSectorId: 'sector-1',
};

const mockArtifact: FinalArtifact = {
  id: 'artifact-1',
  documentId: 'doc-1',
  version: 3,
  contentHash: 'abc123def456',
  metadataHash: '789ghi012jkl',
  formalizedBy: 'user-admin',
  formalizedAt: '2025-01-25T14:00:00Z',
};

const mockIntegrityIntact: IntegrityVerification = {
  isIntact: true,
  contentHashMatch: true,
  metadataHashMatch: true,
  storedContentHash: 'abc123',
  calculatedContentHash: 'abc123',
  storedMetadataHash: '789ghi',
  calculatedMetadataHash: '789ghi',
};

const mockIntegrityCompromised: IntegrityVerification = {
  isIntact: false,
  contentHashMatch: false,
  metadataHashMatch: true,
  storedContentHash: 'abc123',
  calculatedContentHash: 'xyz999',
  storedMetadataHash: '789ghi',
  calculatedMetadataHash: '789ghi',
};

function createMockFormalizationService() {
  return {
    formalizeDocument: vi.fn().mockReturnValue(mockApiResponse(mockArtifact)),
    verifyIntegrity: vi.fn().mockReturnValue(mockApiResponse(mockIntegrityIntact)),
  };
}

function createMockDocumentService() {
  return {
    getDocument: vi.fn().mockReturnValue(mockApiResponse(mockDocument)),
  };
}

describe('FormalizationComponent', () => {
  let fixture: ComponentFixture<FormalizationComponent>;
  let component: FormalizationComponent;
  let mockFormalizationService: ReturnType<typeof createMockFormalizationService>;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockFormalizationService = createMockFormalizationService();
    mockDocumentService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [FormalizationComponent],
      providers: [
        { provide: FormalizationService, useValue: mockFormalizationService },
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'doc-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormalizationComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Document loading ---

  it('should load document on init from route param', () => {
    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('doc-1');
    expect(component.document()).toBeTruthy();
    expect(component.document()!.title).toBe('Relatório de Inteligência');
  });

  // --- Checklist validation ---
  // **Property 8: Checklist validates prerequisites**
  // **Validates: Requirement 8.2**

  it('should have all checklist items unchecked initially', () => {
    expect(component.checkApproved()).toBe(false);
    expect(component.checkVersionConfirmed()).toBe(false);
    expect(component.checkClassificationDefined()).toBe(false);
    expect(component.checkMetadataComplete()).toBe(false);
    expect(component.allChecked()).toBe(false);
  });

  it('should not allow formalization when checklist is incomplete', () => {
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    // Missing: checkClassificationDefined and checkMetadataComplete

    expect(component.allChecked()).toBe(false);
    component.formalizeDocument();
    expect(mockFormalizationService.formalizeDocument).not.toHaveBeenCalled();
  });

  it('should not allow formalization when only some items are checked', () => {
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    // Missing: checkMetadataComplete

    expect(component.allChecked()).toBe(false);
  });

  it('should allow formalization when all checklist items are checked', () => {
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);

    expect(component.allChecked()).toBe(true);
  });

  // --- Formalization call and artifact display ---
  // **Validates: Requirement 8.3, 8.4**

  it('should call formalizeDocument and display artifact on success', () => {
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);

    component.formalizeDocument();

    expect(mockFormalizationService.formalizeDocument).toHaveBeenCalledWith('doc-1');
    expect(component.artifact()).toBeTruthy();
    expect(component.artifact()!.contentHash).toBe('abc123def456');
    expect(component.artifact()!.metadataHash).toBe('789ghi012jkl');
    expect(component.artifact()!.version).toBe(3);
    expect(component.artifact()!.formalizedBy).toBe('user-admin');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Documento formalizado',
      }),
    );
  });

  it('should show error toast on formalization failure', () => {
    mockFormalizationService.formalizeDocument.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);

    component.formalizeDocument();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro',
      }),
    );
  });

  // --- Post-formalization lock ---
  // **Validates: Requirement 8.5**

  it('should show formalized indicator after formalization', () => {
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);

    component.formalizeDocument();
    fixture.detectChanges();

    expect(component.isFormalized()).toBe(true);
    const indicator = fixture.nativeElement.querySelector('.formalized-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toContain('Documento Formalizado — Imutável');
  });

  it('should detect formalized status from document', () => {
    mockDocumentService.getDocument.mockReturnValue(
      mockApiResponse({ ...mockDocument, status: 'FORMALIZED' }),
    );
    component.loadDocument('doc-1');

    expect(component.isFormalized()).toBe(true);
  });

  // --- Integrity verification ---
  // **Validates: Requirement 8.6**

  it('should verify integrity and show intact result', () => {
    // First formalize to enable integrity check
    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);
    component.formalizeDocument();

    component.verifyIntegrity();

    expect(mockFormalizationService.verifyIntegrity).toHaveBeenCalledWith('doc-1');
    expect(component.integrityResult()).toBeTruthy();
    expect(component.integrityResult()!.isIntact).toBe(true);
  });

  it('should verify integrity and show compromised result', () => {
    mockFormalizationService.verifyIntegrity.mockReturnValue(
      mockApiResponse(mockIntegrityCompromised),
    );

    component.checkApproved.set(true);
    component.checkVersionConfirmed.set(true);
    component.checkClassificationDefined.set(true);
    component.checkMetadataComplete.set(true);
    component.formalizeDocument();

    component.verifyIntegrity();
    fixture.detectChanges();

    expect(component.integrityResult()!.isIntact).toBe(false);
    expect(component.integrityResult()!.contentHashMatch).toBe(false);

    const result = fixture.nativeElement.querySelector('.integrity-result');
    expect(result).toBeTruthy();
    expect(result.classList.contains('compromised')).toBe(true);
    expect(result.textContent).toContain('Documento comprometido');
  });

  it('should show error toast on integrity verification failure', () => {
    mockFormalizationService.verifyIntegrity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.verifyIntegrity();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });
});
