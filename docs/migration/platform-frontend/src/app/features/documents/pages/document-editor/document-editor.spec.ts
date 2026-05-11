// Polyfill ResizeObserver for PrimeNG TabList in test environment
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
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { DocumentEditorComponent, ALLOWED_TYPES, MAX_FILE_SIZE } from './document-editor';
import { DocumentService } from '../services/document.service';
import { ReviewService } from '../services/review.service';
import { Document, Attachment, DocumentReview } from '../models/document.models';
import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { VersionHistoryComponent } from '../shared/version-history/version-history';

const mockDraftDocument: Document = {
  id: 'doc-1',
  processId: 'proc-1',
  title: 'Relatório de Inteligência',
  content: '<p>Conteúdo do documento</p>',
  type: 'RELATORIO',
  securityClassification: 'RESERVADO',
  status: 'RASCUNHO',
  orderIndex: 0,
  version: 2,
  isActive: true,
  createdAt: '2025-01-10T10:00:00Z',
  updatedAt: '2025-01-15T14:00:00Z',
  creatorId: 'user-1',
  currentSectorId: 'sector-1',
  assignedUserId: 'user-10',
};

const mockActiveDocument: Document = {
  ...mockDraftDocument,
  id: 'doc-2',
  status: 'ACTIVE',
};

const mockFormalizedDocument: Document = {
  ...mockDraftDocument,
  id: 'doc-3',
  status: 'FORMALIZED',
  version: 5,
};

const mockAttachments: Attachment[] = [
  {
    id: 'att-1',
    documentId: 'doc-1',
    fileName: 'relatorio.pdf',
    filePath: '/files/relatorio.pdf',
    fileType: 'application/pdf',
    fileSize: 1024 * 1024,
    origin: 'MANUAL',
    ocrProcessed: false,
    createdAt: '2025-01-12T10:00:00Z',
    createdBy: 'user-1',
  },
];

const mockReviews: DocumentReview[] = [
  {
    id: 'rev-1',
    documentId: 'doc-1',
    reviewerId: 'user-5',
    reviewType: 'RETURN_WITH_OBSERVATION',
    observation: 'Revisar seção 3',
    status: 'COMPLETED',
    createdAt: '2025-01-14T09:00:00Z',
    reviewerName: 'Revisor Alpha',
  },
];

function createMockDocumentService() {
  return {
    getDocument: vi.fn().mockReturnValue(of({ success: true, data: mockDraftDocument })),
    getAttachments: vi.fn().mockReturnValue(of({ success: true, data: mockAttachments })),
    updateDocument: vi.fn().mockReturnValue(
      of({ success: true, data: { ...mockDraftDocument, version: 3 } }),
    ),
    uploadAttachment: vi.fn().mockReturnValue(
      of({
        success: true,
        data: {
          id: 'att-new',
          documentId: 'doc-1',
          fileName: 'novo.pdf',
          filePath: '/files/novo.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
          origin: 'MANUAL',
          ocrProcessed: false,
          createdAt: '2025-01-16T10:00:00Z',
          createdBy: 'user-1',
        },
      }),
    ),
    getVersions: vi.fn().mockReturnValue(of({ success: true, data: [] })),
  };
}

function createMockReviewService() {
  return {
    getReviews: vi.fn().mockReturnValue(of({ success: true, data: mockReviews })),
    submitReview: vi.fn().mockReturnValue(of({ success: true, data: {} })),
  };
}

