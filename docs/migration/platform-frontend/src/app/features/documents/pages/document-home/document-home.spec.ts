import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { DocumentHomeComponent, KpiCard } from './document-home';
import { ProcessService } from '../services/process.service';
import { DocumentService } from '../services/document.service';
import { TramitationService } from '../services/tramitation.service';
import { ReviewService } from '../services/review.service';
import { NotificationService } from '../services/notification.service';
import { Document, Tramitation, Notification, DocumentReview } from '../models/document.models';
import { ApiResponse } from '../../../../shared/models/api-response.model';

const mockDrafts: Document[] = [
  {
    id: 'doc-1',
    processId: 'proc-1',
    title: 'Rascunho Alpha',
    type: 'DESPACHO',
    securityClassification: 'PUBLICO',
    status: 'RASCUNHO',
    orderIndex: 0,
    version: 1,
    isActive: true,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
    creatorId: 'user-1',
    currentSectorId: 'sector-1',
  },
];

const mockTramitations: Tramitation[] = [
  {
    id: 'tram-1',
    processId: 'proc-1',
    fromSectorId: 'sector-a',
    toSectorId: 'sector-b',
    userId: 'user-1',
    observation: 'Urgente',
    status: 'PENDING',
    sentAt: '2025-02-01T08:00:00Z',
    fromSectorName: 'Setor A',
    userName: 'João',
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'TRAMITATION',
    entityType: 'documentos',
    entityId: 'proc-1',
    title: 'Nova tramitação',
    message: 'Processo tramitado para seu setor',
    isRead: false,
    createdAt: '2025-02-05T10:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'REVIEW',
    entityType: 'documentos',
    entityId: 'doc-1',
    title: 'Revisão concluída',
    message: 'Documento aprovado',
    isRead: true,
    createdAt: '2025-02-04T09:00:00Z',
  },
];

function createMockProcessService() {
  return {
    getProcesses: vi
      .fn()
      .mockReturnValue(of({ success: true, data: { items: [], total: 12, page: 1, limit: 1 } })),
  };
}

function createMockDocumentService() {
  return {
    getDocuments: vi
      .fn()
      .mockReturnValue(
        of({ success: true, data: { items: mockDrafts, total: 1, page: 1, limit: 5 } }),
      ),
  };
}

function createMockTramitationService() {
  return {
    getPendingTramitations: vi
      .fn()
      .mockReturnValue(
        of({ success: true, data: { items: mockTramitations, total: 3, page: 1, limit: 5 } }),
      ),
  };
}

function createMockReviewService() {
  return {
    getReviews: vi.fn().mockReturnValue(of({ success: true, data: [] })),
  };
}

function createMockNotificationService() {
  return {
    getNotifications: vi
      .fn()
      .mockReturnValue(
        of({ success: true, data: { items: mockNotifications, total: 2, page: 1, limit: 5 } }),
      ),
  };
}

