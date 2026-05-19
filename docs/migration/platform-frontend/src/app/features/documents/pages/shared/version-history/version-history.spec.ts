import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { VersionHistoryComponent } from './version-history';
import { DocumentService } from '../../services/document.service';
import { DocumentVersion } from '../../models/document.models';
import { ApiResponse } from '../../../../../shared/models/api-response.model';

const mockVersions: DocumentVersion[] = [
  {
    id: 'ver-1',
    documentId: 'doc-1',
    version: 1,
    title: 'Versão Inicial',
    content: '<p>Conteúdo v1</p>',
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-a',
  },
  {
    id: 'ver-3',
    documentId: 'doc-1',
    version: 3,
    title: 'Versão Final',
    content: '<p>Conteúdo v3</p>',
    createdAt: '2025-03-01T00:00:00Z',
    createdBy: 'user-c',
  },
  {
    id: 'ver-2',
    documentId: 'doc-1',
    version: 2,
    title: 'Versão Revisada',
    content: '<p>Conteúdo v2</p>',
    createdAt: '2025-02-01T00:00:00Z',
    createdBy: 'user-b',
  },
];

function createMockDocumentService(
  response: ApiResponse<DocumentVersion[]> = { success: true, data: mockVersions },
) {
  return {
    getVersions: vi.fn().mockReturnValue(of(response)),
  };
}

@Component({
  standalone: true,
  imports: [VersionHistoryComponent],
  template: `<app-version-history [documentId]="documentId()" />`,
})
class TestHostComponent {
  documentId = signal<string | undefined>(undefined);
}

describe('VersionHistoryComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockService: ReturnType<typeof createMockDocumentService>;

  beforeEach(async () => {
    mockService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: DocumentService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  // --- Property 3: VersionHistory timeline ordenada cronologicamente ---
  // **Validates: Requirements 12.3**

  it('should display versions sorted from most recent to oldest', () => {
    host.documentId.set('doc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.version-card'));
    expect(cards.length).toBe(3);

    // First card should be version 3 (most recent: 2025-03-01)
    expect(cards[0].nativeElement.textContent).toContain('Versão 3');
    // Second card should be version 2 (2025-02-01)
    expect(cards[1].nativeElement.textContent).toContain('Versão 2');
    // Third card should be version 1 (oldest: 2025-01-01)
    expect(cards[2].nativeElement.textContent).toContain('Versão 1');
  });

  it('should display version number, author, and date for each version', () => {
    host.documentId.set('doc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.version-card'));
    const firstCard = cards[0].nativeElement.textContent;

    expect(firstCard).toContain('Versão 3');
    expect(firstCard).toContain('user-c');
  });

  it('should mark the most recent version as current', () => {
    host.documentId.set('doc-1');
    fixture.detectChanges();

    const badges = fixture.debugElement.queryAll(By.css('.current-badge'));
    expect(badges.length).toBe(1);

    // The current badge should be on the first card (most recent)
    const firstCard = fixture.debugElement.queryAll(By.css('.version-card'))[0];
    const badge = firstCard.query(By.css('.current-badge'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('Atual');
  });

  it('should open dialog with version content when clicking a version card', () => {
    host.documentId.set('doc-1');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.version-card'));
    cards[0].triggerEventHandler('click', null);
    fixture.detectChanges();

    const dialogHeader = fixture.debugElement.query(By.css('.version-dialog-header'));
    expect(dialogHeader).toBeTruthy();
    expect(dialogHeader.nativeElement.textContent).toContain('Versão 3');
    expect(dialogHeader.nativeElement.textContent).toContain('Versão Final');

    const dialogContent = fixture.debugElement.query(By.css('.version-content'));
    expect(dialogContent).toBeTruthy();
    expect(dialogContent.nativeElement.innerHTML).toContain('Conteúdo v3');
  });

  it('should show empty state when no versions exist', () => {
    mockService.getVersions.mockReturnValue(of({ success: true, data: [] }));

    host.documentId.set('doc-1');
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('Nenhuma versão registrada');

    const timeline = fixture.debugElement.query(By.css('p-timeline'));
    expect(timeline).toBeNull();
  });

  it('should not call service when documentId is undefined', () => {
    host.documentId.set(undefined);
    fixture.detectChanges();

    expect(mockService.getVersions).not.toHaveBeenCalled();
  });

  it('should call service with correct documentId', () => {
    host.documentId.set('doc-42');
    fixture.detectChanges();

    expect(mockService.getVersions).toHaveBeenCalledWith('doc-42');
  });

  it('should have correct selector app-version-history', () => {
    host.documentId.set('doc-1');
    fixture.detectChanges();

    const component = fixture.debugElement.query(By.directive(VersionHistoryComponent));
    expect(component).toBeTruthy();
    expect(component.nativeElement.tagName.toLowerCase()).toBe('app-version-history');
  });
});
