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
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { ReviewPanelComponent } from './review-panel';
import { ReviewService } from '../services/review.service';
import { DocumentService } from '../services/document.service';
import { Document, DocumentReview } from '../models/document.models';

const mockApiResponse = <T>(data: T) => of({ success: true, data, error: null });

const mockPendingReview: DocumentReview = {
  id: 'rev-1',
  documentId: 'doc-1',
  reviewerId: 'user-5',
  status: 'PENDING',
  createdAt: '2025-01-20T10:00:00Z',
  reviewerName: 'Revisor Alpha',
};

const mockCompletedReview: DocumentReview = {
  id: 'rev-2',
  documentId: 'doc-1',
  reviewerId: 'user-6',
  reviewType: 'APPROVAL',
  observation: 'Documento aprovado sem ressalvas',
  status: 'COMPLETED',
  createdAt: '2025-01-18T08:00:00Z',
  completedAt: '2025-01-19T09:00:00Z',
  reviewerName: 'Revisor Beta',
};

const mockDocument: Document = {
  id: 'doc-1',
  processId: 'proc-1',
  title: 'Relatório de Inteligência',
  content: '<p>Conteúdo do documento para revisão</p>',
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

function createMockReviewService() {
  return {
    getReviews: vi.fn().mockReturnValue(
      mockApiResponse([mockPendingReview, mockCompletedReview]),
    ),
    completeReview: vi.fn().mockReturnValue(
      mockApiResponse({ ...mockPendingReview, status: 'COMPLETED', reviewType: 'APPROVAL' }),
    ),
  };
}

function createMockDocumentService() {
  return {
    getDocument: vi.fn().mockReturnValue(mockApiResponse(mockDocument)),
  };
}

describe('ReviewPanelComponent', () => {
  let fixture: ComponentFixture<ReviewPanelComponent>;
  let component: ReviewPanelComponent;
  let mockReviewService: ReturnType<typeof createMockReviewService>;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockReviewService = createMockReviewService();
    mockDocumentService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [ReviewPanelComponent],
      providers: [
        { provide: ReviewService, useValue: mockReviewService },
        { provide: DocumentService, useValue: mockDocumentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPanelComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- List of pending reviews ---
  // **Validates: Requirement 7.1**

  it('should load and separate pending and completed reviews', () => {
    component.loadReviews('doc-1');

    expect(mockReviewService.getReviews).toHaveBeenCalledWith('doc-1');
    expect(component.pendingReviews().length).toBe(1);
    expect(component.pendingReviews()[0].id).toBe('rev-1');
    expect(component.completedReviews().length).toBe(1);
    expect(component.completedReviews()[0].id).toBe('rev-2');
  });

  it('should render pending reviews in table', () => {
    component.loadReviews('doc-1');
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.review-row'));
    expect(rows.length).toBe(1);
    const text = rows[0].nativeElement.textContent;
    expect(text).toContain('Revisor Alpha');
  });

  // --- Select document for review ---
  // **Validates: Requirement 7.2**

  it('should load document when selecting a review', () => {
    component.selectForReview(mockPendingReview);

    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('doc-1');
    expect(component.selectedDocument()).toBeTruthy();
    expect(component.selectedDocument()!.title).toBe('Relatório de Inteligência');
  });

  it('should display document content in read-only mode', () => {
    component.selectForReview(mockPendingReview);
    fixture.detectChanges();

    const content = fixture.debugElement.query(By.css('.document-content-readonly'));
    expect(content).toBeTruthy();
    expect(content.nativeElement.innerHTML).toContain('Conteúdo do documento para revisão');
  });

  // --- Dispatch actions ---
  // **Validates: Requirements 7.3, 7.5**

  it('should approve review and show success toast', () => {
    component.selectForReview(mockPendingReview);
    fixture.detectChanges();

    component.approveReview();

    expect(mockReviewService.completeReview).toHaveBeenCalledWith('doc-1', 'rev-1', {
      reviewType: 'APPROVAL',
      observation: undefined,
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Documento aprovado',
      }),
    );
  });

  // --- Return with observation (mandatory dialog) ---
  // **Validates: Requirement 7.4**
  // **Property 7: required text fields disable submit when empty**

  it('should open return dialog', () => {
    component.openReturnDialog();

    expect(component.showReturnDialog()).toBe(true);
    expect(component.returnObservation()).toBe('');
  });

  it('should not confirm return when observation is empty', () => {
    component.selectForReview(mockPendingReview);
    component.openReturnDialog();
    component.returnObservation.set('');
    component.confirmReturn();

    expect(mockReviewService.completeReview).not.toHaveBeenCalled();
  });

  it('should not confirm return when observation is whitespace only', () => {
    component.selectForReview(mockPendingReview);
    component.openReturnDialog();
    component.returnObservation.set('   ');
    component.confirmReturn();

    expect(mockReviewService.completeReview).not.toHaveBeenCalled();
  });

  it('should confirm return with valid observation and show toast', () => {
    component.selectForReview(mockPendingReview);
    fixture.detectChanges();

    component.openReturnDialog();
    component.returnObservation.set('Revisar seção 3 do relatório');
    component.confirmReturn();

    expect(mockReviewService.completeReview).toHaveBeenCalledWith('doc-1', 'rev-1', {
      reviewType: 'RETURN_WITH_OBSERVATION',
      observation: 'Revisar seção 3 do relatório',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Documento devolvido com observação',
      }),
    );
  });

  // --- Reject (mandatory dialog) ---
  // **Validates: Requirements 7.5, 7.6**
  // **Property 7: required text fields disable submit when empty**

  it('should open reject dialog', () => {
    component.openRejectDialog();

    expect(component.showRejectDialog()).toBe(true);
    expect(component.rejectReason()).toBe('');
  });

  it('should not confirm reject when reason is empty', () => {
    component.selectForReview(mockPendingReview);
    component.openRejectDialog();
    component.rejectReason.set('');
    component.confirmReject();

    expect(mockReviewService.completeReview).not.toHaveBeenCalled();
  });

  it('should not confirm reject when reason is whitespace only', () => {
    component.selectForReview(mockPendingReview);
    component.openRejectDialog();
    component.rejectReason.set('   ');
    component.confirmReject();

    expect(mockReviewService.completeReview).not.toHaveBeenCalled();
  });

  it('should confirm reject with valid reason and show toast', () => {
    component.selectForReview(mockPendingReview);
    fixture.detectChanges();

    component.openRejectDialog();
    component.rejectReason.set('Documento não atende aos requisitos');
    component.confirmReject();

    expect(mockReviewService.completeReview).toHaveBeenCalledWith('doc-1', 'rev-1', {
      reviewType: 'REJECTION',
      observation: 'Documento não atende aos requisitos',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Documento rejeitado',
      }),
    );
  });

  // --- Review history display ---
  // **Validates: Requirement 7.7**

  it('should display completed reviews in history table', () => {
    component.loadReviews('doc-1');
    fixture.detectChanges();

    const historyRows = fixture.debugElement.queryAll(By.css('.history-row'));
    expect(historyRows.length).toBe(1);
    const text = historyRows[0].nativeElement.textContent;
    expect(text).toContain('Revisor Beta');
    expect(text).toContain('Documento aprovado sem ressalvas');
  });

  it('should show empty message when no completed reviews', () => {
    mockReviewService.getReviews.mockReturnValue(
      mockApiResponse([mockPendingReview]),
    );
    component.loadReviews('doc-1');
    fixture.detectChanges();

    expect(component.completedReviews().length).toBe(0);
  });

  // --- Clear selection after dispatch ---

  it('should clear selected review and document after successful dispatch', () => {
    component.selectForReview(mockPendingReview);
    fixture.detectChanges();

    expect(component.selectedReview()).toBeTruthy();
    expect(component.selectedDocument()).toBeTruthy();

    component.approveReview();

    expect(component.selectedReview()).toBeNull();
    expect(component.selectedDocument()).toBeNull();
  });
});
