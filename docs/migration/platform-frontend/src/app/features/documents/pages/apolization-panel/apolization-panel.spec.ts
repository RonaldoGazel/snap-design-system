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

import { ApolizationComponent } from './apolization-panel';
import { ApolizationService } from '../services/apolization.service';
import { DocumentService } from '../services/document.service';
import { Document, DocumentMention } from '../models/document.models';

const mockApiResponse = <T>(data: T) => of({ success: true, data, error: null });

const mockDocument: Document = {
  id: 'doc-1',
  processId: 'proc-1',
  title: 'Relatório de Inteligência',
  content: 'João Silva trabalhou na Organização Alpha em São Paulo com veículo ABC-1234.',
  type: 'RELATORIO',
  securityClassification: 'RESERVADO',
  status: 'ACTIVE',
  orderIndex: 0,
  version: 2,
  isActive: true,
  createdAt: '2025-01-10T10:00:00Z',
  updatedAt: '2025-01-20T10:00:00Z',
  creatorId: 'user-1',
  currentSectorId: 'sector-1',
};

const mockMentions: DocumentMention[] = [
  {
    id: 'mention-1',
    documentId: 'doc-1',
    mentionText: 'João Silva',
    mentionType: 'PESSOA',
    startOffset: 0,
    endOffset: 10,
    suggestedEntityId: 'entity-1',
    status: 'SUGGESTED',
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'mention-2',
    documentId: 'doc-1',
    mentionText: 'Organização Alpha',
    mentionType: 'ORGANIZACAO',
    startOffset: 27,
    endOffset: 45,
    status: 'SUGGESTED',
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'mention-3',
    documentId: 'doc-1',
    mentionText: 'São Paulo',
    mentionType: 'LOCAL',
    startOffset: 49,
    endOffset: 58,
    status: 'CONFIRMED',
    confirmedEntityId: 'entity-sp',
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'mention-4',
    documentId: 'doc-1',
    mentionText: 'ABC-1234',
    mentionType: 'VEICULO',
    startOffset: 72,
    endOffset: 80,
    status: 'REJECTED',
    createdAt: '2025-01-20T10:00:00Z',
  },
];

function createMockApolizationService() {
  return {
    apolloize: vi.fn().mockReturnValue(mockApiResponse(mockMentions)),
    getMentions: vi.fn().mockReturnValue(mockApiResponse(mockMentions)),
    reviewMention: vi.fn().mockImplementation((_docId: string, mentionId: string, payload: { status: string }) => {
      const mention = mockMentions.find((m) => m.id === mentionId);
      return mockApiResponse({
        ...mention,
        status: payload.status,
      });
    }),
  };
}

function createMockDocumentService() {
  return {
    getDocument: vi.fn().mockReturnValue(mockApiResponse(mockDocument)),
  };
}