describe('DocumentHomeComponent', () => {
  let fixture: ComponentFixture<DocumentHomeComponent>;
  let component: DocumentHomeComponent;
  let mockProcessService: ReturnType<typeof createMockProcessService>;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let mockTramitationService: ReturnType<typeof createMockTramitationService>;
  let mockReviewService: ReturnType<typeof createMockReviewService>;
  let mockNotificationService: ReturnType<typeof createMockNotificationService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockProcessService = createMockProcessService();
    mockDocumentService = createMockDocumentService();
    mockTramitationService = createMockTramitationService();
    mockReviewService = createMockReviewService();
    mockNotificationService = createMockNotificationService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DocumentHomeComponent],
      providers: [
        { provide: ProcessService, useValue: mockProcessService },
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: TramitationService, useValue: mockTramitationService },
        { provide: ReviewService, useValue: mockReviewService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- KPI Section ---
  // **Validates: Requirement 1.1**

  it('should render KPI cards', () => {
    const kpiCards = fixture.debugElement.queryAll(By.css('.kpi-card'));
    expect(kpiCards.length).toBe(7);
  });

  it('should display correct KPI labels', () => {
    const labels = fixture.debugElement.queryAll(By.css('.kpi-label'));
    const labelTexts = labels.map((el) => el.nativeElement.textContent.trim());
    expect(labelTexts).toContain('Processos Ativos');
    expect(labelTexts).toContain('Rascunhos');
    expect(labelTexts).toContain('Tramitações Pendentes');
    expect(labelTexts).toContain('Aguardando Recebimento');
    expect(labelTexts).toContain('Revisões Pendentes');
    expect(labelTexts).toContain('Formalizados Recentemente');
    expect(labelTexts).toContain('Difusões Pendentes');
  });

  it('should show active processes count from API total', () => {
    const kpis = component.kpis();
    const activeKpi = kpis.find((k) => k.label === 'Processos Ativos');
    expect(activeKpi?.value).toBe(12);
  });

  it('should show pending tramitations count from API total', () => {
    const kpis = component.kpis();
    const tramKpi = kpis.find((k) => k.label === 'Tramitações Pendentes');
    expect(tramKpi?.value).toBe(3);
  });

  // --- Caixa de Entrada Section ---
  // **Validates: Requirement 1.3**

  it('should render pending tramitations in Caixa de Entrada', () => {
    const rows = fixture.debugElement.queryAll(By.css('.clickable-row'));
    // At least one row from tramitations
    const tramSection = fixture.debugElement.queryAll(By.css('.dashboard-section'));
    expect(tramSection.length).toBeGreaterThanOrEqual(1);

    const tramRows = tramSection[1]?.queryAll(By.css('.clickable-row')) ?? [];
    expect(tramRows.length).toBe(1);
    expect(tramRows[0].nativeElement.textContent).toContain('João');
    expect(tramRows[0].nativeElement.textContent).toContain('Setor A');
  });

  // --- Notificações Section ---
  // **Validates: Requirement 1.5**

  it('should render notifications', () => {
    const notifItems = fixture.debugElement.queryAll(By.css('.document-home__notification-item'));
    expect(notifItems.length).toBe(2);
  });

  it('should display notification title and message', () => {
    const firstNotif = fixture.debugElement.queryAll(
      By.css('.document-home__notification-item'),
    )[0];
    expect(firstNotif.nativeElement.textContent).toContain('Nova tramitação');
    expect(firstNotif.nativeElement.textContent).toContain('Processo tramitado para seu setor');
  });

  it('should mark unread notifications with is-unread class', () => {
    const unreadItems = fixture.debugElement.queryAll(
      By.css('.document-home__notification-item.is-unread'),
    );
    expect(unreadItems.length).toBe(1);
  });

  // --- Shortcut Buttons ---
  // **Validates: Requirement 1.6**

  it('should render shortcut buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('p-button'));
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should navigate to wizard on Novo Processo click', () => {
    component.navigateToNewProcess();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos', 'novo']);
  });

  it('should navigate to wizard on Novo Documento click', () => {
    component.navigateToNewDocument();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos', 'novo']);
  });

  // --- Navigation on item click ---
  // **Validates: Requirement 1.8**

  it('should navigate to process on tramitation click', () => {
    component.onTramitationClick(mockTramitations[0]);
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'processos',
      'proc-1',
    ]);
  });

  it('should navigate to editor on draft click', () => {
    component.onDraftClick(mockDrafts[0]);
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'editor',
      'doc-1',
    ]);
  });

  it('should navigate on notification click', () => {
    component.onNotificationClick(mockNotifications[0]);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos', 'proc-1']);
  });

  // --- Filters ---
  // **Validates: Requirement 1.7**

  it('should reload dashboard when filter changes', () => {
    mockProcessService.getProcesses.mockClear();
    mockTramitationService.getPendingTramitations.mockClear();
    mockNotificationService.getNotifications.mockClear();

    component.classificationFilter.set('SIGILOSO');
    component.onFilterChange();

    expect(mockProcessService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ securityClassification: 'SIGILOSO' }),
    );
  });

  // --- Loading state ---

  it('should set loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  // --- Services called on init ---

  it('should call services on init', () => {
    expect(mockProcessService.getProcesses).toHaveBeenCalled();
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalled();
    expect(mockNotificationService.getNotifications).toHaveBeenCalled();
  });

  // --- Sections rendering ---
  // **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  it('should render all dashboard sections', () => {
    const sections = fixture.debugElement.queryAll(By.css('.dashboard-section'));
    expect(sections.length).toBe(4); // Rascunhos, Caixa de Entrada, Pendências, Notificações
  });

  it('should render Indicadores section', () => {
    const kpiSection = fixture.debugElement.query(By.css('.kpi-section'));
    expect(kpiSection).toBeTruthy();
    expect(kpiSection.nativeElement.textContent).toContain('Indicadores');
  });
});