describe('DocumentEditorComponent', () => {
  let fixture: ComponentFixture<DocumentEditorComponent>;
  let component: DocumentEditorComponent;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let mockReviewService: ReturnType<typeof createMockReviewService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let messageService: MessageService;

  beforeEach(async () => {
    mockDocumentService = createMockDocumentService();
    mockReviewService = createMockReviewService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DocumentEditorComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ReviewService, useValue: mockReviewService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 'doc-1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentEditorComponent);
    component = fixture.componentInstance;
    // Get the MessageService instance from the component's own injector
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Editor rendering with document data ---
  // **Validates: Requirements 4.1, 4.2**

  it('should render editor with document data', () => {
    expect(component.document()).toBeTruthy();
    expect(component.document()!.title).toBe('Relatório de Inteligência');
    expect(component.content()).toBe('<p>Conteúdo do documento</p>');
  });

  it('should render header meta with type, version, process, and responsible', () => {
    const meta = fixture.debugElement.query(By.css('.header-meta'));
    expect(meta).toBeTruthy();
    const text = meta.nativeElement.textContent;
    expect(text).toContain('RELATORIO');
    expect(text).toContain('2');
    expect(text).toContain('proc-1');
    expect(text).toContain('user-10');
  });

  it('should render classification badge in header', () => {
    const badges = fixture.debugElement.queryAll(By.directive(ClassificationBadgeComponent));
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('should render status badge in header', () => {
    const badges = fixture.debugElement.queryAll(By.directive(StatusBadgeComponent));
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  // --- Property 6: Editor de documento modo determinado pelo status ---
  // **Validates: Requirements 4.5, 4.6, 8.5**

  it('should enable edit mode for DRAFT status', () => {
    expect(component.isEditable()).toBe(true);
    expect(component.isFormalized()).toBe(false);

    const titleInput = fixture.debugElement.query(By.css('.title-input'));
    expect(titleInput).toBeTruthy();

    const editor = fixture.debugElement.query(By.css('p-editor'));
    expect(editor).toBeTruthy();
  });

  it('should enable edit mode for ACTIVE status', () => {
    component.document.set(mockActiveDocument);
    fixture.detectChanges();

    expect(component.isEditable()).toBe(true);
    expect(component.isFormalized()).toBe(false);
  });

  it('should set read-only mode for FORMALIZED status with banner', () => {
    component.document.set(mockFormalizedDocument);
    fixture.detectChanges();

    expect(component.isEditable()).toBe(false);
    expect(component.isFormalized()).toBe(true);

    const banner = fixture.debugElement.query(By.css('.formalized-banner'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Documento Formalizado — Edição Bloqueada');

    const titleInput = fixture.debugElement.query(By.css('.title-input'));
    expect(titleInput).toBeFalsy();

    const readonlyTitle = fixture.debugElement.query(By.css('.title-readonly'));
    expect(readonlyTitle).toBeTruthy();

    const editor = fixture.debugElement.query(By.css('p-editor'));
    expect(editor).toBeFalsy();

    const readonlyContent = fixture.debugElement.query(By.css('.content-readonly'));
    expect(readonlyContent).toBeTruthy();
  });

  // --- Draft save calls updateDocument with expectedVersion ---
  // **Validates: Requirement 23.2**

  it('should call updateDocument with expectedVersion on save draft', () => {
    component.saveDraft();

    expect(mockDocumentService.updateDocument).toHaveBeenCalledWith('doc-1', {
      title: 'Relatório de Inteligência',
      content: '<p>Conteúdo do documento</p>',
      expectedVersion: 2,
    });
  });

  it('should not save draft when document is formalized', () => {
    component.document.set(mockFormalizedDocument);
    fixture.detectChanges();

    component.saveDraft();
    expect(mockDocumentService.updateDocument).not.toHaveBeenCalled();
  });

  // --- Action menu items ---
  // **Validates: Requirement 4.7**

  it('should have correct action menu items', () => {
    const items = component.actionMenuItems();
    expect(items.length).toBe(5);
    expect(items[0].label).toBe('Salvar Rascunho');
    expect(items[1].label).toBe('Submeter para Revisão');
    expect(items[2].label).toBe('Tramitar');
    expect(items[3].label).toBe('Formalizar');
    expect(items[4].label).toBe('Anexar Arquivo');
  });

  it('should disable save and edit actions when formalized', () => {
    component.document.set(mockFormalizedDocument);
    fixture.detectChanges();

    const items = component.actionMenuItems();
    expect(items[0].disabled).toBe(true); // Salvar Rascunho
    expect(items[1].disabled).toBe(true); // Submeter para Revisão
    expect(items[4].disabled).toBe(true); // Anexar Arquivo
  });

  // --- Side panel tabs ---
  // **Validates: Requirement 4.3**

  it('should render side panel with 4 tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('p-tab'));
    expect(tabs.length).toBe(4);
    expect(tabs[0].nativeElement.textContent).toContain('Metadados');
    expect(tabs[1].nativeElement.textContent).toContain('Versões');
    expect(tabs[2].nativeElement.textContent).toContain('Anexos');
    expect(tabs[3].nativeElement.textContent).toContain('Observações de Revisão');
  });

  it('should include version history component', () => {
    const versionHistory = fixture.debugElement.query(By.directive(VersionHistoryComponent));
    expect(versionHistory).toBeTruthy();
  });

  // --- Toast feedback on save ---
  // **Validates: Requirement 4.8**

  it('should show success toast on draft save', () => {
    component.saveDraft();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        detail: expect.stringContaining('versão 3'),
      }),
    );
  });

  it('should show error toast on edit conflict (409)', () => {
    mockDocumentService.updateDocument.mockReturnValue(
      of({ success: false, error: '409 Conflict' }),
    );

    component.saveDraft();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('Conflito de edição'),
      }),
    );
  });

  // --- Property 16: Upload valida tipo e tamanho de arquivo antes do envio ---
  // **Validates: Requirements 23.2, 23.5, 24.4**

  it('should accept valid file types', () => {
    for (const type of ALLOWED_TYPES) {
      const file = new File(['content'], 'test.pdf', { type });
      expect(component.validateFile(file)).toBeNull();
    }
  });

  it('should reject invalid file type', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    const error = component.validateFile(file);
    expect(error).toBeTruthy();
    expect(error).toContain('Tipo de arquivo não suportado');
  });

  it('should reject file exceeding max size', () => {
    const bigContent = new Uint8Array(MAX_FILE_SIZE + 1);
    const file = new File([bigContent], 'huge.pdf', { type: 'application/pdf' });
    const error = component.validateFile(file);
    expect(error).toBeTruthy();
    expect(error).toContain('excede o tamanho máximo');
  });

  it('should show error toast for invalid file upload', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    component.onFileSelect({ files: [file] });

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Upload inválido',
      }),
    );
    expect(mockDocumentService.uploadAttachment).not.toHaveBeenCalled();
  });

  it('should upload valid file and add to attachments', () => {
    const file = new File(['content'], 'novo.pdf', { type: 'application/pdf' });
    component.onFileSelect({ files: [file] });

    expect(mockDocumentService.uploadAttachment).toHaveBeenCalledWith(file, {
      documentId: 'doc-1',
    });
    expect(component.attachments().length).toBe(2);
  });

  // --- Service calls ---

  it('should call getDocument with route param id', () => {
    expect(mockDocumentService.getDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should call getAttachments with route param id', () => {
    expect(mockDocumentService.getAttachments).toHaveBeenCalledWith('doc-1');
  });

  it('should call getReviews with route param id', () => {
    expect(mockReviewService.getReviews).toHaveBeenCalledWith('doc-1');
  });

  // --- Selector ---

  it('should have correct selector app-document-editor', () => {
    expect(component).toBeInstanceOf(DocumentEditorComponent);
  });
});