describe('ApolizationComponent', () => {
  let fixture: ComponentFixture<ApolizationComponent>;
  let component: ApolizationComponent;
  let mockApolizationService: ReturnType<typeof createMockApolizationService>;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockApolizationService = createMockApolizationService();
    mockDocumentService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [ApolizationComponent],
      providers: [
        { provide: ApolizationService, useValue: mockApolizationService },
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'doc-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApolizationComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Document and mentions loading ---

  it('should load document on init from route param', () => {
    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('doc-1');
    expect(component.document()).toBeTruthy();
    expect(component.document()!.title).toBe('Relatório de Inteligência');
  });

  it('should load mentions on init', () => {
    expect(mockApolizationService.getMentions).toHaveBeenCalledWith('doc-1');
    expect(component.mentions().length).toBe(4);
  });

  // --- Execute apolization ---
  // **Validates: Requirement 10.1**

  it('should execute apolization and update mentions', () => {
    component.executeApolization();

    expect(mockApolizationService.apolloize).toHaveBeenCalledWith('doc-1', {});
    expect(component.mentions().length).toBe(4);
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Apolização concluída',
      }),
    );
  });

  it('should show progress bar during apolization', () => {
    // Simulate processing state
    component.processing.set(true);
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('p-progressbar');
    expect(progressBar).toBeTruthy();
  });

  it('should show error toast with retry on apolization failure', () => {
    mockApolizationService.apolloize.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.executeApolization();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro',
      }),
    );
  });

  // --- Mention list ---
  // **Validates: Requirement 10.2**

  it('should render mentions in table', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.mention-row');
    expect(rows.length).toBe(4);
  });

  // --- Mention status transitions ---
  // **Property 9: Mention status transitions in apolization**
  // **Validates: Requirement 10.4**

  it('should show actions only for SUGGESTED mentions', () => {
    const suggested = mockMentions.filter((m) => m.status === 'SUGGESTED');
    const confirmed = mockMentions.filter((m) => m.status === 'CONFIRMED');
    const rejected = mockMentions.filter((m) => m.status === 'REJECTED');

    expect(suggested.length).toBe(2);
    expect(confirmed.length).toBe(1);
    expect(rejected.length).toBe(1);

    // isSuggested should return true only for SUGGESTED
    expect(component.isSuggested(suggested[0])).toBe(true);
    expect(component.isSuggested(confirmed[0])).toBe(false);
    expect(component.isSuggested(rejected[0])).toBe(false);
  });

  it('should confirm a mention via dialog', () => {
    const suggestedMention = mockMentions[0]; // SUGGESTED
    component.openConfirmDialog(suggestedMention);

    expect(component.showConfirmDialog()).toBe(true);
    expect(component.confirmingMention()).toBe(suggestedMention);

    component.confirmedEntityId.set('entity-123');
    component.confirmMention();

    expect(mockApolizationService.reviewMention).toHaveBeenCalledWith('doc-1', 'mention-1', {
      status: 'CONFIRMED',
      confirmedEntityId: 'entity-123',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Menção confirmada',
      }),
    );
  });

  it('should confirm a mention without entity id', () => {
    const suggestedMention = mockMentions[0];
    component.openConfirmDialog(suggestedMention);
    component.confirmedEntityId.set('');
    component.confirmMention();

    expect(mockApolizationService.reviewMention).toHaveBeenCalledWith('doc-1', 'mention-1', {
      status: 'CONFIRMED',
      confirmedEntityId: undefined,
    });
  });

  it('should reject a mention', () => {
    const suggestedMention = mockMentions[1]; // SUGGESTED
    component.rejectMention(suggestedMention);

    expect(mockApolizationService.reviewMention).toHaveBeenCalledWith('doc-1', 'mention-2', {
      status: 'REJECTED',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        summary: 'Menção rejeitada',
      }),
    );
  });

  it('should update mention in list after confirmation', () => {
    const suggestedMention = mockMentions[0];
    component.openConfirmDialog(suggestedMention);
    component.confirmMention();

    const updated = component.mentions().find((m) => m.id === 'mention-1');
    expect(updated).toBeTruthy();
    expect(updated!.status).toBe('CONFIRMED');
  });

  it('should update mention in list after rejection', () => {
    const suggestedMention = mockMentions[1];
    component.rejectMention(suggestedMention);

    const updated = component.mentions().find((m) => m.id === 'mention-2');
    expect(updated).toBeTruthy();
    expect(updated!.status).toBe('REJECTED');
  });

  // --- Content highlighting ---
  // **Property 10: Mentions highlighted with semantic colors by type**
  // **Validates: Requirement 10.3**

  it('should highlight mentions in content with semantic colors', () => {
    const highlighted = component.highlightedContent();

    expect(highlighted).toContain('mention-highlight');
    expect(highlighted).toContain('#3b82f6'); // PESSOA - blue
    expect(highlighted).toContain('#8b5cf6'); // ORGANIZACAO - purple
    expect(highlighted).toContain('#22c55e'); // LOCAL - green
    expect(highlighted).toContain('#f97316'); // VEICULO - orange
  });

  it('should return correct color for each mention type', () => {
    expect(component.getMentionColor('PESSOA')).toBe('#3b82f6');
    expect(component.getMentionColor('ORGANIZACAO')).toBe('#8b5cf6');
    expect(component.getMentionColor('LOCAL')).toBe('#22c55e');
    expect(component.getMentionColor('VEICULO')).toBe('#f97316');
    expect(component.getMentionColor('TELEFONE')).toBe('#06b6d4');
    expect(component.getMentionColor('DOCUMENTO')).toBe('#6366f1');
    expect(component.getMentionColor('OUTRO')).toBe('#6b7280');
  });

  // --- Summary ---
  // **Validates: Requirement 10.6**

  it('should compute correct summary counts', () => {
    expect(component.totalMentions()).toBe(4);
    expect(component.confirmedCount()).toBe(1);
    expect(component.rejectedCount()).toBe(1);
    expect(component.pendingCount()).toBe(2); // 2 SUGGESTED
  });

  it('should update summary after confirming a mention', () => {
    const suggestedMention = mockMentions[0];
    component.openConfirmDialog(suggestedMention);
    component.confirmMention();

    expect(component.confirmedCount()).toBe(2);
    expect(component.pendingCount()).toBe(1);
  });

  // --- Error handling ---

  it('should show error toast on confirm failure', () => {
    mockApolizationService.reviewMention.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.openConfirmDialog(mockMentions[0]);
    component.confirmMention();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });

  it('should show error toast on reject failure', () => {
    mockApolizationService.reviewMention.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.rejectMention(mockMentions[1]);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });
});
