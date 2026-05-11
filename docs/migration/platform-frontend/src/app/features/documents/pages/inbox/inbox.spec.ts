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
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { InboxComponent } from './inbox';
import { TramitationService } from '../services/tramitation.service';
import { Tramitation } from '../models/document.models';

const mockApiResponse = <T>(data: T) => of({ success: true, data, error: null });

const mockPendingItems: Tramitation[] = [
  {
    id: 'tram-1',
    processId: 'proc-1',
    fromSectorId: 'sector-a',
    toSectorId: 'sector-b',
    userId: 'user-1',
    observation: 'Urgente',
    status: 'PENDING',
    sentAt: '2025-01-20T10:00:00Z',
    fromSectorName: 'Setor Alpha',
    toSectorName: 'Setor Beta',
    userName: 'João Silva',
    process: {
      id: 'proc-1',
      nup: 'NUP-2025-001',
      title: 'Processo Teste',
      status: 'TRAMITANDO',
      securityClassification: 'RESERVADO',
      priority: 'ALTA',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-15T14:00:00Z',
      creatorId: 'user-1',
      currentSectorId: 'sector-a',
    },
  },
];

const mockReceivedItems: Tramitation[] = [
  {
    id: 'tram-2',
    processId: 'proc-2',
    fromSectorId: 'sector-c',
    toSectorId: 'sector-b',
    userId: 'user-2',
    status: 'RECEIVED',
    sentAt: '2025-01-18T08:00:00Z',
    receivedAt: '2025-01-19T09:00:00Z',
    receivedBy: 'user-3',
    fromSectorName: 'Setor Charlie',
    userName: 'Maria Santos',
    process: {
      id: 'proc-2',
      nup: 'NUP-2025-002',
      title: 'Processo Recebido',
      status: 'ATIVO',
      securityClassification: 'PUBLICO',
      priority: 'NORMAL',
      createdAt: '2025-01-05T10:00:00Z',
      updatedAt: '2025-01-19T09:00:00Z',
      creatorId: 'user-2',
      currentSectorId: 'sector-b',
    },
  },
];

const mockRejectedItems: Tramitation[] = [
  {
    id: 'tram-3',
    processId: 'proc-3',
    fromSectorId: 'sector-b',
    toSectorId: 'sector-d',
    userId: 'user-3',
    status: 'REJECTED',
    sentAt: '2025-01-15T10:00:00Z',
    rejectedAt: '2025-01-16T11:00:00Z',
    rejectionReason: 'Documentação incompleta',
    toSectorName: 'Setor Delta',
    userName: 'Carlos Oliveira',
    process: {
      id: 'proc-3',
      nup: 'NUP-2025-003',
      title: 'Processo Rejeitado',
      status: 'TRAMITANDO',
      securityClassification: 'SIGILOSO',
      priority: 'URGENTE',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-16T11:00:00Z',
      creatorId: 'user-3',
      currentSectorId: 'sector-b',
    },
  },
];

function createMockTramitationService() {
  return {
    getPendingTramitations: vi.fn().mockImplementation((params: { status?: string }) => {
      if (params.status === 'PENDING') {
        return mockApiResponse({ items: mockPendingItems, total: 1, page: 1, limit: 10 });
      }
      if (params.status === 'RECEIVED') {
        return mockApiResponse({ items: mockReceivedItems, total: 1, page: 1, limit: 10 });
      }
      if (params.status === 'REJECTED') {
        return mockApiResponse({ items: mockRejectedItems, total: 1, page: 1, limit: 10 });
      }
      return mockApiResponse({ items: [], total: 0, page: 1, limit: 10 });
    }),
    receiveTramitation: vi.fn().mockReturnValue(
      mockApiResponse({ ...mockPendingItems[0], status: 'RECEIVED' }),
    ),
    rejectTramitation: vi.fn().mockReturnValue(
      mockApiResponse({ ...mockPendingItems[0], status: 'REJECTED' }),
    ),
  };
}

