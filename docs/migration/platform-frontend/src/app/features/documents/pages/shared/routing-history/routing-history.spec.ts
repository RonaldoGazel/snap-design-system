import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { RoutingHistoryComponent } from './routing-history';
import { TramitationService } from '../../services/tramitation.service';
import { Tramitation, TramitationStatus } from '../../models/document.models';
import { ApiResponse } from '../../../../../shared/models/api-response.model';

const mockTramitations: Tramitation[] = [
  {
    id: 'tram-1',
    processId: 'proc-1',
    fromSectorId: 'sector-a',
    toSectorId: 'sector-b',
    userId: 'user-1',
    observation: 'Encaminhamento inicial',
    status: 'PENDING' as TramitationStatus,
    sentAt: '2025-01-15T10:00:00Z',
    fromSectorName: 'Setor Alpha',
    toSectorName: 'Setor Beta',
    userName: 'João Silva',
  },
  {
    id: 'tram-3',
    processId: 'proc-1',
    fromSectorId: 'sector-b',
    toSectorId: 'sector-c',
    userId: 'user-2',
    status: 'REJECTED' as TramitationStatus,
    sentAt: '2025-03-10T14:00:00Z',
    rejectedAt: '2025-03-11T09:00:00Z',
    rejectionReason: 'Documentação incompleta',
    fromSectorName: 'Setor Beta',
    toSectorName: 'Setor Gamma',
    userName: 'Maria Santos',
  },
  {
    id: 'tram-2',
    processId: 'proc-1',
    fromSectorId: 'sector-a',
    toSectorId: 'sector-c',
    userId: 'user-3',
    observation: 'Urgente',
    status: 'RECEIVED' as TramitationStatus,
    sentAt: '2025-02-20T08:30:00Z',
    receivedAt: '2025-02-20T09:00:00Z',
    receivedBy: 'user-4',
    fromSectorName: 'Setor Alpha',
    toSectorName: 'Setor Gamma',
    userName: 'Carlos Oliveira',
  },
];

function createMockTramitationService(
  response: ApiResponse<Tramitation[]> = { success: true, data: mockTramitations },
) {
  return {
    getTramitationHistory: vi.fn().mockReturnValue(of(response)),
  };
}

@Component({
  standalone: true,
  imports: [RoutingHistoryComponent],
  template: `<app-routing-history [processId]="processId()" />`,
})
class TestHostComponent {
  processId = signal<string | undefined>(undefined);
}

describe('RoutingHistoryComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockService: ReturnType<typeof createMockTramitationService>;

  beforeEach(async () => {
    mockService = createMockTramitationService();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: TramitationService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  // --- Property 4: RoutingHistory timeline ordenada cronologicamente ---
  // **Validates: Requirements 13.3**

  it('should display tramitations sorted from most recent to oldest', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.routing-history__card'));
    expect(cards.length).toBe(3);

    // First card: tram-3 (most recent: 2025-03-10)
    expect(cards[0].nativeElement.textContent).toContain('Setor Beta');
    expect(cards[0].nativeElement.textContent).toContain('Setor Gamma');
    expect(cards[0].nativeElement.textContent).toContain('Maria Santos');

    // Second card: tram-2 (2025-02-20)
    expect(cards[1].nativeElement.textContent).toContain('Setor Alpha');
    expect(cards[1].nativeElement.textContent).toContain('Setor Gamma');
    expect(cards[1].nativeElement.textContent).toContain('Carlos Oliveira');

    // Third card: tram-1 (oldest: 2025-01-15)
    expect(cards[2].nativeElement.textContent).toContain('Setor Alpha');
    expect(cards[2].nativeElement.textContent).toContain('Setor Beta');
    expect(cards[2].nativeElement.textContent).toContain('João Silva');
  });

  // --- Property 5: RoutingHistory diferenciação visual por status de tramitação ---
  // **Validates: Requirements 13.5**

  it('should apply routing-history__card--received class for RECEIVED tramitations', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.routing-history__card'));
    const receivedCard = cards.find((c) => c.nativeElement.textContent.includes('Carlos Oliveira'));
    expect(receivedCard).toBeTruthy();
    expect(receivedCard!.nativeElement.classList.contains('routing-history__card--received')).toBe(
      true,
    );
  });

  it('should apply routing-history__card--pending class for PENDING tramitations', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.routing-history__card'));
    const pendingCard = cards.find((c) => c.nativeElement.textContent.includes('João Silva'));
    expect(pendingCard).toBeTruthy();
    expect(pendingCard!.nativeElement.classList.contains('routing-history__card--pending')).toBe(
      true,
    );
  });

  it('should apply routing-history__card--rejected class for REJECTED tramitations', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.routing-history__card'));
    const rejectedCard = cards.find((c) => c.nativeElement.textContent.includes('Maria Santos'));
    expect(rejectedCard).toBeTruthy();
    expect(rejectedCard!.nativeElement.classList.contains('routing-history__card--rejected')).toBe(
      true,
    );
  });

  it('should render p-tag with correct severity for each status', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const tags = fixture.debugElement.queryAll(By.css('p-tag'));
    expect(tags.length).toBe(3);

    // Tags are in sorted order: REJECTED (tram-3), RECEIVED (tram-2), PENDING (tram-1)
    const severities = tags.map((t) => t.componentInstance.severity);
    const values = tags.map((t) => t.componentInstance.value);

    expect(severities).toContain('danger');
    expect(severities).toContain('success');
    expect(severities).toContain('warn');

    expect(values).toContain('REJEITADO');
    expect(values).toContain('RECEBIDO');
    expect(values).toContain('PENDENTE');
  });

  // --- Empty state ---

  it('should show empty state when no tramitations exist', () => {
    mockService.getTramitationHistory.mockReturnValue(of({ success: true, data: [] }));

    host.processId.set('proc-1');
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.routing-history__empty'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('Nenhuma tramitação registrada');

    const timeline = fixture.debugElement.query(By.css('p-timeline'));
    expect(timeline).toBeNull();
  });

  // --- Service interaction ---

  it('should call service with correct processId', () => {
    host.processId.set('proc-42');
    fixture.detectChanges();

    expect(mockService.getTramitationHistory).toHaveBeenCalledWith('proc-42');
  });

  it('should not call service when processId is undefined', () => {
    host.processId.set(undefined);
    fixture.detectChanges();

    expect(mockService.getTramitationHistory).not.toHaveBeenCalled();
  });

  // --- Display details ---

  it('should display observation when present', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const observations = fixture.debugElement.queryAll(By.css('.routing-history__observation'));
    expect(observations.length).toBe(2); // tram-1 and tram-2 have observations

    const texts = observations.map((o) => o.nativeElement.textContent.trim());
    expect(texts).toContain('Encaminhamento inicial');
    expect(texts).toContain('Urgente');
  });

  it('should have correct selector app-routing-history', () => {
    host.processId.set('proc-1');
    fixture.detectChanges();

    const component = fixture.debugElement.query(By.directive(RoutingHistoryComponent));
    expect(component).toBeTruthy();
    expect(component.nativeElement.tagName.toLowerCase()).toBe('app-routing-history');
  });
});