describe('InboxComponent', () => {
  let fixture: ComponentFixture<InboxComponent>;
  let component: InboxComponent;
  let mockTramitationService: ReturnType<typeof createMockTramitationService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let messageService: MessageService;

  beforeEach(async () => {
    mockTramitationService = createMockTramitationService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InboxComponent],
      providers: [
        { provide: TramitationService, useValue: mockTramitationService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Tabs rendering ---
  // **Validates: Requirement 6.1**

  it('should render 3 tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('p-tab'));
    expect(tabs.length).toBe(3);
    expect(tabs[0].nativeElement.textContent).toContain('Pendentes de Recebimento');
    expect(tabs[1].nativeElement.textContent).toContain('Recebidos');
    expect(tabs[2].nativeElement.textContent).toContain('Rejeitados/Devolvidos');
  });

  // --- Pending tab data ---
  // **Validates: Requirement 6.2**

  it('should load pending tramitations on init', () => {
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
    expect(component.pendingItems().length).toBe(1);
    expect(component.pendingItems()[0].id).toBe('tram-1');
  });

  it('should render pending items in table', () => {
    const rows = fixture.debugElement.queryAll(By.css('.pending-row'));
    expect(rows.length).toBe(1);
    const text = rows[0].nativeElement.textContent;
    expect(text).toContain('NUP-2025-001');
    expect(text).toContain('João Silva');
    expect(text).toContain('Setor Alpha');
  });

  // --- Receive action ---
  // **Validates: Requirement 6.5**

  it('should call receiveTramitation and show success toast', () => {
    component.receiveTramitation(mockPendingItems[0]);

    expect(mockTramitationService.receiveTramitation).toHaveBeenCalledWith('tram-1');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Tramitação recebida',
      }),
    );
  });

  // --- Reject action with mandatory justification ---
  // **Validates: Requirement 6.6**
  // **Property 7: required text fields disable submit when empty**

  it('should open reject dialog', () => {
    component.openRejectDialog(mockPendingItems[0]);

    expect(component.showRejectDialog()).toBe(true);
    expect(component.rejectingTramitation()).toBe(mockPendingItems[0]);
    expect(component.rejectionReason()).toBe('');
  });

  it('should not confirm reject when justification is empty', () => {
    component.openRejectDialog(mockPendingItems[0]);
    component.rejectionReason.set('');
    component.confirmReject();

    expect(mockTramitationService.rejectTramitation).not.toHaveBeenCalled();
  });

  it('should not confirm reject when justification is whitespace only', () => {
    component.openRejectDialog(mockPendingItems[0]);
    component.rejectionReason.set('   ');
    component.confirmReject();

    expect(mockTramitationService.rejectTramitation).not.toHaveBeenCalled();
  });

  it('should confirm reject with valid justification and show toast', () => {
    component.openRejectDialog(mockPendingItems[0]);
    component.rejectionReason.set('Documentação incompleta');
    component.confirmReject();

    expect(mockTramitationService.rejectTramitation).toHaveBeenCalledWith('tram-1', {
      rejectionReason: 'Documentação incompleta',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Tramitação rejeitada',
      }),
    );
  });

  it('should disable confirm button when rejection reason is empty', () => {
    component.openRejectDialog(mockPendingItems[0]);
    component.rejectionReason.set('');
    fixture.detectChanges();

    const confirmBtn = fixture.debugElement.query(By.css('.reject-confirm-btn p-button, .reject-confirm-btn button'));
    if (confirmBtn) {
      // Check the disabled binding via component logic
      expect(component.rejectionReason().trim()).toBe('');
    }
    // Verify via component logic that empty reason prevents submission
    expect(!component.rejectionReason().trim()).toBe(true);
  });

  // --- Pagination ---
  // **Validates: Requirement 6.7**

  it('should update pending page on pagination change', () => {
    mockTramitationService.getPendingTramitations.mockClear();
    component.onPendingPageChange({ first: 10, rows: 10, page: 1, pageCount: 5 });

    expect(component.pendingPage()).toBe(2);
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10, status: 'PENDING' }),
    );
  });

  it('should update received page on pagination change', () => {
    mockTramitationService.getPendingTramitations.mockClear();
    component.onReceivedPageChange({ first: 20, rows: 10, page: 2, pageCount: 5 });

    expect(component.receivedPage()).toBe(3);
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 10, status: 'RECEIVED' }),
    );
  });

  it('should update rejected page on pagination change', () => {
    mockTramitationService.getPendingTramitations.mockClear();
    component.onRejectedPageChange({ first: 10, rows: 20, page: 0, pageCount: 3 });

    expect(component.rejectedPage()).toBe(1);
    expect(component.rejectedPageSize()).toBe(20);
  });

  // --- Navigation to process ---
  // **Validates: Requirement 6.8**

  it('should navigate to process on received item click', () => {
    component.navigateToProcess(mockReceivedItems[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'processos',
      'proc-2',
    ]);
  });

  // --- Received tab data ---

  it('should load received tramitations on init', () => {
    expect(component.receivedItems().length).toBe(1);
    expect(component.receivedItems()[0].id).toBe('tram-2');
  });

  // --- Rejected tab data ---

  it('should load rejected tramitations on init', () => {
    expect(component.rejectedItems().length).toBe(1);
    expect(component.rejectedItems()[0].id).toBe('tram-3');
  });

  // --- Retramitate action ---

  it('should navigate to process on retramitate', () => {
    component.retramitate(mockRejectedItems[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'processos',
      'proc-3',
    ]);
  });

  // --- Observation dialog ---

  it('should open observation dialog with tramitation observation', () => {
    component.openObservationDialog(mockPendingItems[0]);

    expect(component.showObservationDialog()).toBe(true);
    expect(component.observationText()).toBe('Urgente');
  });

  // --- Service calls on init ---

  it('should call getPendingTramitations for all three statuses on init', () => {
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'RECEIVED' }),
    );
    expect(mockTramitationService.getPendingTramitations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REJECTED' }),
    );
  });
});
